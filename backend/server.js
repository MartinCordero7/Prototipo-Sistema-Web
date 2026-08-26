import express from 'express';
import cors from 'cors';
import dataRoutes from './routes/dataRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { connectDB } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Api Routes
app.use('/api', dataRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('OEC Backend API is running.');
});

// Iniciar servidor solo después de conectar a Oracle
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Servidor Backend ejecutándose en http://localhost:${PORT}`);
  });
};

startServer();
