// contexts/CarritoContext.js - VERSIÓN CORREGIDA
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CarritoContext = createContext();

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de CarritoProvider');
  }
  return context;
};

// Alias para compatibilidad
export const useCart = useCarrito;

export const CarritoProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]); // Array de items para compatibilidad con Navbar
  const [carritoCompleto, setCarritoCompleto] = useState({ id_pedido: null, items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [carritoLoading, setCarritoLoading] = useState(false); // Alias
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [userChecked, setUserChecked] = useState(false); // 🔥 NUEVO: Track si ya verificamos el usuario

  // URLs que coinciden con tu backend
  const API_BASE_URL = 'http://localhost:3000/api/client';

  // Función para obtener el token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // 🔥 NUEVA: Función para verificar si el token es válido
  const verifyToken = async () => {
    const token = getAuthToken();
    
    if (!token) {
      return false;
    }

    try {
      // Verificar token con el backend
      const response = await fetch(`${API_BASE_URL}/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  };

  // Función para hacer requests autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      // Si el token expiró o es inválido
      if (response.status === 401 || response.status === 403) {
        console.warn('Token inválido o expirado, limpiando sesión');
        localStorage.removeItem('token');
        setCarrito([]);
        setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error en authenticatedFetch:', error);
      throw error;
    }
  };

  // 🔥 CORREGIDA: Obtener carrito del servidor
  const obtenerCarrito = async (showLoading = true) => {
    console.log('🛒 obtenerCarrito llamada - showLoading:', showLoading);
    
    if (showLoading) {
      setLoading(true);
      setCarritoLoading(true);
    }
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.log('❌ No hay token, limpiando carrito');
        setCarrito([]);
        setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
        setInitialized(true);
        setUserChecked(true);
        return;
      }

      console.log('✅ Token encontrado, obteniendo carrito del servidor...');

      // Usar la ruta de tu backend: GET /carrito
      const data = await authenticatedFetch('/carrito');
      
      console.log('📦 Respuesta del servidor:', data);
      
      if (data.success) {
        // Tu backend devuelve: { success: true, carrito: { id_pedido, items, total } }
        const carritoData = data.carrito;
        console.log('✅ Carrito cargado exitosamente:', carritoData);
        
        setCarritoCompleto(carritoData);
        setCarrito(carritoData.items || []); // Para compatibilidad con Navbar
        
        toast.success(`Carrito cargado: ${carritoData.items?.length || 0} productos`, {
          autoClose: 2000
        });
      } else {
        console.log('⚠️ Backend respondió sin éxito, limpiando carrito');
        setCarrito([]);
        setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
      }
      
      setInitialized(true);
      setUserChecked(true);
      
    } catch (err) {
      console.error('❌ Error al cargar el carrito:', err);
      
      if (err.message.includes('404') || err.message.includes('not found')) {
        console.warn('El endpoint del carrito aún no está implementado');
      } else if (err.message.includes('Sesión expirada')) {
        toast.error(err.message);
      } else if (showLoading) {
        toast.error('Error al cargar el carrito');
      }
      
      setCarrito([]);
      setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
      setInitialized(true);
      setUserChecked(true);
    } finally {
      if (showLoading) {
        setLoading(false);
        setCarritoLoading(false);
      }
    }
  };

  // Alias para compatibilidad
  const fetchCarrito = obtenerCarrito;

  // 🔥 MEJORADA: Agregar producto al carrito
  const agregarAlCarrito = async (detalle_producto_id, cantidad = 1) => {
    console.log('➕ Agregando al carrito:', { detalle_producto_id, cantidad });
    
    try {
      setLoading(true);
      setError(null);

      // Verificar token antes de agregar
      const token = getAuthToken();
      if (!token) {
        throw new Error('Debes iniciar sesión para agregar productos al carrito');
      }

      // Usar la ruta de tu backend: POST /carrito/agregar
      const data = await authenticatedFetch('/carrito/agregar', {
        method: 'POST',
        body: JSON.stringify({
          detalle_producto_id,
          cantidad
        }),
      });

      console.log('📦 Respuesta agregar al carrito:', data);

      if (data.success) {
        toast.success(data.message || 'Producto agregado al carrito');
        // Refrescar el carrito sin mostrar loading
        await obtenerCarrito(false);
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message };

    } catch (err) {
      setError(err.message);
      console.error('❌ Error al agregar al carrito:', err);
      toast.error(err.message || 'Error al agregar al carrito');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad - Compatible con tu backend
  const actualizarCantidad = async (detalle_id, cantidad) => {
    try {
      setLoading(true);
      setError(null);

      // Usar la ruta de tu backend: PUT /carrito/actualizar
      const data = await authenticatedFetch('/carrito/actualizar', {
        method: 'PUT',
        body: JSON.stringify({
          detalle_id,
          cantidad
        }),
      });

      if (data.success) {
        toast.success(data.message || 'Cantidad actualizada');
        // Refrescar el carrito
        await obtenerCarrito(false);
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message };

    } catch (err) {
      setError(err.message);
      console.error('Error al actualizar cantidad:', err);
      toast.error(err.message || 'Error al actualizar cantidad');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar del carrito - Compatible con tu backend
  const eliminarDelCarrito = async (detalle_producto_id) => {
    try {
      setLoading(true);
      setError(null);

      // Usar la ruta de tu backend: DELETE /carrito/eliminar/:detalle_producto_id
      const data = await authenticatedFetch(`/carrito/eliminar/${detalle_producto_id}`, {
        method: 'DELETE',
      });

      if (data.success) {
        toast.success(data.message || 'Producto eliminado del carrito');
        // Refrescar el carrito
        await obtenerCarrito(false);
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message };

    } catch (err) {
      setError(err.message);
      console.error('Error al eliminar del carrito:', err);
      toast.error(err.message || 'Error al eliminar del carrito');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Limpiar carrito - Compatible con tu backend
  const limpiarCarrito = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      
      // Si no hay token, solo limpiar estado local
      if (!token) {
        console.log('🧹 Limpiando carrito local (sin token)');
        setCarrito([]);
        setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
        return { success: true, message: 'Carrito limpiado' };
      }

      // Usar la ruta de tu backend: DELETE /carrito/limpiar
      const data = await authenticatedFetch('/carrito/limpiar', {
        method: 'DELETE',
      });

      if (data.success) {
        toast.success(data.message || 'Carrito limpiado');
        // Actualizar estado local
        setCarrito([]);
        setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message };

    } catch (err) {
      setError(err.message);
      console.error('Error al limpiar carrito:', err);
      toast.error(err.message || 'Error al limpiar carrito');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Finalizar compra - Compatible con tu backend
  const finalizarCompra = async (metodo_pago) => {
    try {
      setLoading(true);
      setError(null);

      // Usar la ruta de tu backend: POST /carrito/finalizar
      const data = await authenticatedFetch('/carrito/finalizar', {
        method: 'POST',
        body: JSON.stringify({
          metodo_pago
        }),
      });

      if (data.success) {
        toast.success(data.message || 'Compra realizada exitosamente');
        // Limpiar carrito local
        setCarrito([]);
        setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
        return { success: true, message: data.message, pedido_id: data.pedido_id };
      }
      
      return { success: false, message: data.message };

    } catch (err) {
      setError(err.message);
      console.error('Error al finalizar compra:', err);
      toast.error(err.message || 'Error al finalizar compra');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad
  const calcularTotal = () => {
    return carritoCompleto.total || carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const getCantidadTotal = () => {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
  };

  // Alias para compatibilidad
  const cantidadTotal = getCantidadTotal;

  const estaEnCarrito = (detalle_producto_id) => {
    return carrito.some(item => item.id_detalle_producto === detalle_producto_id);
  };

  const getCantidadProducto = (detalle_producto_id) => {
    const item = carrito.find(item => item.id_detalle_producto === detalle_producto_id);
    return item ? item.cantidad : 0;
  };

  // 🔥 CORREGIDO: useEffect para cargar carrito al montar
  useEffect(() => {
    console.log('🚀 CarritoProvider useEffect ejecutado');
    
    const initializeCarrito = async () => {
      const token = getAuthToken();
      console.log('🔑 Token al inicializar:', token ? 'Existe' : 'No existe');
      
      if (token) {
        console.log('✅ Token encontrado, cargando carrito...');
        await obtenerCarrito(true);
      } else {
        console.log('❌ No hay token, marcando como inicializado');
        setInitialized(true);
        setUserChecked(true);
      }
    };

    // Solo inicializar si no se ha hecho antes
    if (!userChecked) {
      initializeCarrito();
    }
  }, [userChecked]); // 🔥 Dependencia cambiada

  // 🔥 NUEVO: useEffect para detectar cambios de autenticación
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        console.log('🔄 Token cambió en localStorage');
        
        // Reset estados
        setInitialized(false);
        setUserChecked(false);
        
        if (e.newValue) {
          console.log('✅ Nuevo token detectado, recargando carrito');
          obtenerCarrito(true);
        } else {
          console.log('❌ Token removido, limpiando carrito');
          setCarrito([]);
          setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
          setInitialized(true);
          setUserChecked(true);
        }
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value = {
    // Estado compatible con ambos enfoques
    carrito, // Array de items (para Navbar)
    carritoCompleto, // Objeto completo (para Carrito component)
    loading,
    carritoLoading, // Alias
    error,
    initialized,
    userChecked, // 🔥 NUEVO: Indicar si ya verificamos usuario
    
    // Funciones principales
    obtenerCarrito,
    fetchCarrito, // Alias
    agregarAlCarrito,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    finalizarCompra,
    verifyToken, // 🔥 NUEVA función
    
    // Funciones de utilidad
    calcularTotal,
    getCantidadTotal,
    cantidadTotal, // Alias
    estaEnCarrito,
    getCantidadProducto,
    
    // Función para limpiar errores
    clearError: () => setError(null)
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
    </CarritoContext.Provider>
  );
};