import express from 'express';
import { loginHandler, changePasswordHandler } from '../controllers/AuthController.js';

const router = express.Router();

router.post('/login', loginHandler);
router.post('/change-password', changePasswordHandler);

export default router;
