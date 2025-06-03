import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import '../styles/AdminUsuarios.css'; // Nuevo archivo CSS para estilos

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchData = async () => {
        try {
          const response = await axios.get('http://localhost:3000/api/admin/usuarios', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(response.data);
          setUsuarios(response.data);
        } catch (error) {
          console.error('Error al cargar usuarios:', error);
          toast.error('Error al cargar usuarios');
        }
      };
      fetchData();
    }
  }, []);
  const handleCambiarEstado = async (id, nuevoEstado) => {
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error('No estás autenticado.');
    return;
  }
  try {
    await axios.put(
      `http://localhost:3000/api/admin/usuario/${id}/estado`, // Ya no tiene '/api' extra
      { estado: nuevoEstado },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUsuarios((prevUsuarios) =>
      prevUsuarios.map((usuario) =>
        usuario.id_usuario === id ? { ...usuario, estado: nuevoEstado } : usuario
      )
    );
    toast.success(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    toast.error('Error al cambiar estado del usuario');
  }
};

  return (
    <div className="admin-usuarios-container">
      <h2>Usuarios</h2>
      {usuarios.length > 0 ? (
        <div className="usuarios-lista">
          {usuarios.map((usuario) => (
            <div key={usuario.id_usuario} className="usuario-item">
              <div className="usuario-info">
                <div className="usuario-nombre">{usuario.nombre} {usuario.apellido}</div>
                <div className="usuario-rol">Rol: {usuario.rol}</div>
                <div className="usuario-correo">{usuario.correo}</div>
                <div className={`usuario-estado ${usuario.estado === 'activo' ? 'activo' : 'inactivo'}`}>
                  Estado: {usuario.estado}
                </div>
              </div>
              <button
                className="btn-estado"
                onClick={() =>
                  handleCambiarEstado(
                    usuario.id_usuario,
                    usuario.estado === 'activo' ? 'inactivo' : 'activo'
                  )
                }
              >
                {usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay usuarios disponibles</p>
      )}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default AdminUsuarios;
