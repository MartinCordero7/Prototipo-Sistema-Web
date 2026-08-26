import express from 'express';
import { getBlockedUsers, unblockUser, getConfigHandler, updateConfigHandler } from '../controllers/AdminController.js';

const router = express.Router();

router.get('/blocked-users', getBlockedUsers);
router.post('/unblock', unblockUser);
router.get('/config', getConfigHandler);
router.put('/config', updateConfigHandler);

export default router;
