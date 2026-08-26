import express from 'express';
import { getEstadoDiario } from '../controllers/AuditorController.js';

const router = express.Router();

router.get('/estado-diario', getEstadoDiario);

export default router;
