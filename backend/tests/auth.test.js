import request from 'supertest';
import { app } from '../server.js';
import { getAuthDb } from '../authDb.js';

describe('API de Autenticación', () => {
  let db;

  beforeAll(async () => {
    db = await getAuthDb();
  });

  describe('POST /api/auth/login', () => {
    it('debe rechazar un login sin usuario o contraseña', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      // En la implementación actual, si falta usuario puede que no falle en 400 sino en 401 si no lo encuentra.
      // Vamos a verificar que falle la autenticación (HTTP 401 o 400)
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar un login con usuario inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'fantasma', password: '123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/incorrectos/i);
    });

    it('debe incrementar intentos fallidos y bloquear a la cuenta a los 3 intentos', async () => {
      const username = 'test_user'; // Usuario que sabemos existe de la BD mock

      // Intento 1
      let res = await request(app)
        .post('/api/auth/login')
        .send({ username, password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/Intento \d\/3/);

      // Intento 2
      res = await request(app)
        .post('/api/auth/login')
        .send({ username, password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(401);

      // Intento 3 (Bloqueo)
      res = await request(app)
        .post('/api/auth/login')
        .send({ username, password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Cuenta bloqueada/i);

      // Desbloquear para otras pruebas (limpieza)
      await db.run('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE username = ?', [username]);
    });

    it('debe estar protegido contra inyecciones SQL en el usuario', async () => {
      // Como usamos SQLite y pasamos el valor por array [username], las inyecciones no se evalúan,
      // la base de datos buscará literalmente un usuario llamado "' OR '1'='1"
      const payloadMalicioso = "' OR '1'='1";
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: payloadMalicioso, password: '123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
