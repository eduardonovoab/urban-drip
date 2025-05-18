import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useContext(AuthContext);
  const location = useLocation();

  if (!token) {
    // No autenticado → redirigir a login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.rol))) {
    // Usuario sin permiso → redirigir a home o página de error
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
