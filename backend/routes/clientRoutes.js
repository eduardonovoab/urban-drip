import express from 'express';
import { getProductos, 
    getCarrito, 
    agregarAlCarrito, 
    realizarPedido,
    eliminarProductoDelCarrito,
    getHistorialPedidos,
    getDatosUsuario,
    modificarDatosUsuario
 } from '../controllers/clientController.js';
import { authenticateToken, isClient } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/productos', getProductos);
// Ruta para obtener el carrito del usuario
router.get('/carrito', authenticateToken, isClient, getCarrito);
// Ruta para agregar producto al carrito
router.post('/carrito', authenticateToken, isClient, agregarAlCarrito);
// ruta para realizar pedido
router.post('/pedido', authenticateToken, isClient, realizarPedido);
// ruta para eliminar producto del carrito
router.delete('/carrito/:id', authenticateToken, isClient, eliminarProductoDelCarrito);

// Obtener historial de pedidos del cliente
router.get('/historial-pedidos',authenticateToken, getHistorialPedidos);

// Obtener datos del usuario
router.get('/datos', authenticateToken,getDatosUsuario);

// Modificar datos del usuario
router.put('/modificar', modificarDatosUsuario);


export default router;
