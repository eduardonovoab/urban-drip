import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Páginas públicas
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

// Páginas protegidas
import Cliente from '../pages/Cliente';
import AdminDashboard from '../pages/Admin';
import AdminProductList from '../pages/AdminProductList';
import Cart from '../pages/Cart';
import EditarProducto from '../pages/EditarProducto';

// Protección de rutas
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cliente/mis-pedidos" element={
        <ProtectedRoute allowedRoles={['cliente']}>
          <Cliente />
        </ProtectedRoute>
      } />
      <Route path="/cliente/pedido/:id" element={
        <ProtectedRoute allowedRoles={['cliente']}>
          <Cliente />
        </ProtectedRoute>
      } />

      {/* Rutas protegidas - Cliente */}
      <Route path="/cliente" element={
        <ProtectedRoute allowedRoles={['cliente']}>
          <Cliente />
        </ProtectedRoute>
      } />
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['cliente']}>
          <Cart />
        </ProtectedRoute>
      } />

      {/* Rutas protegidas - Admin */}
      <Route path="/admin/editar/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <EditarProducto />
        </ProtectedRoute>
      } />
      <Route path="/admin/listado" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminProductList />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Ruta por defecto */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
