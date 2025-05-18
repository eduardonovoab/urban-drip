// routes/locationRoutes.js
import express from 'express';
import { obtenerRegiones, obtenerComunasPorRegion } from '../controllers/locationController.js';

const router = express.Router();

router.get('/regiones', obtenerRegiones);
router.get('/comunas/:regionId', obtenerComunasPorRegion);

export default router;
