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
  actualizarDatosBasicosProducto,
  eliminarDetalleProducto,
  actualizarDetalleProducto,
  crearDetalleProducto,
  actualizarEstadosProducto,
  obtenerProductoPorId,
  cambiarEstadoPedido,
  obtenerProductoParaEdicion,
  cambiarEstadoProducto,
  actualizarEstadosAutomaticos,
  verificarYCorregirEstados,
  limpiarEstadosInconsistentes,
  getReservasActivas,
  confirmarPagoEfectivo,
  cancelarReserva,
  getPedidos, 
  getDetallePedido,
  getEstadisticasPedidos,
  crearReserva,
  
  // FUNCIONES CORREGIDAS PARA GESTIÓN DE USUARIOS
  cambiarRolUsuario

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
router.get('/usuarios', authenticateToken, verifyAdmin, listarUsuarios);
router.put('/usuario/:id/estado', authenticateToken, verifyAdmin, actualizarEstadoUsuario);

// 🆕 NUEVA RUTA: Cambiar rol de usuario (cliente a admin)
router.put('/usuario/:id/rol', authenticateToken, verifyAdmin, cambiarRolUsuario);

// ============================================
// RUTAS DE PRODUCTOS
// ============================================
router.get('/productos', authenticateToken, verifyAdmin, listarProductos);
router.post('/producto', authenticateToken, verifyAdmin, addProduct);
router.get('/producto/:id', authenticateToken, verifyAdmin, getProductoById);
router.put('/producto/:id', authenticateToken, verifyAdmin, actualizarProducto);
router.delete('/producto/:id', authenticateToken, verifyAdmin, eliminarProducto);
router.get('/producto/:id/detalle', authenticateToken, verifyAdmin, getProductoDetallePorId);

// ============================================
// RUTAS DE CATEGORÍAS, MARCAS Y TALLAS
// ============================================
router.get('/categorias', authenticateToken, verifyAdmin, obtenerCategorias);
router.get('/categoria/:id', authenticateToken, verifyAdmin, obtenerCategoriaPorId);
router.get('/marcas', authenticateToken, verifyAdmin, obtenerMarcas);
router.get('/marca/:id', authenticateToken, verifyAdmin, obtenerMarcaPorId);
router.get('/tallas', authenticateToken, verifyAdmin, obtenerTallas);
router.get('/estados-producto', authenticateToken, verifyAdmin, obtenerEstadosProducto);

// ============================================
// RUTAS DE PRODUCTO DETALLE/VARIANTES
// ============================================
router.put('/producto-detalle/:detalleId/estado', authenticateToken, verifyAdmin, actualizarEstadoVariante);
router.delete('/producto-detalle/:id', authenticateToken, verifyAdmin, eliminarDetalleProducto);
router.put('/producto-detalle/:id', authenticateToken, verifyAdmin, actualizarDetalleProducto);
router.post('/producto-detalle', authenticateToken, verifyAdmin, crearDetalleProducto);

// ============================================
// RUTAS DE GESTIÓN DE PEDIDOS Y RESERVAS
// ============================================
router.get('/reservas/activas', authenticateToken, verifyAdmin, getReservasActivas);
router.put('/pedido/:pedido_id/confirmar-pago', authenticateToken, verifyAdmin, confirmarPagoEfectivo);
router.put('/pedido/:pedido_id/cambiar-estado', authenticateToken, verifyAdmin, cambiarEstadoPedido);
router.put('/pedido/:pedido_id/cancelar-reserva', authenticateToken, verifyAdmin, cancelarReserva);
router.post('/pedido/:pedido_id/crear-reserva', authenticateToken, verifyAdmin, crearReserva);

// ============================================
// RUTAS ADICIONALES DE PRODUCTOS
// ============================================
router.put('/producto/:id/datos-basicos', authenticateToken, verifyAdmin, actualizarDatosBasicosProducto);
router.post('/producto/:id/actualizar-estados', authenticateToken, verifyAdmin, actualizarEstadosProducto);
router.get('/producto/:id/detalles', authenticateToken, verifyAdmin, obtenerProductoPorId);
router.get('/productos/marca/:id', authenticateToken, verifyAdmin, getProductosPorMarca);
router.get('/productos/categoria/:id', authenticateToken, verifyAdmin, listarProductosPorCategoria);
router.get('/productos/con-detalles', authenticateToken, verifyAdmin, listarProductosConDetalles);
router.get('/producto/:id/edicion', authenticateToken, verifyAdmin, obtenerProductoParaEdicion);

// ============================================
// RUTAS PARA GESTIÓN DE ESTADOS DE PRODUCTOS
// ============================================
router.put('/producto/:id/estado', authenticateToken, verifyAdmin, cambiarEstadoProducto);
router.post('/productos/actualizar-estados-automaticos', authenticateToken, verifyAdmin, actualizarEstadosAutomaticos);
router.post('/productos/verificar-estados', authenticateToken, verifyAdmin, verificarYCorregirEstados);
router.post('/productos/limpiar-estados', authenticateToken, verifyAdmin, limpiarEstadosInconsistentes);

// ============================================
// RUTAS DE GESTIÓN DE PEDIDOS (ADMIN)
// ============================================
router.get('/estadisticas/pedidos', authenticateToken, verifyAdmin, getEstadisticasPedidos);
router.get('/pedidos', authenticateToken, verifyAdmin, getPedidos);
router.get('/pedidos/:pedido_id', authenticateToken, verifyAdmin, getDetallePedido);

export default router;