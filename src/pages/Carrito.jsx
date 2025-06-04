// src/pages/Carrito.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import '../styles/Carrito.css';

const Carrito = () => {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Obtener carrito de compras desde el backend
      fetch('http://localhost:3000/api/carrito', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setProductos(data.productos);
          // Calcular el total
          let precioTotal = 0;
          data.productos.forEach((producto) => {
            precioTotal += producto.precio * producto.cantidad;
          });
          setTotal(precioTotal);
        })
        .catch((err) => {
          console.error('Error al obtener carrito:', err);
          toast.error('Error al cargar el carrito');
        });
    } else {
      toast.error('No estás autenticado');
    }
  }, []);

  const handleEliminar = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado.');
      return;
    }

    try {
      await fetch(`http://localhost:3000/api/carrito/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      // Actualizar productos después de eliminar
      setProductos((prev) => prev.filter((producto) => producto.id_detalle_producto !== id));
      toast.success('Producto eliminado del carrito');
    } catch (error) {
      toast.error('Error al eliminar producto del carrito');
    }
  };

  return (
    <div className="carrito-container">
      <h2>Carrito de Compras</h2>
      {productos.length === 0 ? (
        <p>El carrito está vacío.</p>
      ) : (
        <div>
          <div className="carrito-productos">
            {productos.map((producto) => (
              <div key={producto.id_detalle_producto} className="producto-item">
                <img src={producto.imagen_url} alt={producto.nombre} />
                <div className="producto-info">
                  <p>{producto.nombre}</p>
                  <p>Cantidad: {producto.cantidad}</p>
                  <p>Precio unitario: ${producto.precio}</p>
                  <button onClick={() => handleEliminar(producto.id_detalle_producto)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="carrito-total">
            <h3>Total: ${total}</h3>
            <button>Realizar pedido</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carrito;
