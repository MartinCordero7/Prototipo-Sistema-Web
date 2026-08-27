import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getAuthDb } from './authDb.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import auditorRoutes from './routes/auditorRoutes.js';
import { startCronJobs } from './services/cronService.js';
import { connectDB } from './db.js';

const app = express();
const PORT = 3000;

// Seguridad de cabeceras HTTP
app.use(helmet());

// Configuracion de CORS (Ajustar origin al dominio real en produccion)
app.use(cors());
app.use(express.json());

// Prevención de ataques DoS (Límite de solicitudes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'test' ? 30 : 200, // Limitar a 30 en pruebas, 200 en producción
  message: { success: false, message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente en 15 minutos.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Aplicar el limitador a todas las rutas de la API, excepto en los tests generales
if (process.env.NODE_ENV !== 'test' || process.env.TEST_RATE_LIMIT === 'true') {
  app.use('/api/', apiLimiter);
}

// Iniciar base de datos local SQLite
getAuthDb().then(() => {
  console.log('Base de datos SQLite local lista.');
  // Iniciar tareas programadas
  startCronJobs();
}).catch(err => {
  console.error('Error inicializando SQLite local:', err);
});

// Api Routes
app.use('/api', dataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auditor', auditorRoutes);

app.get('/', (req, res) => {
  res.send('OEC Backend API is running.');
});

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Servidor Backend ejecutándose en http://localhost:${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };
