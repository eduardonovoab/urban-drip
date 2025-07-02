import express from 'express';
import { 
  // Controladores principales
  getProductoById,
  getAllProductos,
  getproductodetalle,
  
  // Controladores por categoría
  getProductosAgrupadosConDetalles,
  getProductosActivosPorCategoria,
  getProductosPorCategoria,
  
  // Controladores por marca
  getProductosPorMarca,
  getProductosActivosPorMarca,
  
  // Controladores por talla
  getProductosPorTalla,
  
  // Controladores de stock
  getStockProducto,
  
  // Controladores de catálogos
  obtenerCategorias,
  getProductosActivosConDetallesPorCategoria,

  obtenerMarcas,

  
  // Controladores especializados
  getProductosDestacadosActivos,
  getTodosProductosActivos
} from '../controllers/productoController.js';

const router = express.Router();

// ========== MIDDLEWARE ==========

// Middleware de logging
router.use((req, res, next) => {
  console.log(`PRODUCTOS: ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

console.log('🔍 Iniciando definición de rutas de productos...');

// ========== RUTAS DE SALUD ==========

/**
 * Ruta de salud para productos
 * GET /api/productos/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Productos API',
    timestamp: new Date().toISOString(),
    endpoints_disponibles: [
      'GET /health - Estado del servicio',
      'GET /productos-detalles - Todos los productos con detalles',
      'GET /categorias - Listado de categorías',
      'GET /marcas - Listado de marcas',
      'GET /categoria/:id/con-detalles - Productos por categoría con detalles',
      'GET /categoria/:id/activos - Productos activos por categoría',
      'GET /marca/:id - Productos por marca',
      'GET /marca/:id/activos - Productos activos por marca',
      'GET /talla/:talla - Productos por talla',
      'GET /destacados/activos - Productos destacados activos',
      'GET /activos - Todos los productos activos',
      'GET /:id - Producto específico por ID',
      'GET /:id/stock - Stock de producto específico',
      'GET / - Todos los productos'
    ]
  });
});

// ========== RUTAS ESPECIALIZADAS (MÁS ESPECÍFICAS PRIMERO) ==========

/**
 * Obtener todos los productos con detalles
 * GET /api/productos/productos-detalles
 */
router.get('/productos-detalles', async (req, res) => {
  try {
    console.log('🔍 Ejecutando ruta: /productos-detalles');
    await getproductodetalle(req, res);
  } catch (error) {
    console.error('❌ Error en /productos-detalles:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

/**
 * Obtener productos destacados activos
 * GET /api/productos/destacados/activos
 */
router.get('/destacados/activos', async (req, res) => {
  try {
    console.log('🔍 Ejecutando ruta: /destacados/activos');
    await getProductosDestacadosActivos(req, res);
  } catch (error) {
    console.error('❌ Error en /destacados/activos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

/**
 * Obtener todos los productos activos
 * GET /api/productos/activos
 */
router.get('/activos', async (req, res) => {
  try {
    console.log('🔍 Ejecutando ruta: /activos');
    await getTodosProductosActivos(req, res);
  } catch (error) {
    console.error('❌ Error en /activos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// ========== RUTAS DE CATÁLOGOS ==========

/**
 * Obtener todas las categorías
 * GET /api/productos/categorias
 */
router.get('/categorias', async (req, res) => {
  try {
    console.log('🔍 Ejecutando ruta: /categorias');
    await obtenerCategorias(req, res);
  } catch (error) {
    console.error('❌ Error en /categorias:', error);
    res.status(500).json({ 
      error: 'Error al obtener las categorías',
      message: error.message 
    });
  }
});

/**
 * Obtener todas las marcas
 * GET /api/productos/marcas
 */
router.get('/marcas', async (req, res) => {
  try {
    console.log('🔍 Ejecutando ruta: /marcas');
    await obtenerMarcas(req, res);
  } catch (error) {
    console.error('❌ Error en /marcas:', error);
    res.status(500).json({ 
      error: 'Error al obtener las marcas',
      message: error.message 
    });
  }
});

// ========== RUTAS POR CATEGORÍA ==========

/**
 * Obtener productos por categoría CON detalles completos
 * GET /api/productos/categoria/:id/con-detalles
 */
router.get('/categoria/:id/con-detalles', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /categoria/${req.params.id}/con-detalles`);
    await getProductosAgrupadosConDetalles(req, res);
  } catch (error) {
    console.error(`❌ Error en /categoria/${req.params.id}/con-detalles:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

/**
 * Obtener productos activos por categoría (excluye inhabilitados)
 * GET /api/productos/categoria/:id/activos
 */
router.get('/categoria/:id/activos', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /categoria/${req.params.id}/activos`);
    await getProductosActivosPorCategoria(req, res);
  } catch (error) {
    console.error(`❌ Error en /categoria/${req.params.id}/activos:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

/**
 * Obtener productos por categoría (versión simple)
 * GET /api/productos/categoria/:id
 */
router.get('/categoria/:id', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /categoria/${req.params.id}`);
    await getProductosPorCategoria(req, res);
  } catch (error) {
    console.error(`❌ Error en /categoria/${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// ========== RUTAS POR MARCA ==========

/**
 * Obtener productos activos por marca (excluye inhabilitados)
 * GET /api/productos/marca/:id/activos
 */
router.get('/marca/:id/activos', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /marca/${req.params.id}/activos`);
    await getProductosActivosPorMarca(req, res);
  } catch (error) {
    console.error(`❌ Error en /marca/${req.params.id}/activos:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

/**
 * Obtener productos por marca
 * GET /api/productos/marca/:id
 */
router.get('/marca/:id', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /marca/${req.params.id}`);
    await getProductosPorMarca(req, res);
  } catch (error) {
    console.error(`❌ Error en /marca/${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// ========== RUTAS POR TALLA ==========

/**
 * Obtener productos por talla
 * GET /api/productos/talla/:talla
 */
router.get('/talla/:talla', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /talla/${req.params.talla}`);
    await getProductosPorTalla(req, res);
  } catch (error) {
    console.error(`❌ Error en /talla/${req.params.talla}:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// ========== RUTAS ESPECÍFICAS POR ID ==========

/**
 * Obtener stock de un producto específico
 * GET /api/productos/:id/stock
 */
router.get('/:id/stock', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /${req.params.id}/stock`);
    await getStockProducto(req, res);
  } catch (error) {
    console.error(`❌ Error en /${req.params.id}/stock:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

/**
 * Obtener producto específico por ID
 * GET /api/productos/:id
 */
router.get('/:id', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /${req.params.id}`);
    await getProductoById(req, res);
  } catch (error) {
    console.error(`❌ Error en /${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});
// Agregar esta ruta ANTES de las rutas existentes de categoría
/**
 * Obtener productos activos por categoría CON detalles (solo disponibles y agotados)
 * GET /api/productos/categoria/:id/activos-con-detalles
 */
router.get('/categoria/:id/activos-con-detalles', async (req, res) => {
  try {
    console.log(`🔍 Ejecutando ruta: /categoria/${req.params.id}/activos-con-detalles`);
    await getProductosActivosConDetallesPorCategoria(req, res);
  } catch (error) {
    console.error(`❌ Error en /categoria/${req.params.id}/activos-con-detalles:`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// ========== RUTA GENERAL (DEBE IR AL FINAL) ==========

/**
 * Obtener todos los productos (debe ir al final para evitar conflictos)
 * GET /api/productos/
 */
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Ejecutando ruta: / (todos los productos)');
    await getAllProductos(req, res);
  } catch (error) {
    console.error('❌ Error en / (todos los productos):', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

console.log('🎯 Todas las rutas de productos definidas correctamente');

export default router;
