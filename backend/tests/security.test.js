import request from 'supertest';
import { getAuthDb } from '../authDb.js';

describe('Pruebas de Seguridad y Anti-DoS', () => {
  let app;
  
  beforeAll(async () => {
    process.env.TEST_RATE_LIMIT = 'true';
    const serverModule = await import('../server.js');
    app = serverModule.app;
    
    // Inicializar DB en memoria si no está lista
    await getAuthDb();
  });

  it('debe rechazar solicitudes después de exceder el límite (Prevención DoS)', async () => {
    // Simularemos múltiples peticiones rápidamente
    // Como el límite global en test es de 30, haremos 31 peticiones
    let res;
    
    // Hacemos 30 peticiones válidas
    for (let i = 0; i < 30; i++) {
      res = await request(app).get('/api/auth/config');
    }

    // La petición 31 debe ser bloqueada
    res = await request(app).get('/api/auth/config');
    
    expect(res.statusCode).toBe(429); // 429 Too Many Requests
    expect(res.body.message).toMatch(/Demasiadas solicitudes/i);
  }, 15000); // Dar 15 segundos para completar este bucle
});
