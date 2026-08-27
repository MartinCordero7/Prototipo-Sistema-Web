import { getAuthDb } from './authDb.js';
import bcrypt from 'bcryptjs';

async function migrate() {
  const db = await getAuthDb();
  console.log('Iniciando migración de contraseñas a Bcrypt...');

  const usuarios = await db.all('SELECT id, username, password FROM usuarios');
  let actualizados = 0;

  for (const user of usuarios) {
    // Si la contraseña no comienza con un prefijo de bcrypt (ej. $2a$), se asume que es texto plano
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      const hashed = bcrypt.hashSync(user.password, 10);
      await db.run('UPDATE usuarios SET password = ? WHERE id = ?', [hashed, user.id]);
      console.log(`[MIGRADO] Usuario: ${user.username}`);
      actualizados++;
    }
  }

  console.log(`Migración completada. ${actualizados} usuarios fueron encriptados.`);
  process.exit(0);
}

migrate();
