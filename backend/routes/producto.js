import express from 'express';
import { 
  getDetalleProducto,
  getTallasDisponibles
} from '../controllers/productoController.js';

const router = express.Router();

// Ruta para obtener el detalle del producto por ID
router.get('/producto-detalle/:id', getDetalleProducto);

// Ruta para obtener las tallas de un producto por ID
router.get('/producto-detalles/producto/:id', getTallasDisponibles);

export default router;
