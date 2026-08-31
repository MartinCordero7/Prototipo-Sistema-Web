import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'usuarios.sqlite');

let dbInstance = null;

export const getAuthDb = async () => {
  if (dbInstance) {
    return dbInstance;
  }

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

  await db.exec(`
    CREATE TABLE IF NOT EXISTS delegados_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comercializadora TEXT NOT NULL,
      estado TEXT NOT NULL,
      nombre_delegado TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      oficio TEXT NOT NULL
    );
  `);

  await db.run(`
    INSERT OR IGNORE INTO configuracion (llave, valor)
    VALUES ('hora_cierre', '12')
  `);

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN intentos_fallidos INTEGER DEFAULT 0;`);
  } catch (error) {
    // Ya existe
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN bloqueado_hasta TEXT DEFAULT NULL;`);
  } catch (error) {
    // Ya existe
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN correo TEXT DEFAULT NULL;`);
  } catch (error) {
    // Ya existe
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN cambio_clave_pendiente INTEGER DEFAULT 1;`);
  } catch (error) {
    // Ya existe
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN es_auditor INTEGER DEFAULT 0;`);
  } catch (error) {
    // Ya existe
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN reset_token TEXT DEFAULT NULL;`);
  } catch (error) {
    // Ya existe
  }

  try {
    await db.exec(`ALTER TABLE usuarios ADD COLUMN reset_token_expires TEXT DEFAULT NULL;`);
  } catch (error) {
    // Ya existe
  }

  try {
    await db.exec(`ALTER TABLE delegados_auditoria ADD COLUMN username TEXT DEFAULT NULL;`);
  } catch (error) {
    // Ya existe
  }

  const adminInitPassword = process.env.ADMIN_INIT_PASSWORD || 'admin123';
  const adminHash = bcrypt.hashSync(adminInitPassword, 10);
  // Insertar usuario administrador si no existe
  await db.run(`
    INSERT OR IGNORE INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, cambio_clave_pendiente)
    VALUES ('admin_id', 'admin_arch', ?, 'ADMINISTRADOR SISTEMA', 'ADMINISTRADOR', 0, NULL, 1)
  `, [adminHash]);

  // Asegurar que si el administrador ya existe, se respete su estado (no forzamos cambio de clave aquí a menos que sea nuevo)
  // El insert ignore arriba ya inserta con cambio_clave_pendiente = 1 si es nuevo.

  const testHash = bcrypt.hashSync('password123', 10);
  // Insertar usuario de prueba
  await db.run(`
    INSERT OR IGNORE INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, cambio_clave_pendiente)
    VALUES ('test_id', 'test_user', ?, 'ESTACION DE PRUEBA', 'TERPEL', 0, NULL, 1)
  `, [testHash]);

  // Asegurar que los auditores existentes tengan el flag
  await db.run(`UPDATE usuarios SET es_auditor = 1 WHERE nombre_estacion = 'AUDITORIA'`);

  dbInstance = db;
  return dbInstance;
};

