import express from 'express';
import { 
  getDetalleProducto,
  getTallasDisponibles,
  agregarTallaProducto,
  getTallasByProducto,
  addTallaToProducto,
  updateStockTalla
} from '../controllers/productoController.js';

const router = express.Router();

// Ruta para obtener el detalle del producto por ID
router.get('/producto-detalle/:id', getDetalleProducto);

// Ruta para obtener las tallas de un producto por ID
router.get('/producto-detalles/producto/:id', getTallasDisponibles);

// Ruta para agregar talla y stock a un producto
router.post('/producto/:id_producto/talla', agregarTallaProducto);

router.get('/:id_producto/tallas', getTallasByProducto);
router.post('/:id_producto/tallas', addTallaToProducto);
router.put('/tallas/:id_detalle_producto', updateStockTalla);

export default router;
