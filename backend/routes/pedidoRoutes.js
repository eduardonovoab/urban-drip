import express from 'express';
import { crearPedido } from '../controllers/pedidoController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`PEDIDOS: ${req.method} ${req.path}`);
  next();
});

// Ruta para crear pedido
router.post('/cliente/pedido', authenticateToken, async (req, res) => {
  try {
    await crearPedido(req, res);
  } catch (error) {
    console.error('Error en POST /cliente/pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;