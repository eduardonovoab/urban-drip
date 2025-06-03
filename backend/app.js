// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Rutas
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import clienteRoutes from './routes/clientRoutes.js';
import productoRoutes from './routes/producto.js';

dotenv.config();

console.log(process.env.JWT_SECRET);
const app = express();

// Configuración de CORS con opciones específicas
const corsOptions = {
  origin: 'http://localhost:5173',  // Permite solicitudes desde tu frontend
  credentials: true,  // Permite que las cookies se envíen y se reciban
};

app.use(cors(corsOptions));
app.use(express.json());

// Rutas públicas y protegidas
app.use('/api/login', authRoutes);
app.use('/api/admin', adminRoutes);  // Asegúrate de que las rutas de admin estén configuradas correctamente
app.use('/api', publicRoutes); 
app.use('/api/productos', publicRoutes);
app.use('/api', productoRoutes); 
app.use('/api/usuario', usuarioRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/cliente', clienteRoutes);

export default app;
