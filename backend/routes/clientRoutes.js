// routes/clientRoutes.js - RUTAS COMPLETAS DEL CLIENTE CON COMUNA
import express from 'express';
import {
  // Productos
  getProductos,
  
  // Carrito
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  limpiarCarrito,
  
  // Pedidos y Compras
  finalizarCompra,
  getHistorialPedidos,
  getEstadosPedido,
  
  // Usuario (con comuna)
  getDatosUsuario,
  modificarDatosUsuario,
getPedidosReservados,
   getDetallePedido,
  getSeguimientoPedido
} from '../controllers/clientController.js';

import { authenticateToken, verifyAdmin, isClient } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// MIDDLEWARE DE LOGGING PARA TODAS LAS RUTAS
// ============================================
router.use((req, res, next) => {
  console.log(`=== CLIENT ROUTE: ${req.method} ${req.originalUrl} ===`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('IP:', req.ip);
  console.log('User-Agent:', req.get('User-Agent'));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query:', req.query);
  }
  
  next();
});

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// GET /api/client/productos - Obtener todos los productos
router.get('/productos', getProductos);

// Ruta de salud para verificar que las rutas funcionan
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Client routes working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// RUTAS DE CARRITO (requieren autenticación de cliente)
// ============================================

// GET /api/client/carrito - Obtener carrito del usuario
router.get('/carrito', authenticateToken, isClient, obtenerCarrito);

// POST /api/client/carrito/agregar - Agregar producto al carrito
router.post('/carrito/agregar', authenticateToken, isClient, agregarAlCarrito);

// PUT /api/client/carrito/actualizar - Actualizar cantidad en carrito
router.put('/carrito/actualizar', authenticateToken, isClient, actualizarCantidadCarrito);

// DELETE /api/client/carrito/eliminar/:detalle_producto_id - Eliminar producto del carrito
router.delete('/carrito/eliminar/:detalle_producto_id', authenticateToken, isClient, eliminarDelCarrito);

// DELETE /api/client/carrito/limpiar - Limpiar todo el carrito
router.delete('/carrito/limpiar', authenticateToken, isClient, limpiarCarrito);

// ============================================
// RUTAS DE PEDIDOS Y COMPRAS (solo clientes)
// ============================================

router.get('/estados/pedido', authenticateToken, getEstadosPedido);

// POST /api/client/carrito/finalizar - Finalizar compra (crear pedido pendiente)
router.post('/carrito/finalizar', authenticateToken, isClient, finalizarCompra);

// GET /api/client/pedidos/historial - Obtener historial de pedidos del usuario (YA EXISTE)
router.get('/pedidos/historial', authenticateToken, isClient, getHistorialPedidos);

// GET /api/client/pedidos/:pedido_id - Obtener detalle completo de un pedido específico (NUEVA)
router.get('/pedidos/:pedido_id', authenticateToken, isClient, getDetallePedido);

// GET /api/client/pedidos/:pedido_id/seguimiento - Obtener seguimiento de estados de un pedido (NUEVA)
router.get('/pedidos/:pedido_id/seguimiento', authenticateToken, isClient, getSeguimientoPedido);

// GET /api/client/pedidos/:pedido_id - Obtener detalle de un pedido específico
// router.get('/pedidos/:pedido_id', authenticateToken, isClient, getDetallePedido);
router.get('/pedidos/reservados', authenticateToken, getPedidosReservados);

// ============================================
// RUTAS DE USUARIO CON COMUNA (tanto admin como cliente)
// ============================================

// GET /api/client/usuario/datos - Obtener datos del usuario autenticado (incluye comuna)
router.get('/usuario/datos', authenticateToken, getDatosUsuario);

// PUT /api/client/usuario/modificar - Modificar datos del usuario (incluye comuna)
router.put('/usuario/modificar', authenticateToken, modificarDatosUsuario);




// ============================================
// RUTAS DE ADMINISTRACIÓN (solo admin) - COMENTADAS HASTA IMPLEMENTAR
// ============================================

// GET /api/client/admin/usuarios - Listar todos los usuarios (solo admin)
// router.get('/admin/usuarios', authenticateToken, verifyAdmin, getAllUsuarios);

// PUT /api/client/admin/usuario/:id/estado - Cambiar estado de usuario (solo admin)
// router.put('/admin/usuario/:id/estado', authenticateToken, verifyAdmin, cambiarEstadoUsuario);

// GET /api/client/admin/pedidos - Listar todos los pedidos (solo admin)
// router.get('/admin/pedidos', authenticateToken, verifyAdmin, getAllPedidos);

// PUT /api/client/admin/pedido/:id/estado - Cambiar estado de pedido (solo admin)
// router.put('/admin/pedido/:id/estado', authenticateToken, verifyAdmin, cambiarEstadoPedido);

// ============================================
// RUTAS DE TESTING Y DEBUG (solo en desarrollo)
// ============================================

if (process.env.NODE_ENV === 'development') {
  // GET /api/client/debug/user - Ver información del usuario autenticado
  router.get('/debug/user', authenticateToken, (req, res) => {
    res.json({
      success: true,
      message: 'Debug: User information',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/client/debug/states - Ver todos los estados de pedido
  router.get('/debug/states', authenticateToken, async (req, res) => {
    try {
      const pool = (await import('../config/db.js')).default;
      
      const [estadosPedido] = await pool.execute('SELECT * FROM estado_pedido ORDER BY id_estado');
      const [estadosProducto] = await pool.execute('SELECT * FROM estado_producto ORDER BY id_estado');
      
      res.json({
        success: true,
        message: 'Debug: System states',
        estados_pedido: estadosPedido,
        estados_producto: estadosProducto,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting states',
        error: error.message
      });
    }
  });

  // POST /api/client/debug/clear-cart - Limpiar carrito forzadamente (solo desarrollo)
  router.post('/debug/clear-cart', authenticateToken, async (req, res) => {
    try {
      const pool = (await import('../config/db.js')).default;
      
      // Obtener ID del usuario de diferentes formas posibles
      let userId = req.user?.id_usuario || req.user?.id || req.user?.userId || req.user?.user_id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo identificar el usuario',
          user_structure: req.user
        });
      }
      
      // Eliminar todos los carritos del usuario
      const [result] = await pool.execute(`
        DELETE dp FROM detalle_pedido dp
        JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
        JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
        JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
        WHERE p.usuario_id_usuario = ? AND ep.nombre_estado = 'Carrito'
      `, [userId]);
      
      res.json({
        success: true,
        message: 'Debug: Cart cleared forcefully',
        items_deleted: result.affectedRows,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error clearing cart',
        error: error.message
      });
    }
  });

  // GET /api/client/debug/user-details - Ver datos completos del usuario (solo desarrollo)
  router.get('/debug/user-details', authenticateToken, async (req, res) => {
    try {
      const pool = (await import('../config/db.js')).default;
      
      let userId = req.user?.id_usuario || req.user?.id || req.user?.userId || req.user?.user_id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo identificar el usuario',
          user_structure: req.user
        });
      }

      const [usuario] = await pool.execute(`
        SELECT 
          u.*,
          r.nombre_region,
          c.nombre_comuna
        FROM usuario u
        LEFT JOIN region r ON u.region_id_region = r.id_region
        LEFT JOIN comuna c ON u.comuna_id_comuna = c.id_comuna
        WHERE u.id_usuario = ?
      `, [userId]);

      res.json({
        success: true,
        message: 'Debug: Complete user details',
        user_from_jwt: req.user,
        user_from_db: usuario[0] || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting user details',
        error: error.message
      });
    }
  });
}


// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================
router.use((error, req, res, next) => {
  console.error('=== ERROR EN CLIENT ROUTES ===');
  console.error('Error:', error);
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('User:', req.user || 'No authenticated');
  console.error('Timestamp:', new Date().toISOString());
  
  // Determinar el código de estado apropiado
  let statusCode = 500;
  let message = 'Error interno del servidor';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos inválidos';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'No autorizado';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Acceso denegado';
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Registro duplicado';
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referencia inválida';
  }
  
  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString(),
    request_id: req.headers['x-request-id'] || 'unknown'
  });
});

export default router;