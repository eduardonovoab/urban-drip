// adminRoutes.js

import express from 'express';
import {
  authenticateToken,
  verifyAdmin
} from '../middleware/authMiddleware.js';

import {
  addProduct,
  eliminarProducto,
  getProductoById,
  actualizarProducto,
  obtenerTallas,
  obtenerMarcas ,
  obtenerCategorias,
  listarProductos,
  listarProductosConDetalles,
  obtenerDetallesPorProducto,
  listarUsuarios,
  getAdminDashboard,
  actualizarEstadoUsuario

} from '../controllers/adminController.js';

const router = express.Router();

// Ruta de productos destacados (pública)
router.get('/productos-detalles', listarProductosConDetalles); // No requiere autenticación

// Rutas protegidas para admin
router.get('/usuarios', authenticateToken, verifyAdmin, listarUsuarios);
router.get('/admin-dashboard', authenticateToken, verifyAdmin, getAdminDashboard);
router.get('/categorias', authenticateToken, verifyAdmin, obtenerCategorias);
router.post('/producto', authenticateToken, verifyAdmin, addProduct);
router.get('/producto', authenticateToken, verifyAdmin, listarProductos);
router.get('/producto/:id', authenticateToken, verifyAdmin, getProductoById);
// Ruta específica para cambiar solo el estado del producto (RECOMENDADA)
router.put('/producto/:id', authenticateToken, actualizarProducto);
router.delete('/producto/:id', authenticateToken, verifyAdmin, eliminarProducto);
router.get('/tallas', authenticateToken, verifyAdmin, obtenerTallas);
router.get('/marcas', authenticateToken, verifyAdmin, obtenerMarcas);
router.get('/producto-detalles/producto/:productoId', authenticateToken, verifyAdmin, obtenerDetallesPorProducto);
router.put('/usuario/:id/estado', actualizarEstadoUsuario);

export default router;
