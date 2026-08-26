import express from 'express';
import { getCentrosHandler, submitFormHandler } from '../controllers/DataController.js';

const router = express.Router();

router.get('/centros', getCentrosHandler);
router.post('/submit', submitFormHandler);

export default router;
