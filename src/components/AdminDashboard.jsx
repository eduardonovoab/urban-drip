import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    // Obtener datos del usuario desde el localStorage
    const storedUser = JSON.parse(localStorage.getItem('usuario'));
    if (storedUser) {
      setUser(storedUser);
    }

    // Obtener la lista de productos y usuarios (esto es solo un ejemplo)
    fetchProductos();
    fetchUsuarios();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/producto', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setProductos(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/usuarios', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsuarios(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="header">
        <h1>Bienvenido, {user ? user.nombre : 'Administrador'}</h1>
        <p>Panel de control</p>
      </div>

      <div className="menu">
        <h3>Menú</h3>
        <ul>
          <li><Link to="/admin/reportes">Generar Reportes</Link></li>
          <li><Link to="/admin/productos">Gestionar Productos</Link></li>
          <li><Link to="/admin/usuarios">Gestionar Usuarios</Link></li>
        </ul>
      </div>

      <div className="content">
        <h3>Productos</h3>
        <button onClick={() => fetchProductos()}>Actualizar Productos</button>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id_producto}>
                <td>{producto.nombre}</td>
                <td>{producto.descripcion}</td>
                <td>{producto.estado}</td>
                <td>
                  <button onClick={() => a}>Editar</button>
                  <button onClick={() => a}>Cambiar Estado</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Usuarios</h3>
        <button onClick={() => fetchUsuarios()}>Actualizar Usuarios</button>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id_usuario}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>{usuario.estado}</td>
                <td>
                  <button onClick={() => a}>Editar</button>
                  <button onClick={() => a}>Cambiar Estado</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default AdminDashboard;
