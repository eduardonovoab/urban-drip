import express from 'express';
import { crearPedido } from '../controllers/pedidoController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/cliente/pedido', authenticateToken, crearPedido);

export default router;
