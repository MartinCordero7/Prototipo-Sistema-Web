import express from 'express';
import { getCentrosHandler, submitFormHandler, getHistoryHandler } from '../controllers/DataController.js';

import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/centros', getCentrosHandler);
router.post('/submit', authMiddleware, submitFormHandler);
router.get('/history', authMiddleware, getHistoryHandler);

export default router;
