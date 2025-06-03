import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminDashboard from '../pages/AdminDashboard'; // Ruta del panel de admin
import ProtectedRoute from './ProtectedRoute'; // Ruta protegida, solo accesible por admin

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Ruta del Dashboard del Admin, protegido */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}> {/* Solo admin puede acceder */}
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Otras rutas de administración si las tienes */}
      {/* Por ejemplo: editar productos, generar reportes, etc. */}
      {/* <Route path="/admin/reportes" element={<AdminReports />} /> */}
      {/* <Route path="/admin/productos" element={<AdminProducts />} /> */}
      {/* <Route path="/admin/usuarios" element={<AdminUsers />} /> */}
    </Routes>
  );
};

export default AdminRoutes;
