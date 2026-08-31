import express from 'express';
import { loginHandler, logoutHandler, changePasswordHandler, registerHandler, updateProfileHandler, getConfiguracionHandler, forgotPasswordHandler, resetPasswordHandler } from '../controllers/AuthController.js';

import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.post('/register', registerHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);
router.post('/change-password', authMiddleware, changePasswordHandler);
router.put('/update-profile', authMiddleware, updateProfileHandler);
router.get('/config', getConfiguracionHandler);

export default router;
