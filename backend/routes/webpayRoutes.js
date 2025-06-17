// routes/webpayRoutes.js
import express from 'express';
import { 
  crearTransaccion, 
  confirmarPago, 
  confirmarTransaccion, 
  obtenerEstadoTransaccion 
} from '../controllers/webpayController.js';

const router = express.Router();

// Middleware para logging de todas las requests de Webpay
router.use((req, res, next) => {
  console.log(`=== WEBPAY ROUTE: ${req.method} ${req.originalUrl} ===`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// POST /api/webpay/crear - Crear nueva transacción
router.post('/crear', crearTransaccion);

// GET /api/webpay/confirmar-pago - Confirmar pago (cuando Webpay redirige de vuelta)
// Esta ruta maneja el retorno desde Webpay con token_ws
router.get('/confirmar-pago', confirmarPago);

// PUT /api/webpay/confirmar/:token - Confirmar transacción específica
// Esta es la ruta alternativa si necesitas confirmar con PUT
router.put('/confirmar/:token', confirmarTransaccion);

// POST /api/webpay/confirmar-pago - También manejar POST por si Webpay envía POST
router.post('/confirmar-pago', confirmarPago);

// GET /api/webpay/estado/:token - Obtener estado de transacción
router.get('/estado/:token', obtenerEstadoTransaccion);

// Ruta de prueba para verificar que las rutas funcionan
router.get('/test', (req, res) => {
  res.json({
    message: 'Rutas de Webpay funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    webpay_base_url: process.env.WEBPAY_BASE_URL || 'https://webpay3gint.transbank.cl'
  });
});

// Middleware de manejo de errores específico para Webpay
router.use((error, req, res, next) => {
  console.error('=== ERROR EN RUTAS WEBPAY ===');
  console.error('Error:', error);
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  
  res.status(500).json({
    error: 'Error interno en procesamiento de pagos',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

export default router;