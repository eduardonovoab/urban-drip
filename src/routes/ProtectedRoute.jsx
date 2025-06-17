import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Mostrar loading si está cargando la autenticación
  if (isLoading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner">Cargando...</div>
      </div>
    );
  }

  // Verificar si el usuario está autenticado
  if (!user) {
    toast.error('Debes iniciar sesión para acceder a esta página');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene el rol necesario
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    toast.error('No tienes permisos para acceder a esta página');
    
    // Redirigir según el rol del usuario
    const redirectPath = user.rol === 'admin' ? '/admin' : '/cliente';
    return <Navigate to={redirectPath} replace />;
  }

  // Si todo está bien, renderizar el componente hijo
  return children;
};

export default ProtectedRoute;