import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'usuarios.sqlite');

export const getAuthDb = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre_estacion TEXT NOT NULL,
      comercializadora TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (
      llave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);

  await db.run(`
    INSERT OR IGNORE INTO configuracion (llave, valor)
    VALUES ('hora_cierre', '12')
  `);

  // Intentamos agregar las columnas de seguridad si no existen.
  // SQLite arrojará error si la columna ya existe, por eso usamos try/catch individual.
  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN intentos_fallidos INTEGER DEFAULT 0;`);
  } catch (error) {
    // La columna ya existe, no hacemos nada
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN bloqueado_hasta TEXT DEFAULT NULL;`);
  } catch (error) {
    // La columna ya existe, no hacemos nada
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN correo TEXT DEFAULT NULL;`);
  } catch (error) {
    // La columna ya existe, no hacemos nada
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN cambio_clave_pendiente INTEGER DEFAULT 1;`);
  } catch (error) {
    // La columna ya existe, no hacemos nada
  }

  // Insertar usuario administrador si no existe
  await db.run(`
    INSERT OR IGNORE INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, cambio_clave_pendiente)
    VALUES ('admin_id', 'admin_arch', 'admin123', 'ADMINISTRADOR SISTEMA', 'ADMINISTRADOR', 0, NULL, 0)
  `);

  // Asegurarnos de que el administrador existente NO tenga cambio pendiente
  await db.run(`
    UPDATE usuarios SET cambio_clave_pendiente = 0 WHERE username = 'admin_arch'
  `);

  // Insertar usuario de prueba didáctico
  await db.run(`
    INSERT OR IGNORE INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, cambio_clave_pendiente)
    VALUES ('test_id', 'test_user', 'password123', 'ESTACION DE PRUEBAS', 'PRIMAX', 0, NULL, 1)
  `);

  return db;
};

