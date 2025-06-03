import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../styles/ListarProductos.css';

const ListarProductos = () => {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchData = async () => {
        try {
          const response = await axios.get('http://localhost:3000/api/admin/producto', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProductos(response.data);
        } catch (error) {
          console.error('Error al cargar productos:', error);
          toast.error('Error al cargar productos');
        }
      };
      fetchData();
    }
  }, []);

  const handleModificar = (id) => {
    navigate(`/admin/editar/${id}`);
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado.');
      return;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/admin/producto/${id}`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProductos((prevProductos) =>
        prevProductos.map((prod) =>
          prod.id_producto === id ? { ...prod, estado: nuevoEstado } : prod
        )
      );

      toast.success(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error al cambiar estado del producto:', error);
      toast.error('Error al cambiar estado del producto');
    }
  };

  return (
    <div className="producto-list">
      <h2 className="titulo">Lista de Productos</h2>
      <div className="productos-container">
        {productos.map((producto) => (
          <div className="producto-item" key={producto.id_producto}>
            <img src={producto.imagen_url} alt={producto.nombre_producto} className="producto-img" />
            <div className="producto-info">
              <div className="producto-nombre">{producto.nombre_producto}</div>
              <div className="producto-precio">${producto.precio}</div>
              <div className="producto-categoria">Categoría: {producto.nombre_categoria}</div>
              <div className="producto-talla">Talla: {producto.nombre_talla}</div>
              <div className="producto-marca">Marca: {producto.nombre_marca}</div>
              <div className="producto-estado">Estado: {producto.estado}</div>
              <div className="producto-actions">
                <button className="btn-modificar" onClick={() => handleModificar(producto.id_producto)}>Modificar</button>
                <button
                  className="btn-desactivar"
                  onClick={() =>
                    handleCambiarEstado(
                      producto.id_producto,
                      producto.estado === 'activo' ? 'inactivo' : 'activo'
                    )
                  }
                >
                  {producto.estado === 'activo' ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default ListarProductos;
