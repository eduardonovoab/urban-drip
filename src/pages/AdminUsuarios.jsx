import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/AdminUsuarios.css';

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('No estás autenticado.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // CORREGIDO: La ruta correcta según tu adminController
      const response = await axios.get('http://localhost:3000/api/admin/usuarios', {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });

      console.log('✅ Usuarios cargados:', response.data);
      setUsuarios(response.data);
      
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      
      if (error.response?.status === 401) {
        toast.error('No tienes permisos para acceder a esta información.');
        localStorage.removeItem('token'); // Limpiar token inválido
      } else if (error.response?.status === 403) {
        toast.error('Acceso denegado. Se requieren permisos de administrador.');
      } else {
        toast.error('Error al cargar usuarios. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('No estás autenticado.');
      return;
    }

    try {
      console.log(`🔄 Cambiando estado del usuario ${id} a: ${nuevoEstado}`);
      
      // CORREGIDO: Usar la ruta que existe en tu router
      await axios.put(
        `http://localhost:3000/api/admin/usuario/${id}/estado`,
        { estado: nuevoEstado }, // CORREGIDO: campo que espera tu controller
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );

      // Actualizar el estado local
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id_usuario === id
            ? { ...usuario, estado_usuario: nuevoEstado } // CORREGIDO: usar campo correcto
            : usuario
        )
      );

      toast.success(
        `Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`
      );
      
    } catch (error) {
      console.error('❌ Error al cambiar estado del usuario:', error);
      
      if (error.response?.status === 401) {
        toast.error('No tienes permisos para realizar esta acción.');
      } else if (error.response?.status === 404) {
        toast.error('Usuario no encontrado.');
      } else {
        toast.error('Error al cambiar estado del usuario. Intenta nuevamente.');
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-usuarios-container">
        <div className="loading">
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-usuarios-container">
      <div className="header-section">
        <h2>Gestión de Usuarios</h2>
        <button 
          className="btn-refresh"
          onClick={fetchUsuarios}
          title="Actualizar lista"
        >
          🔄 Actualizar
        </button>
      </div>

      {usuarios.length > 0 ? (
        <div className="usuarios-lista">
          <div className="usuarios-stats">
            <p>Total de usuarios: <strong>{usuarios.length}</strong></p>
            <p>
              Activos: <strong>{usuarios.filter(u => u.estado_usuario === 'activo').length}</strong> | 
              Inactivos: <strong>{usuarios.filter(u => u.estado_usuario === 'inactivo').length}</strong>
            </p>
          </div>

          <div className="usuarios-grid">
            {usuarios.map((usuario) => (
              <div key={usuario.id_usuario} className="usuario-card">
                <div className="usuario-info">
                  <div className="usuario-header">
                    <div className="usuario-nombre">
                      {usuario.nombre_usuario} {usuario.apellido_usuario}
                    </div>
                    <div className={`usuario-status ${usuario.estado_usuario === 'activo' ? 'activo' : 'inactivo'}`}>
                      {usuario.estado_usuario === 'activo' ? '🟢' : '🔴'}
                    </div>
                  </div>
                  
                  <div className="usuario-details">
                    <div className="usuario-correo">
                      📧 {usuario.correo}
                    </div>
                    <div className="usuario-rol">
                      👤 Rol: <span className={`rol-badge rol-${usuario.rol}`}>{usuario.rol}</span>
                    </div>
                    <div className="usuario-id">
                      🆔 ID: {usuario.id_usuario}
                    </div>
                    <div className={`usuario-estado estado-${usuario.estado_usuario}`}>
                      Estado: {usuario.estado_usuario}
                    </div>
                  </div>
                </div>

                <div className="usuario-actions">
                  <button
                    className={`btn-estado ${usuario.estado_usuario === 'activo' ? 'btn-desactivar' : 'btn-activar'}`}
                    onClick={() =>
                      handleCambiarEstado(
                        usuario.id_usuario,
                        usuario.estado_usuario === 'activo' ? 'inactivo' : 'activo'
                      )
                    }
                    disabled={usuario.rol === 'admin'} // Prevenir desactivar admins
                    title={usuario.rol === 'admin' ? 'No se puede cambiar el estado de un administrador' : ''}
                  >
                    {usuario.estado_usuario === 'activo' ? '🚫 Desactivar' : '✅ Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-usuarios">
          <p>📭 No hay usuarios disponibles</p>
          <button className="btn-refresh" onClick={fetchUsuarios}>
            🔄 Recargar
          </button>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default AdminUsuarios;