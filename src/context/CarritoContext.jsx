// contexts/CarritoContext.js - VERSIÓN CON VERIFICACIÓN DE ROL ADMIN ROBUSTA
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
  const [userChecked, setUserChecked] = useState(false);
  
  // 🔥 NUEVO: Estado para el usuario y su rol
  const [usuario, setUsuario] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // URLs que coinciden con tu backend
  const API_BASE_URL = 'http://localhost:3000/api/client';

  // Función para obtener el token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // 🔥 FUNCIÓN HELPER: Verificar si es admin directamente desde el token
  const verificarAdminDesdeToken = () => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('🔍 Verificando admin desde token:', payload);
      
      const rol = payload.rol || payload.role || payload.user_role || payload.tipo_usuario || payload.userRole || payload.roleType;
      const esAdmin = rol?.toLowerCase() === 'admin' || rol?.toLowerCase() === 'administrador';
      
      console.log('🔍 Rol encontrado en token:', rol, 'Es admin:', esAdmin);
      return esAdmin;
    } catch (error) {
      console.error('Error al verificar admin desde token:', error);
      return false;
    }
  };

  // 🔥 NUEVA: Función para decodificar el token y obtener info del usuario
  const getUserInfoFromToken = () => {
    const token = getAuthToken();
    
    if (!token) {
      return null;
    }

    try {
      // Decodificar el JWT token (asumiendo que es un JWT)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.warn('Token no es un JWT válido');
        return null;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('🔍 Información del token:', payload);
      
      return payload;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  };

  // 🔥 MEJORADA: Función para obtener información completa del usuario
  const obtenerInfoUsuario = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.log('❌ No hay token, limpiando estados de usuario');
        setUsuario(null);
        setUserRole(null);
        setIsAdmin(false);
        setUserChecked(true);
        return null;
      }

      console.log('🔍 Obteniendo información del usuario...');

      // 🔥 VERIFICACIÓN ROBUSTA: Primero intentar obtener info del token
      const tokenInfo = getUserInfoFromToken();
      
      if (tokenInfo) {
        console.log('🔍 Info completa del token:', tokenInfo);
        
        // Buscar el rol en múltiples campos posibles
        const rol = tokenInfo.rol || 
                    tokenInfo.role || 
                    tokenInfo.user_role || 
                    tokenInfo.tipo_usuario ||
                    tokenInfo.userRole ||
                    tokenInfo.roleType;
        
        if (rol) {
          console.log('👤 Rol del usuario desde token:', rol);
          const esAdmin = rol.toLowerCase() === 'admin' || rol.toLowerCase() === 'administrador';
          
          setUserRole(rol);
          setIsAdmin(esAdmin);
          setUsuario(tokenInfo);
          setUserChecked(true);
          
          console.log('✅ Usuario configurado desde token - isAdmin:', esAdmin, 'userRole:', rol);
          return tokenInfo;
        } else {
          console.warn('⚠️ No se encontró rol en el token. Campos disponibles:', Object.keys(tokenInfo));
        }
      }

      // 🔥 Si no hay info de rol en el token, intentar API
      console.log('🌐 Intentando obtener info del usuario desde API...');
      
      try {
        const data = await authenticatedFetch('/perfil');
        
        if (data.success && data.usuario) {
          console.log('👤 Información del usuario desde API:', data.usuario);
          const rol = data.usuario.rol || 
                     data.usuario.role || 
                     data.usuario.tipo_usuario ||
                     data.usuario.userRole;
          
          if (rol) {
            const esAdmin = rol.toLowerCase() === 'admin' || rol.toLowerCase() === 'administrador';
            
            setUsuario(data.usuario);
            setUserRole(rol);
            setIsAdmin(esAdmin);
            setUserChecked(true);
            
            console.log('✅ Usuario configurado desde API - isAdmin:', esAdmin, 'userRole:', rol);
            return data.usuario;
          } else {
            console.warn('⚠️ No se encontró rol en respuesta de API. Usuario:', data.usuario);
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Error al obtener info del usuario desde API:', apiError);
        
        // 🔥 FALLBACK: Si falla la API pero tenemos info del token, usar esa
        if (tokenInfo) {
          console.log('🔄 Usando info del token como fallback');
          
          // Asumir rol basado en estructura del token o default
          const rol = tokenInfo.rol || tokenInfo.role || 'cliente';
          const esAdmin = rol.toLowerCase() === 'admin' || rol.toLowerCase() === 'administrador';
          
          setUsuario(tokenInfo);
          setUserRole(rol);
          setIsAdmin(esAdmin);
          setUserChecked(true);
          
          console.log('✅ Usuario configurado desde token (fallback) - isAdmin:', esAdmin);
          return tokenInfo;
        }
      }
      
      // 🔥 ÚLTIMO RECURSO: Si no se pudo determinar nada, asumir cliente
      console.log('🤷 No se pudo determinar rol específico, asumiendo cliente');
      setUserRole('cliente');
      setIsAdmin(false);
      setUsuario({ id: 'unknown', nombre: 'Usuario' });
      setUserChecked(true);
      
      return null;
      
    } catch (error) {
      console.error('❌ Error crítico al obtener información del usuario:', error);
      setUsuario(null);
      setUserRole('cliente'); // Por defecto cliente en caso de error
      setIsAdmin(false);
      setUserChecked(true);
      return null;
    }
  };

  // Función para verificar si el token es válido
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
        setUsuario(null);
        setUserRole(null);
        setIsAdmin(false);
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

  // Obtener carrito del servidor
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

  // 🔥 MEJORADA: Agregar producto al carrito con verificación FORZADA de admin
  const agregarAlCarrito = async (detalle_producto_id, cantidad = 1) => {
    console.log('➕ Agregando al carrito:', { detalle_producto_id, cantidad });
    console.log('🔍 Estado actual - isAdmin:', isAdmin, 'userRole:', userRole, 'usuario:', usuario);
    
    // 🔥 VERIFICACIÓN INMEDIATA desde el token
    const esAdminToken = verificarAdminDesdeToken();
    console.log('🔍 Verificación directa desde token - Es admin:', esAdminToken);

    if (esAdminToken) {
      const mensaje = 'No puedes agregar al carrito siendo admin';
      toast.error(mensaje, {
        autoClose: 4000
      });
      console.warn('🚫 Admin detectado desde TOKEN - Bloqueado antes de HTTP');
      return { 
        success: false, 
        message: mensaje,
        isAdminBlocked: true 
      };
    }

    // 🔥 VERIFICACIÓN ADICIONAL: Si los estados no están cargados, forzar carga
    if (userRole === null || usuario === null) {
      console.warn('⏳ Estados de usuario no cargados, obteniendo información...');
      
      try {
        await obtenerInfoUsuario();
        
        // Verificar nuevamente después de cargar
        const esAdminDespues = isAdmin || 
                              userRole?.toLowerCase() === 'admin' || 
                              userRole?.toLowerCase() === 'administrador';
        
        console.log('🔍 Después de obtener info - isAdmin:', isAdmin, 'userRole:', userRole);
        
        if (esAdminDespues) {
          const mensaje = 'No puedes agregar al carrito siendo admin';
          toast.error(mensaje, {
            autoClose: 4000
          });
          console.warn('🚫 Admin detectado después de cargar info - Bloqueado');
          return { 
            success: false, 
            message: mensaje,
            isAdminBlocked: true 
          };
        }
      } catch (error) {
        console.error('Error al obtener info del usuario:', error);
      }
    }

    // 🔥 VERIFICACIÓN FINAL: Con todos los métodos disponibles
    const esAdmin = isAdmin || 
                    userRole?.toLowerCase() === 'admin' || 
                    userRole?.toLowerCase() === 'administrador' ||
                    usuario?.rol?.toLowerCase() === 'admin' ||
                    usuario?.rol?.toLowerCase() === 'administrador' ||
                    esAdminToken;

    if (esAdmin) {
      const mensaje = 'No puedes agregar al carrito siendo admin';
      toast.error(mensaje, {
        autoClose: 4000
      });
      console.warn('🚫 Admin detectado en verificación final - Bloqueado');
      return { 
        success: false, 
        message: mensaje,
        isAdminBlocked: true 
      };
    }
    
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('Debes iniciar sesión para agregar productos al carrito');
      }

      console.log('✅ Procediendo con petición HTTP - Usuario confirmado NO es admin');

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
        await obtenerCarrito(false);
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message };

    } catch (err) {
      setError(err.message);
      console.error('❌ Error al agregar al carrito:', err);
      
      // 🔥 MANEJO ESPECIAL para error 403: Verificar admin nuevamente
      if (err.message.includes('403') || err.message.includes('Forbidden')) {
        console.log('🔍 Error 403 detectado, verificación final de admin...');
        
        const esAdminFinal = verificarAdminDesdeToken();
        
        if (esAdminFinal) {
          const mensaje = 'No puedes agregar al carrito siendo admin';
          toast.error(mensaje, {
            autoClose: 4000
          });
          console.warn('🚫 Error 403 confirmado: Usuario es admin (verificación desde token)');
          
          // Actualizar estados para futuras operaciones
          setIsAdmin(true);
          setUserRole('admin');
          
          return { 
            success: false, 
            message: mensaje,
            isAdminBlocked: true 
          };
        }
      }
      
      toast.error(err.message || 'Error al agregar al carrito');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad - Compatible con tu backend
  const actualizarCantidad = async (detalle_id, cantidad) => {
    // 🔥 VERIFICACIÓN ADMIN
    const esAdminToken = verificarAdminDesdeToken();
    if (esAdminToken || isAdmin) {
      toast.error('No puedes modificar el carrito siendo admin');
      return { success: false, message: 'Acción no permitida para administradores' };
    }

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
    // 🔥 VERIFICACIÓN ADMIN
    const esAdminToken = verificarAdminDesdeToken();
    if (esAdminToken || isAdmin) {
      toast.error('No puedes modificar el carrito siendo admin');
      return { success: false, message: 'Acción no permitida para administradores' };
    }

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
    // 🔥 VERIFICACIÓN ADMIN
    const esAdminToken = verificarAdminDesdeToken();
    if (esAdminToken || isAdmin) {
      toast.error('No puedes realizar compras siendo admin');
      return { success: false, message: 'Acción no permitida para administradores' };
    }

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

  // useEffect para cargar carrito y info del usuario al montar - MEJORADO
  useEffect(() => {
    console.log('🚀 CarritoProvider useEffect ejecutado');
    
    const initializeCarrito = async () => {
      const token = getAuthToken();
      console.log('🔑 Token al inicializar:', token ? 'Existe' : 'No existe');
      
      if (token) {
        console.log('✅ Token encontrado, cargando datos del usuario...');
        
        // 🔥 FORZAR carga de información del usuario SIEMPRE
        try {
          const userInfo = await obtenerInfoUsuario();
          console.log('👤 Info del usuario cargada:', userInfo);
          console.log('🔍 Estados después de cargar:', { isAdmin, userRole, usuario });
          
          // 🔥 VERIFICACIÓN ADICIONAL: Asegurar que los estados se actualicen
          setTimeout(() => {
            console.log('🔍 Estados después de timeout:', { isAdmin, userRole, usuario });
          }, 100);
          
        } catch (error) {
          console.error('❌ Error al cargar info del usuario:', error);
        }
        
        // Luego cargar el carrito (solo si no es admin)
        const esAdminVerificacion = verificarAdminDesdeToken();
        if (!esAdminVerificacion) {
          await obtenerCarrito(true);
        } else {
          console.log('🚫 Usuario es admin, saltando carga de carrito');
          setInitialized(true);
          setUserChecked(true);
        }
      } else {
        console.log('❌ No hay token, marcando como inicializado');
        setInitialized(true);
        setUserChecked(true);
      }
    };

    // 🔥 SIEMPRE inicializar, sin importar userChecked
    initializeCarrito();
  }, []); // Cambiar dependencia para que se ejecute solo una vez al montar

  // 🔥 NUEVO useEffect para monitorear cambios en los estados de usuario
  useEffect(() => {
    console.log('🔄 Estados de usuario cambiaron:', { isAdmin, userRole, usuario, userChecked });
  }, [isAdmin, userRole, usuario, userChecked]);

  // useEffect para detectar cambios de autenticación
  useEffect(() => {
    const handleStorageChange = async (e) => {
      if (e.key === 'token') {
        console.log('🔄 Token cambió en localStorage');
        
        // Reset estados
        setInitialized(false);
        setUserChecked(false);
        
        if (e.newValue) {
          console.log('✅ Nuevo token detectado, recargando datos');
          await obtenerInfoUsuario();
          const esAdmin = verificarAdminDesdeToken();
          if (!esAdmin) {
            await obtenerCarrito(true);
          }
        } else {
          console.log('❌ Token removido, limpiando todo');
          setCarrito([]);
          setCarritoCompleto({ id_pedido: null, items: [], total: 0 });
          setUsuario(null);
          setUserRole(null);
          setIsAdmin(false);
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
    userChecked,
    
    // 🔥 NUEVO: Estado del usuario y rol
    usuario,
    userRole,
    isAdmin,
    
    // Funciones principales
    obtenerCarrito,
    fetchCarrito, // Alias
    agregarAlCarrito,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    finalizarCompra,
    verifyToken,
    obtenerInfoUsuario, // 🔥 NUEVA función
    verificarAdminDesdeToken, // 🔥 NUEVA función helper
    
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