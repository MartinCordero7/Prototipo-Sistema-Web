import express from 'express';
import { loginHandler, changePasswordHandler, registerHandler, updateProfileHandler } from '../controllers/AuthController.js';

const router = express.Router();

router.post('/login', loginHandler);
router.post('/register', registerHandler);
router.post('/change-password', changePasswordHandler);
router.put('/update-profile', updateProfileHandler);

export default router;
