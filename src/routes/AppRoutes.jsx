import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

import Cliente from '../pages/Cliente';
import AdminPanel from '../pages/AdminPanel'; // Panel de administración
import Cart from '../pages/Cart';
import EditarProducto from '../pages/EditarProducto';
import AdminReportes from '../pages/AdminReportes';  // Componente para reportes
import AdminUsuarios from '../pages/AdminUsuarios'; // Componente para listar usuarios
import AgregarProducto from '../pages/AgregarProducto';  // Componente para agregar productos
import ListarProductos from '../pages/ListarProductos'; // componente para listar productos 

import ProtectedRoute from './ProtectedRoute';

import ProductosPorCategoria from '../components/ProductosPorCategoria';
import ProductosPorMarca from '../components/ProductosPorMarca';
import DetalleProducto from '../components/DetalleProducto';

import { AuthContext } from '../context/AuthContext';

const AppRoutes = () => {
  const { user } = useContext(AuthContext); // Obtén el usuario desde el contexto

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={user.rol === 'admin' ? '/admin' : '/cliente'} /> : <Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/productos/categoria/:id" element={<ProductosPorCategoria />} />
      <Route path="/productos/marca/:id" element={<ProductosPorMarca />} />
      <Route path="/producto/:id" element={<DetalleProducto />} />

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
      <Route path="/admin/ListarProductos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ListarProductos />
        </ProtectedRoute>
      } />
      <Route path="/admin/reportes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminReportes />
        </ProtectedRoute>
      } />
      <Route path="/admin/AdminUsuarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsuarios />
        </ProtectedRoute>
      } />
      <Route path="/admin/AgregarProducto" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AgregarProducto />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPanel />
        </ProtectedRoute>
      } />

      {/* Ruta por defecto */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
