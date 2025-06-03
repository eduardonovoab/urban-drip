import express from 'express';
import 
{ listarProductos, 
listarProductosConDetalles, 
obtenerMarcas,
listarProductosPorCategoria,
obtenerCategoriaPorId,
obtenerCategorias,
getProductosPorMarca,
obtenerMarcaPorId ,
getProductoDetallePorId }
 from '../controllers/adminController.js';

const router = express.Router();

// Ruta pública para obtener todos los productos
router.get('/productos', listarProductos);
router.get('/productos-detalles', listarProductosConDetalles);
router.get('/marcas', obtenerMarcas);  // Esta es la ruta pública para las marcas
router.get('/productos/categoria/:id', listarProductosPorCategoria);
router.get('/categorias/:id', obtenerCategoriaPorId);
router.get('/categorias', obtenerCategorias);
router.get('/productos/marca/:id', getProductosPorMarca);
router.get('/marcas/:id', obtenerMarcaPorId);
router.get('/producto-detalle/:id', getProductoDetallePorId);
export default router;
