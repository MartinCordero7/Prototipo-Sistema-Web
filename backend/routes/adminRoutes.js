import express from 'express';
import { getBlockedUsers, unblockUser, getConfigHandler, updateConfigHandler, getAlertasHistory, getDelegados, saveDelegado, deleteDelegado, sendDelegadoEmail } from '../controllers/AdminController.js';

import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

router.get('/blocked-users', getBlockedUsers);
router.post('/unblock', unblockUser);
router.get('/config', getConfigHandler);
router.put('/config', updateConfigHandler);
router.get('/alertas', getAlertasHistory);
router.get('/delegados', getDelegados);
router.post('/delegados', saveDelegado);
router.delete('/delegados/:id', deleteDelegado);
router.post('/delegados/enviar-correo', sendDelegadoEmail);

export default router;
