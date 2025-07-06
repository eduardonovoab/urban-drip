import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/AdminUsuarios.css';

// Componente Modal Personalizado
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'warning' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '🎉';
      case 'error': return '❌';
      case 'question': return '🔐';
      default: return '⚠️';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'warning': return 'modal-btn-warning';
      case 'success': return 'modal-btn-success';
      case 'error': return 'modal-btn-error';
      case 'question': return 'modal-btn-question';
      default: return 'modal-btn-warning';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">{getIcon()}</span>
          <h3 className="modal-title">{title}</h3>
        </div>
        
        <div className="modal-body">
          <div dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-btn modal-btn-cancel" 
            onClick={onClose}
          >
            ❌ Cancelar
          </button>
          <button 
            className={`modal-btn ${getButtonClass()}`}
            onClick={onConfirm}
          >
            {type === 'question' ? '✅ Confirmar' : type === 'warning' ? '👑 Continuar' : '👍 Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Loading Modal
const LoadingModal = ({ isOpen, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-loading">
        <div className="loading-spinner"></div>
        <h3>{message}</h3>
        <p>Por favor, espera...</p>
      </div>
    </div>
  );
};

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para los modales
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null
  });
  const [loadingModal, setLoadingModal] = useState({
    isOpen: false,
    message: ''
  });

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
      
      const response = await axios.get('http://localhost:3000/api/admin/usuarios', {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });

      console.log('✅ Respuesta de usuarios:', response.data);

      if (response.data.success) {
        setUsuarios(response.data.usuarios || []);
        setEstadisticas(response.data.estadisticas || null);
      } else {
        setUsuarios(Array.isArray(response.data) ? response.data : []);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      
      if (error.response?.status === 401) {
        toast.error('No tienes permisos para acceder a esta información.');
        localStorage.removeItem('token');
      } else if (error.response?.status === 403) {
        toast.error('Acceso denegado. Se requieren permisos de administrador.');
      } else {
        toast.error('Error al cargar usuarios. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showModal = (title, message, type, onConfirm) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: 'warning',
      title: '',
      message: '',
      onConfirm: null
    });
  };

  const showLoading = (message) => {
    setLoadingModal({
      isOpen: true,
      message
    });
  };

  const hideLoading = () => {
    setLoadingModal({
      isOpen: false,
      message: ''
    });
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('No estás autenticado.');
      return;
    }

    try {
      console.log(`🔄 Cambiando estado del usuario ${id} a: ${nuevoEstado}`);
      
      const response = await axios.put(
        `http://localhost:3000/api/admin/usuario/${id}/estado`,
        { estado: nuevoEstado },
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );

      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id_usuario === id
            ? { ...usuario, estado_usuario: nuevoEstado }
            : usuario
        )
      );

      const mensaje = response.data.message || 
        `Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`;
      
      toast.success(mensaje);
      
    } catch (error) {
      console.error('❌ Error al cambiar estado del usuario:', error);
      
      if (error.response?.status === 401) {
        toast.error('No tienes permisos para realizar esta acción.');
      } else if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'Acceso denegado.');
      } else if (error.response?.status === 404) {
        toast.error('Usuario no encontrado.');
      } else {
        toast.error(error.response?.data?.message || 'Error al cambiar estado del usuario.');
      }
    }
  };

  // NUEVA FUNCIONALIDAD CON MODAL PERSONALIZADO: Cambiar rol de usuario
  const handleCambiarRol = async (id, nombreUsuario, rolActual) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('No estás autenticado.');
      return;
    }

    // Primera confirmación con modal personalizado
    const firstMessage = `
      <div class="confirm-content">
        <h3 style="color: #2c3e50; margin-bottom: 15px;">
          ¿Convertir a "${nombreUsuario}" en administrador?
        </h3>
        <div class="info-box info-warning">
          <h4 style="color: #e74c3c; margin-bottom: 10px;">⚡ Esta acción otorgará:</h4>
          <ul style="color: #555; text-align: left; padding-left: 20px;">
            <li>✅ Permisos de administrador completos</li>
            <li>✅ Capacidad de gestionar otros usuarios</li>
            <li>✅ Acceso a todas las funciones administrativas</li>
            <li>✅ Posibilidad de cambiar roles de otros usuarios</li>
          </ul>
        </div>
        <div class="info-box info-alert">
          <strong style="color: #856404;">⚠️ Importante:</strong>
          <span style="color: #856404;"> Esta acción no se puede deshacer fácilmente.</span>
        </div>
      </div>
    `;

    showModal(
      'Confirmar Promoción',
      firstMessage,
      'warning',
      () => {
        closeModal();
        
        // Segunda confirmación
        const finalMessage = `
          <div class="confirm-content">
            <div class="gradient-header">
              <h3 style="margin: 0; color: white;">👑 Promoción a Administrador</h3>
            </div>
            <h4 style="color: #2c3e50; margin: 20px 0 15px 0;">
              ¿Confirmar promoción de "${nombreUsuario}"?
            </h4>
            <p style="color: #7f8c8d; font-size: 14px;">
              Esta es tu última oportunidad para cancelar esta acción.
            </p>
          </div>
        `;

        showModal(
          'Confirmación Final',
          finalMessage,
          'question',
          async () => {
            closeModal();
            await executeRoleChange();
          }
        );
      }
    );

    const executeRoleChange = async () => {
      try {
        showLoading('Cambiando rol de usuario');

        console.log(`🔄 Cambiando rol del usuario ${id} de ${rolActual} a admin`);
        
        const response = await axios.put(
          `http://localhost:3000/api/admin/usuario/${id}/rol`,
          { nuevoRol: 'admin' },
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
              ? { ...usuario, rol: 'admin' }
              : usuario
          )
        );

        hideLoading();

        // Mostrar éxito con modal personalizado
        const successMessage = `
          <div class="confirm-content">
            <div class="success-header">
              <h3 style="margin: 0; color: #2c3e50;">👑 ${nombreUsuario}</h3>
              <p style="margin: 5px 0 0 0; color: #7f8c8d;">ahora es Administrador</p>
            </div>
            <div class="info-box info-success">
              <p style="color: #27ae60; margin: 0;">
                ✅ Los cambios son efectivos inmediatamente<br>
                ✅ El usuario puede acceder a funciones de admin
              </p>
            </div>
          </div>
        `;

        showModal(
          '¡Promoción Exitosa!',
          successMessage,
          'success',
          () => {
            closeModal();
            if (estadisticas) {
              setTimeout(() => fetchUsuarios(), 1000);
            }
          }
        );
        
      } catch (error) {
        hideLoading();
        console.error('❌ Error al cambiar rol del usuario:', error);
        
        let errorMessage = 'Error al cambiar rol del usuario. Intenta nuevamente.';
        
        if (error.response?.status === 401) {
          errorMessage = 'No tienes permisos para realizar esta acción.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Usuario no encontrado.';
        } else if (error.response?.status === 403) {
          errorMessage = 'No tienes permisos suficientes para cambiar roles.';
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.message || 'Error en la solicitud.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        showModal(
          'Error',
          `<div class="confirm-content"><p>${errorMessage}</p></div>`,
          'error',
          () => closeModal()
        );
      }
    };
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
            {estadisticas ? (
              <>
                <p>Total de usuarios: <strong>{estadisticas.total}</strong></p>
                <p>
                  Activos: <strong>{estadisticas.activos}</strong> | 
                  Inactivos: <strong>{estadisticas.inactivos}</strong>
                </p>
                <p>
                  Administradores: <strong>{estadisticas.admins}</strong> | 
                  Clientes: <strong>{estadisticas.clientes}</strong>
                </p>
              </>
            ) : (
              <>
                <p>Total de usuarios: <strong>{usuarios.length}</strong></p>
                <p>
                  Activos: <strong>{usuarios.filter(u => u.estado_usuario === 'activo').length}</strong> | 
                  Inactivos: <strong>{usuarios.filter(u => u.estado_usuario === 'inactivo').length}</strong>
                </p>
                <p>
                  Administradores: <strong>{usuarios.filter(u => u.rol === 'admin').length}</strong> | 
                  Clientes: <strong>{usuarios.filter(u => u.rol === 'cliente').length}</strong>
                </p>
              </>
            )}
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
                    {usuario.rut && (
                      <div className="usuario-rut">
                        📄 RUT: {usuario.rut}
                      </div>
                    )}
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
                    disabled={usuario.rol === 'admin'}
                    title={usuario.rol === 'admin' ? 'No se puede cambiar el estado de un administrador' : ''}
                  >
                    {usuario.estado_usuario === 'activo' ? '🚫 Desactivar' : '✅ Activar'}
                  </button>

                  {usuario.rol === 'cliente' && usuario.estado_usuario === 'activo' && (
                    <button
                      className="btn-hacer-admin"
                      onClick={() =>
                        handleCambiarRol(
                          usuario.id_usuario,
                          `${usuario.nombre_usuario} ${usuario.apellido_usuario}`,
                          usuario.rol
                        )
                      }
                      title="Convertir en administrador"
                    >
                      👑 Hacer Admin
                    </button>
                  )}
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

      {/* Modales personalizados */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      <LoadingModal
        isOpen={loadingModal.isOpen}
        message={loadingModal.message}
      />

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