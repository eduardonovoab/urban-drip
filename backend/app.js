import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import clienteRoutes from './routes/clientRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas y protegidas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/productos', publicRoutes);       // Aquí tus productos públicos
app.use('/api/usuario', usuarioRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/cliente', clienteRoutes);

export default app;
