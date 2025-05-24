import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

import Cliente from '../pages/Cliente';
import AdminDashboard from '../pages/Admin';
import AdminProductList from '../pages/AdminProductList';
import Cart from '../pages/Cart';
import EditarProducto from '../pages/EditarProducto';

import ProtectedRoute from './ProtectedRoute';

import ProductosPorCategoria from '../components/ProductosPorCategoria';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/productos/categoria/:id" element={<ProductosPorCategoria />} />

      {/* Rutas protegidas - Cliente */}
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
