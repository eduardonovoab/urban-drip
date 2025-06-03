import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // El contexto de autenticación

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext); // Obtener el usuario del contexto de autenticación

  // Si el usuario no está logueado o su rol no está en los roles permitidos
  if (!user || !allowedRoles.includes(user.rol)) {
    // Redirigir al login si no está autenticado o no tiene el rol adecuado
    return <Navigate to="/login" />;
  }

  return children; // Si pasa la validación, renderiza la ruta protegida
};

export default ProtectedRoute;
