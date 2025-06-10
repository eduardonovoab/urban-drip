import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]);
  const [carritoLoading, setCarritoLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Función para obtener el carrito del servidor
  const fetchCarrito = async (showLoading = true) => {
    if (showLoading) {
      setCarritoLoading(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setCarrito([]);
        setInitialized(true);
        return;
      }

      const response = await fetch('http://localhost:3000/api/cliente/carrito', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Endpoint del carrito no encontrado');
          setCarrito([]);
          setInitialized(true);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta no es JSON válido');
      }

      const data = await response.json();
      setCarrito(data.productos || []);
      setInitialized(true);
      
    } catch (err) {
      console.error('Error al cargar el carrito:', err);
      
      if (err.message.includes('404') || err.message.includes('not found')) {
        console.warn('El endpoint del carrito aún no está implementado');
      } else if (showLoading) {
        toast.error('Error al cargar el carrito');
      }
      
      setCarrito([]);
      setInitialized(true);
    } finally {
      if (showLoading) {
        setCarritoLoading(false);
      }
    }
  };

  // Función para agregar producto al carrito
  const agregarAlCarrito = async (detalle_producto_id, cantidad = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Error: Usuario no autenticado');
      return false;
    }

    const requestBody = {
      detalle_producto_id,
      cantidad,
    };

    try {
      const response = await fetch('http://localhost:3000/api/cliente/carrito', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Actualizar el carrito sin mostrar loading (silencioso)
        await fetchCarrito(false);
        return true;
      } else {
        toast.error(data.message || 'Error al agregar al carrito');
        return false;
      }
    } catch (error) {
      toast.error('Error al agregar al carrito');
      console.error('Error al agregar al carrito:', error);
      return false;
    }
  };

  // Función para eliminar producto del carrito
  const eliminarDelCarrito = async (detalle_producto_id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/cliente/carrito/${detalle_producto_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Producto eliminado del carrito');
        // Actualizar el carrito sin mostrar loading (silencioso)
        await fetchCarrito(false);
        return true;
      } else {
        toast.error('Error al eliminar el producto');
        return false;
      }
    } catch (error) {
      toast.error('Error al eliminar el producto');
      console.error('Error:', error);
      return false;
    }
  };

  // Función para limpiar el carrito (útil al cerrar sesión)
  const limpiarCarrito = () => {
    setCarrito([]);
  };

  // Calcular total del carrito
  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  // Obtener cantidad total de productos
  const cantidadTotal = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  };

  const value = {
    carrito,
    carritoLoading,
    initialized,
    fetchCarrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    limpiarCarrito,
    calcularTotal,
    cantidadTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};