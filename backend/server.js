import express from 'express';
import cors from 'cors';
import { getAuthDb } from './authDb.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import auditorRoutes from './routes/auditorRoutes.js';
import { startCronJobs } from './services/cronService.js';
import { connectDB } from './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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

startServer();
