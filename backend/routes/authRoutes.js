import express from 'express';
import { 
  login, 
  registerUser, 
  verifyToken, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js';

const router = express.Router();

// Ruta para login
router.post('/login', login);

// Ruta para registro
router.post('/register', registerUser);

// Ruta para verificar el token
router.get('/verify-token', verifyToken);

// Ruta para solicitar recuperación de contraseña
router.post('/forgot-password', forgotPassword);

// Ruta para restablecer contraseña con token
router.post('/reset-password/:token', resetPassword);

export default router;