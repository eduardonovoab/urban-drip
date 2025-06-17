import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import webpayRoutes from './routes/webpayRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import productoRoutes from './routes/producto.js';
import usuarioRoutes from './routes/usuarioRoutes.js'
import reportesRoutes from './routes/reportesRoutes.js';

dotenv.config();

const app = express();

// Configuración de CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check principal
app.get('/', (req, res) => {
  res.json({
    message: 'UrbanDrip API',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Montar rutas con prefijos específicos
console.log('🔧 Montando rutas...');

try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Rutas de autenticación montadas');
} catch (error) {
  console.error('❌ Error montando rutas de auth:', error.message);
}

try {
  app.use('/api/webpay', webpayRoutes);
  console.log('✅ Rutas de webpay montadas');
} catch (error) {
  console.error('❌ Error montando rutas de webpay:', error.message);
}

try {
  app.use('/api/client', clientRoutes);
  console.log('✅ Rutas de cliente montadas');
} catch (error) {
  console.error('❌ Error montando rutas de cliente:', error.message);
}

try {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Rutas de admin montadas');
} catch (error) {
  console.error('❌ Error montando rutas de admin:', error.message);
}

try {
  app.use('/api/location', locationRoutes);
  console.log('✅ Rutas de ubicación montadas');
} catch (error) {
  console.error('❌ Error montando rutas de location:', error.message);
}

try {
  app.use('/api/public', publicRoutes);
  console.log('✅ Rutas públicas montadas');
} catch (error) {
  console.error('❌ Error montando rutas públicas:', error.message);
}
try {
  app.use('/api/usuario', usuarioRoutes);
  console.log('✅ Rutas de productos montadas');
} catch (error) {
  console.error('❌ Error montando rutas de productos:', error.message);
}
reportesRoutes
try {
  app.use('/api/reportes', reportesRoutes);
  console.log('✅ Rutas de productos montadas');
} catch (error) {
  console.error('❌ Error montando rutas de productos:', error.message);
}
try {
  app.use('/api/productos', productoRoutes);
  console.log('✅ Rutas de productos montadas');
} catch (error) {
  console.error('❌ Error montando rutas de productos:', error.message);
}

console.log('🎯 Todas las rutas procesadas')

export default app;