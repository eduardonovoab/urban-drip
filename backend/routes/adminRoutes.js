import express from 'express';
import { authenticateToken, verifyAdmin } from '../middleware/authMiddleware.js';

// Importar controladores
import { 
  getAdminDashboard,
  addProduct,
  getProductoById,
  actualizarProducto, 
  eliminarProducto,
  listarProductos,
  obtenerMarcas,
  obtenerTallas,
  obtenerCategorias,
  obtenerEstadosProducto,
  actualizarEstadoVariante,
  obtenerCategoriaPorId,
  obtenerMarcaPorId,
  listarUsuarios,
  actualizarEstadoUsuario,
  getProductoDetallePorId,
  getProductosPorMarca,
  listarProductosPorCategoria,
  listarProductosConDetalles,
  // Funciones que están definidas pero mal exportadas en el controller
  actualizarDatosBasicosProducto,
  eliminarDetalleProducto,
  actualizarDetalleProducto,
  crearDetalleProducto,
  actualizarEstadosProducto,
  obtenerProductoPorId,
  // Funciones de pedidos
  listarTodosPedidos,
  getDetallePedidoAdmin,
  cambiarEstadoPedido,
  getEstadisticasPedidos,
  obtenerProductoParaEdicionSimple 
} from '../controllers/adminController.js';

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`ADMIN: ${req.method} ${req.path}`);
  next();
});

// ============================================
// RUTA PRINCIPAL DEL DASHBOARD
// ============================================
router.get('/dashboard', authenticateToken, verifyAdmin, getAdminDashboard);

// ============================================
// RUTAS DE GESTIÓN DE USUARIOS
// ============================================

// GET /api/admin/usuarios - Listar todos los usuarios
router.get('/usuarios', authenticateToken, verifyAdmin, listarUsuarios);

// PUT /api/admin/usuario/:id/estado - Actualizar estado de usuario
router.put('/usuario/:id/estado', authenticateToken, verifyAdmin, actualizarEstadoUsuario);

// ============================================
// RUTAS DE PRODUCTOS
// ============================================

// GET /api/admin/productos - Listar todos los productos
router.get('/productos', authenticateToken, verifyAdmin, listarProductos);

// POST /api/admin/producto - Agregar nuevo producto
router.post('/producto', authenticateToken, verifyAdmin, addProduct);

// GET /api/admin/producto/:id - Obtener producto por ID
router.get('/producto/:id', authenticateToken, verifyAdmin, getProductoById);

// PUT /api/admin/producto/:id - Actualizar producto
router.put('/producto/:id', authenticateToken, verifyAdmin, actualizarProducto);

// DELETE /api/admin/producto/:id - Eliminar producto
router.delete('/producto/:id', authenticateToken, verifyAdmin, eliminarProducto);

// GET /api/admin/producto/:id/detalle - Obtener detalle completo del producto
router.get('/producto/:id/detalle', authenticateToken, verifyAdmin, getProductoDetallePorId);

// ============================================
// RUTAS DE CATEGORÍAS, MARCAS Y TALLAS
// ============================================

// GET /api/admin/categorias - Obtener todas las categorías
router.get('/categorias', authenticateToken, verifyAdmin, obtenerCategorias);

// GET /api/admin/categoria/:id - Obtener categoría por ID
router.get('/categoria/:id', authenticateToken, verifyAdmin, obtenerCategoriaPorId);

// GET /api/admin/marcas - Obtener todas las marcas
router.get('/marcas', authenticateToken, verifyAdmin, obtenerMarcas);

// GET /api/admin/marca/:id - Obtener marca por ID
router.get('/marca/:id', authenticateToken, verifyAdmin, obtenerMarcaPorId);

// GET /api/admin/tallas - Obtener todas las tallas
router.get('/tallas', authenticateToken, verifyAdmin, obtenerTallas);

// GET /api/admin/estados-producto - Obtener estados de producto
router.get('/estados-producto', authenticateToken, verifyAdmin, obtenerEstadosProducto);

// ============================================
// RUTAS DE PRODUCTO DETALLE/VARIANTES
// ============================================

// PUT /api/admin/producto-detalle/:detalleId/estado - Actualizar estado de variante
router.put('/producto-detalle/:detalleId/estado', authenticateToken, verifyAdmin, actualizarEstadoVariante);

// DELETE /api/admin/producto-detalle/:id - Eliminar detalle de producto
router.delete('/producto-detalle/:id', authenticateToken, verifyAdmin, eliminarDetalleProducto);

// PUT /api/admin/producto-detalle/:id - Actualizar detalle de producto
router.put('/producto-detalle/:id', authenticateToken, verifyAdmin, actualizarDetalleProducto);

// POST /api/admin/producto-detalle - Crear nuevo detalle de producto
router.post('/producto-detalle', authenticateToken, verifyAdmin, crearDetalleProducto);

// ============================================
// RUTAS ADICIONALES DE PRODUCTOS
// ============================================

// PUT /api/admin/producto/:id/datos-basicos - Actualizar datos básicos del producto
router.put('/producto/:id/datos-basicos', authenticateToken, verifyAdmin, actualizarDatosBasicosProducto);

// POST /api/admin/producto/:id/actualizar-estados - Actualizar estados del producto
router.post('/producto/:id/actualizar-estados', authenticateToken, verifyAdmin, actualizarEstadosProducto);

// GET /api/admin/producto/:id/detalles - Obtener detalles completos de un producto
router.get('/producto/:id/detalles', authenticateToken, verifyAdmin, obtenerProductoPorId);

// GET /api/admin/productos/marca/:id - Obtener productos por marca
router.get('/productos/marca/:id', authenticateToken, verifyAdmin, getProductosPorMarca);

// GET /api/admin/productos/categoria/:id - Obtener productos por categoría
router.get('/productos/categoria/:id', authenticateToken, verifyAdmin, listarProductosPorCategoria);

// GET /api/admin/productos/con-detalles - Listar productos con detalles
router.get('/productos/con-detalles', authenticateToken, verifyAdmin, listarProductosConDetalles);

router.get('/producto/:id/edicion', authenticateToken, verifyAdmin, obtenerProductoParaEdicionSimple);

// ============================================
// RUTAS DE GESTIÓN DE PEDIDOS (ADMIN)
// ============================================

// GET /api/admin/pedidos/estadisticas/general - Obtener estadísticas de pedidos (DEBE IR ANTES que /:pedido_id)
router.get('/pedidos/estadisticas/general', authenticateToken, verifyAdmin, getEstadisticasPedidos);

// GET /api/admin/pedidos - Listar todos los pedidos
router.get('/pedidos', authenticateToken, verifyAdmin, listarTodosPedidos);

// GET /api/admin/pedidos/:pedido_id - Obtener detalle de un pedido específico
router.get('/pedidos/:pedido_id', authenticateToken, verifyAdmin, getDetallePedidoAdmin);

// PUT /api/admin/pedidos/:pedido_id/estado - Cambiar estado de un pedido
router.put('/pedidos/:pedido_id/estado', authenticateToken, verifyAdmin, cambiarEstadoPedido);
export default router;