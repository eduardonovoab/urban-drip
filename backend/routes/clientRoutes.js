// clientRoutes.js
import express from 'express';
import { getProductos, getCarrito, agregarAlCarrito, realizarPedido } from '../controllers/clientController.js';
import { authenticateToken, isClient } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/productos', getProductos);
router.get('/carrito', authenticateToken, isClient, getCarrito);
router.post('/carrito', authenticateToken, isClient, agregarAlCarrito);
router.post('/pedido', authenticateToken, isClient, realizarPedido);

export default router;
