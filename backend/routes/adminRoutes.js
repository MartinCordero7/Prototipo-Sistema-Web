import express from 'express';
import { getBlockedUsers, unblockUser, getConfigHandler, updateConfigHandler, getAlertasHistory, getEstacionesRegistradas, asignarAuditor } from '../controllers/AdminController.js';

const router = express.Router();

router.get('/blocked-users', getBlockedUsers);
router.post('/unblock', unblockUser);
router.get('/config', getConfigHandler);
router.put('/config', updateConfigHandler);
router.get('/alertas', getAlertasHistory);
router.get('/estaciones-registradas', getEstacionesRegistradas);
router.post('/asignar-auditor', asignarAuditor);

export default router;
