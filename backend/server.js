import express from 'express';
import cors from 'cors';
import dataRoutes from './routes/dataRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Api Routes
app.use('/api', dataRoutes);

app.get('/', (req, res) => {
  res.send('OEC Backend API is running.');
});

app.listen(PORT, () => {
  console.log(`Servidor Backend ejecutándose en http://localhost:${PORT}`);
});
