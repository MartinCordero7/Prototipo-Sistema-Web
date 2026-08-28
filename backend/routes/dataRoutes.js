import express from 'express';
import { getCentrosHandler, submitFormHandler, getHistoryHandler, getComercializadorasHandler } from '../controllers/DataController.js';

import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/centros', getCentrosHandler);
router.get('/comercializadoras', getComercializadorasHandler);
router.post('/submit', authMiddleware, submitFormHandler);
router.get('/history', authMiddleware, getHistoryHandler);

export default router;
