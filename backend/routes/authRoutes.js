import express from 'express';
import { login, registerUser, verifyToken } from '../controllers/authController.js';

const router = express.Router();

// Ruta para login
router.post('/login', login);

// Ruta para registro
router.post('/register', registerUser);

// Ruta para verificar el token
router.get('/verify-token', verifyToken);

export default router;
