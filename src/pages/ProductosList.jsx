import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductosList = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/admin/productos', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProductos(response.data);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };

    fetchProductos();
  }, []);

  const handleDisable = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/admin/producto/${id}`,
        { estado: 'inactivo' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setProductos(productos.map((prod) => (prod.id_producto === id ? { ...prod, estado: 'inactivo' } : prod)));
    } catch (error) {
      console.error('Error al desactivar producto:', error);
    }
  };

  const handleModify = (id) => {
    // Redirigir a la página para modificar el producto
    console.log('Modificar producto con ID:', id);
  };

  return (
    <div>
      <h2>Lista de Productos</h2>
      <ul>
        {productos.map((producto) => (
          <li key={producto.id_producto}>
            {producto.nombre_producto} - {producto.estado}
            <button onClick={() => handleModify(producto.id_producto)}>Modificar</button>
            <button onClick={() => handleDisable(producto.id_producto)}>Desactivar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductosList;
