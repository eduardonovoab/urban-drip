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
  obtenerMarcas,
  obtenerTallas,
  obtenerCategorias,
  listarProductos,
  listarProductosConDetalles
} from '../controllers/adminController.js';

const router = express.Router();
router.post('/producto-test', addProduct);
router.get('/productos-detalles', listarProductosConDetalles);

router.get('/categorias', authenticateToken, verifyAdmin, obtenerCategorias);
router.post('/producto', authenticateToken, verifyAdmin, addProduct);
router.get('/producto', authenticateToken, verifyAdmin, listarProductos);
router.get('/producto/:id', authenticateToken, verifyAdmin, getProductoById);
router.put('/producto/:id', authenticateToken, verifyAdmin, actualizarProducto);
router.delete('/producto/:id', authenticateToken, verifyAdmin, eliminarProducto);

router.get('/marcas', authenticateToken, verifyAdmin, obtenerMarcas);
router.get('/tallas', authenticateToken, verifyAdmin, obtenerTallas);

export default router;
