import request from 'supertest';
import { app } from '../server.js';
import { getAuthDb } from '../authDb.js';
import jwt from 'jsonwebtoken';

const generateTestCookie = () => {
  const token = jwt.sign(
    { id: 'test_id', username: 'test_user', role: 'ESTACION' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return `token=${token}`;
};

describe('API de Ingreso de Datos', () => {
  let db;

  beforeAll(async () => {
    db = await getAuthDb();
  });

  describe('POST /api/submit', () => {
    it('debe rechazar si falta información obligatoria (ej. sin centro)', async () => {
      const res = await request(app)
        .post('/api/submit')
        .set('Cookie', generateTestCookie())
        .send({
          fecha: '2026-08-27T10:00',
          productosSeleccionados: ['Diésel Premium'],
          stocks: { 'Diésel Premium': 1000 },
          aceptaRealidad: true,
          correoUsuario: 'test@example.com'
        });

      // Nuestro backend podría no validarlo en Express, pero SQLite fallará por NOT NULL o la app fallará antes
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('debe registrar un envío exitoso y bloquear duplicados en el mismo día', async () => {
      const payload = {
        centroId: 'Test Centro',
        fecha: new Date().toISOString().slice(0, 16),
        productosSeleccionados: ['Gasolina Extra'],
        stocks: { 'Gasolina Extra': 500 },
        aceptaRealidad: true,
        correoUsuario: 'test2@test.com',
        nombreCentro: 'ESTACION DE PRUEBAS'
      };

      // 1er Envío (Debe ser exitoso)
      const res1 = await request(app)
        .post('/api/submit')
        .set('Cookie', generateTestCookie())
        .send(payload);
      
      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);

      // 2do Envío (Debe detectar el duplicado y devolver 400)
      const res2 = await request(app)
        .post('/api/submit')
        .set('Cookie', generateTestCookie())
        .send(payload);
      
      expect(res2.statusCode).toBe(400);
      expect(res2.body.message).toMatch(/No se permiten registros duplicados/i);

      // Limpieza de la DB
      await db.run('DELETE FROM stock_diario WHERE correo_usuario = ?', [payload.correoUsuario]);
    });

    it('debe rechazar si el valor de stock es mayor a 50,000 o menor a 0', async () => {
      const payload = {
        centroId: 'Test Centro',
        fecha: new Date().toISOString().slice(0, 16),
        productosSeleccionados: ['Diésel Premium'],
        stocks: { 'Diésel Premium': 999999 }, // Valor exagerado
        aceptaRealidad: true,
        correoUsuario: 'hacker@example.com',
        nombreCentro: 'ESTACION TEST'
      };

      const res = await request(app)
        .post('/api/submit')
        .set('Cookie', generateTestCookie())
        .send(payload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/entre 0 y 50,000/i);
    });
  });
});
