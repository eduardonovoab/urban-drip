import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateToken, getUserProfile);

export default router;
