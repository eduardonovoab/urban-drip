import express from 'express';
import {
  getReporteVentas,
  getProductosMasVendidos,
  getEstadoInventario,
  getAnalisisClientes,
  getEstadoPedidos,
  getRendimientoCategorias,
  getDashboardGeneral
} from '../controllers/reportesController.js';

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`REPORTES: ${req.method} ${req.path} - Query:`, req.query);
  next();
});

console.log('📊 Iniciando definición de rutas de reportes...');

// Ruta de salud para reportes
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Reportes API',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/dashboard',
      '/ventas',
      '/productos-vendidos',
      '/inventario',
      '/clientes',
      '/pedidos',
      '/categorias'
    ]
  });
});

// ========== DASHBOARD GENERAL ==========
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Ejecutando ruta: /dashboard');
    await getDashboardGeneral(req, res);
  } catch (error) {
    console.error('❌ Error en /dashboard:', error);
    res.status(500).json({
      error: 'Error al generar dashboard',
      message: error.message
    });
  }
});

// ========== REPORTE DE VENTAS ==========
router.get('/ventas', async (req, res) => {
  try {
    console.log('💰 Ejecutando reporte de ventas');
    console.log('Parámetros:', req.query);
    await getReporteVentas(req, res);
  } catch (error) {
    console.error('❌ Error en reporte de ventas:', error);
    res.status(500).json({
      error: 'Error al generar reporte de ventas',
      message: error.message
    });
  }
});

// ========== PRODUCTOS MÁS VENDIDOS ==========
router.get('/productos-vendidos', async (req, res) => {
  try {
    console.log('📈 Ejecutando reporte de productos más vendidos');
    console.log('Parámetros:', req.query);
    await getProductosMasVendidos(req, res);
  } catch (error) {
    console.error('❌ Error en reporte de productos vendidos:', error);
    res.status(500).json({
      error: 'Error al generar reporte de productos vendidos',
      message: error.message
    });
  }
});

// ========== ESTADO DE INVENTARIO ==========
router.get('/inventario', async (req, res) => {
  try {
    console.log('📦 Ejecutando reporte de inventario');
    console.log('Parámetros:', req.query);
    await getEstadoInventario(req, res);
  } catch (error) {
    console.error('❌ Error en reporte de inventario:', error);
    res.status(500).json({
      error: 'Error al generar reporte de inventario',
      message: error.message
    });
  }
});

// ========== ANÁLISIS DE CLIENTES ==========
router.get('/clientes', async (req, res) => {
  try {
    console.log('👥 Ejecutando análisis de clientes');
    console.log('Parámetros:', req.query);
    await getAnalisisClientes(req, res);
  } catch (error) {
    console.error('❌ Error en análisis de clientes:', error);
    res.status(500).json({
      error: 'Error al generar análisis de clientes',
      message: error.message
    });
  }
});

// ========== ESTADO DE PEDIDOS ==========
router.get('/pedidos', async (req, res) => {
  try {
    console.log('📋 Ejecutando reporte de estado de pedidos');
    console.log('Parámetros:', req.query);
    await getEstadoPedidos(req, res);
  } catch (error) {
    console.error('❌ Error en reporte de pedidos:', error);
    res.status(500).json({
      error: 'Error al generar reporte de pedidos',
      message: error.message
    });
  }
});

// ========== RENDIMIENTO POR CATEGORÍAS ==========
router.get('/categorias', async (req, res) => {
  try {
    console.log('📊 Ejecutando reporte de rendimiento por categorías');
    console.log('Parámetros:', req.query);
    await getRendimientoCategorias(req, res);
  } catch (error) {
    console.error('❌ Error en reporte de categorías:', error);
    res.status(500).json({
      error: 'Error al generar reporte de categorías',
      message: error.message
    });
  }
});

// ========== RUTAS CON PARÁMETROS ESPECÍFICOS ==========

// Reporte de ventas por método de pago específico
router.get('/ventas/metodo-pago/:metodo', async (req, res) => {
  try {
    const { metodo } = req.params;
    console.log(`💳 Ejecutando reporte de ventas para método: ${metodo}`);
    
    // Agregar filtro de método de pago a la query
    req.query.metodoPago = metodo;
    await getReporteVentas(req, res);
  } catch (error) {
    console.error('❌ Error en reporte de ventas por método:', error);
    res.status(500).json({
      error: 'Error al generar reporte de ventas por método de pago',
      message: error.message
    });
  }
});

// Inventario por categoría específica
router.get('/inventario/categoria/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Ejecutando reporte de inventario para categoría: ${id}`);
    
    // Agregar filtro de categoría a la query
    req.query.categoriaId = id;
    await getEstadoInventario(req, res);
  } catch (error) {
    console.error('❌ Error en reporte de inventario por categoría:', error);
    res.status(500).json({
      error: 'Error al generar reporte de inventario por categoría',
      message: error.message
    });
  }
});

// Clientes por región específica
router.get('/clientes/region/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 Ejecutando análisis de clientes para región: ${id}`);
    
    // Agregar filtro de región a la query
    req.query.regionId = id;
    await getAnalisisClientes(req, res);
  } catch (error) {
    console.error('❌ Error en análisis de clientes por región:', error);
    res.status(500).json({
      error: 'Error al generar análisis de clientes por región',
      message: error.message
    });
  }
});

// ========== EXPORTACIONES (FUTURAS) ==========

// Ruta para exportar reportes (preparado para futuras implementaciones)
router.get('/export/:tipo', (req, res) => {
  const { tipo } = req.params;
  const { formato = 'json' } = req.query;
  
  res.json({
    message: `Exportación de ${tipo} en formato ${formato} - Funcionalidad en desarrollo`,
    tipo,
    formato,
    disponible: false
  });
});

// Middleware de manejo de errores específico para reportes
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de reportes:', error);
  
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: 'Error de base de datos - Tabla no encontrada',
      message: 'Verifique que todas las tablas estén creadas correctamente'
    });
  }
  
  if (error.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({
      error: 'Error de base de datos - Campo no encontrado',
      message: 'Verifique la estructura de la base de datos'
    });
  }
  
  res.status(500).json({
    error: 'Error interno en el módulo de reportes',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

console.log('📊 Todas las rutas de reportes definidas correctamente');

export default router;