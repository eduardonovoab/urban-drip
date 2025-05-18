// backend/routes/publicRoutes.js
import express from 'express';
import { listarProductos } from '../controllers/adminController.js'; // ajusta la ruta si es necesario

const router = express.Router();

// Ruta pública para obtener todos los productos
router.get('/productos', listarProductos);

export default router;
