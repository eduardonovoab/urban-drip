import express from 'express';
import { 
  getProductosAgrupadosConDetalles,
  getProductoById, 
  getAllProductos, 
  getStockProducto,
  getproductodetalle,
  getProductosPorMarca,
  obtenerCategorias, // Nueva ruta
  obtenerMarcas // Nueva ruta
} from '../controllers/productoController.js';

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`PRODUCTOS: ${req.method} ${req.path}`);
  next();
});

console.log('🔍 Iniciando definición de rutas de productos...');

// Ruta de salud para productos
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Productos API',
    timestamp: new Date().toISOString()
  });
});

// ========== RUTAS ESPECÍFICAS PRIMERO (más específicas a menos específicas) ==========

// Ruta para obtener todos los productos con detalles
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

// Ruta para obtener productos por categoría CON detalles
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

// Ruta para obtener productos por marca
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

// Ruta para obtener stock de un producto específico
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

// ========== NUEVAS RUTAS GENERALES ==========

// Ruta para obtener todas las categorías
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

// Ruta para obtener todas las marcas
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

// Ruta para obtener un producto específico por ID
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

// Ruta para obtener todos los productos (debe ir al final)
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
