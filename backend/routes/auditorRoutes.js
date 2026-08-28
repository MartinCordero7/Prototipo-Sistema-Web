import express from 'express';
import { getEstadoDiario } from '../controllers/AuditorController.js';

import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['AUDITOR']));

router.get('/estado-diario', getEstadoDiario);

export default router;
