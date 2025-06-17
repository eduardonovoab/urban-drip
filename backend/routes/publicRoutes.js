import express from 'express';
import { 
  listarProductos, 
  listarProductosConDetalles, 
  obtenerMarcas,
  listarProductosPorCategoria,
  obtenerCategoriaPorId,
  obtenerCategorias,
  getProductosPorMarca,
  obtenerMarcaPorId,
  getProductoDetallePorId 
} from '../controllers/adminController.js';

const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
  console.log(`PUBLIC: ${req.method} ${req.path}`);
  next();
});

// RUTAS PÚBLICAS DE PRODUCTOS
router.get('/productos', async (req, res) => {
  try {
    await listarProductos(req, res);
  } catch (error) {
    console.error('Error en GET /productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/productos-detalles', async (req, res) => {
  try {
    await listarProductosConDetalles(req, res);
  } catch (error) {
    console.error('Error en GET /productos-detalles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/productos/categoria/:id', async (req, res) => {
  try {
    await listarProductosPorCategoria(req, res);
  } catch (error) {
    console.error('Error en GET /productos/categoria/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/productos/marca/:id', async (req, res) => {
  try {
    await getProductosPorMarca(req, res);
  } catch (error) {
    console.error('Error en GET /productos/marca/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/producto-detalle/:id', async (req, res) => {
  try {
    await getProductoDetallePorId(req, res);
  } catch (error) {
    console.error('Error en GET /producto-detalle/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// RUTAS PÚBLICAS DE MARCAS
router.get('/marcas', async (req, res) => {
  try {
    await obtenerMarcas(req, res);
  } catch (error) {
    console.error('Error en GET /marcas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/marcas/:id', async (req, res) => {
  try {
    await obtenerMarcaPorId(req, res);
  } catch (error) {
    console.error('Error en GET /marcas/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// RUTAS PÚBLICAS DE CATEGORÍAS
router.get('/categorias', async (req, res) => {
  try {
    await obtenerCategorias(req, res);
  } catch (error) {
    console.error('Error en GET /categorias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/categorias/:id', async (req, res) => {
  try {
    await obtenerCategoriaPorId(req, res);
  } catch (error) {
    console.error('Error en GET /categorias/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;