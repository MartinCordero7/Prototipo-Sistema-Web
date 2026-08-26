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

  await db.exec(`
    DROP TABLE IF EXISTS stock_diario;
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS stock_diario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marca_temporal TEXT NOT NULL,
      fecha_stock TEXT NOT NULL,
      correo_usuario TEXT NOT NULL,
      nombre_centro TEXT NOT NULL,
      diesel_premium INTEGER DEFAULT 0,
      gasolina_extra INTEGER DEFAULT 0,
      gasolina_extra_etanol INTEGER DEFAULT 0,
      gasolina_super INTEGER DEFAULT 0,
      gasolina_pesca_artesanal INTEGER DEFAULT 0,
      acepta_envio INTEGER NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS alertas_diarias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
      correo_destinatario TEXT NOT NULL,
      nombre_centro TEXT NOT NULL,
      estado TEXT NOT NULL
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
    VALUES ('test_id', 'test_user', 'password123', 'ESTACION DE PRUEBA', 'TERPEL', 0, NULL, 1)
  `);

  // Crear cuentas maestras para los 19 sujetos de control (Auditores)
  const COMERCIALIZADORAS = [
    'Clyan', 'Comdecsa', 'Copedesa', 'Ecucomsa', 'Energy Lider', 
    'Energygas', 'Ep petroecuador', 'Gaspetrolium', 'Lisroni', 
    'Masgas', 'Pdv Ecuador', 'Petroleos y servicios', 'Petrolrios', 
    'Petromar', 'PetroWorld', 'Primax', 'Rexcomer', 'Servioil', 'Terpel'
  ];

  for (const org of COMERCIALIZADORAS) {
    const username = `auditor_${org.toLowerCase().replace(/ /g, '_')}`;
    const id = `aud_${org.replace(/ /g, '')}`;
    await db.run(`
      INSERT OR IGNORE INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, cambio_clave_pendiente)
      VALUES (?, ?, ?, ?, ?, 0, NULL, 1)
    `, [id, username, 'auditor123', 'AUDITORIA', org.toUpperCase()]);
  }

  return db;
};
