import express from 'express';
import { getEstacionesHandler, getCentrosHandler, submitFormHandler } from '../controllers/DataController.js';

const router = express.Router();

router.get('/estaciones', getEstacionesHandler);
router.get('/estaciones/:estacionId/centros', getCentrosHandler);
router.post('/submit', submitFormHandler);

export default router;
