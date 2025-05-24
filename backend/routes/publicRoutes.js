import express from 'express';
import 
{ listarProductos, 
listarProductosConDetalles, 
obtenerMarcas }
 from '../controllers/adminController.js';

const router = express.Router();

// Ruta pública para obtener todos los productos
router.get('/productos', listarProductos);
router.get('/productos-detalles', listarProductosConDetalles);
router.get('/marcas', obtenerMarcas);  // Esta es la ruta pública para las marcas

export default router;
