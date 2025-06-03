// Admin.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Admin = () => {
  const { user } = useContext(AuthContext); // Obtener el usuario desde el contexto
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true); // Para manejar el estado de carga

  useEffect(() => {
    const token = localStorage.getItem('token'); // Obtener el token de localStorage

    // Verificar que el token esté disponible
    if (!token) {
      toast.error('No estás autenticado. Por favor, inicia sesión.');
      setLoading(false); // Detener la carga si no hay token
      return;
    }
    console.log("Token enviado:", localStorage.getItem('token'));
    if (user && user.rol === 'admin') {
      const fetchData = async () => {
        try {
          const response = await axios.get('http://localhost:3000/api/admin/producto', {
            headers: { Authorization: `Bearer ${token}` } // Enviar el token en los encabezados
          });
          setProductos(response.data);
        } catch (error) {
          console.error(error); // Verificar el error en la consola
          toast.error('Error al cargar productos');
        } finally {
          setLoading(false); // Cambiar el estado de carga a false después de la solicitud
        }
      };
      fetchData();
    } else {
      toast.error('Acceso denegado. Solo los administradores pueden acceder.');
      setLoading(false); // Detener la carga si el usuario no tiene el rol 'admin'
    }
  }, [user]);

  return (
    <div>
      <h2>Bienvenido {user?.nombre}, al panel de administración</h2>
      <div>
        <h3>Productos</h3>
        <button>Agregar Producto</button>

        {loading ? (
          <p>Cargando productos...</p>
        ) : (
          <div>
            {productos.length > 0 ? (
              <ul>
                {productos.map((producto) => (
                  <li key={producto.id_producto}>
                    {producto.nombre_producto}
                    {/* Aquí puedes agregar más opciones como editar, eliminar, cambiar estado */}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay productos disponibles</p>
            )}
          </div>
        )}
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Admin;
