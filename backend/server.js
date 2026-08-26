import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auditorRoutes from './routes/auditorRoutes.js';
import { connectDB } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Api Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auditor', auditorRoutes);

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
