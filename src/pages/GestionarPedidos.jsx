// pages/GestionarPedidos.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../Styles/GestionarPedidos.css';

const GestionarPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);

  // Función para obtener el token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Función para hacer requests autenticadas
  const authenticatedRequest = async (url, method = 'GET', data = null) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No estás autenticado');
    }

    const config = {
      method: method,
      url: url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      throw error;
    }
  };

  // Cargar todos los pedidos
  const cargarPedidos = async () => {
    try {
      setLoading(true);
      
      const data = await authenticatedRequest(
        'http://localhost:3000/api/admin/pedidos',
        'GET'
      );

      if (data.success) {
        setPedidos(data.pedidos || []);
      } else {
        toast.error(data.message || 'Error al cargar los pedidos');
      }

    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      toast.error('No se pudieron cargar los pedidos');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar detalle de un pedido específico
  const cargarDetallePedido = async (pedidoId) => {
    try {
      setLoadingDetalle(true);
      
      const data = await authenticatedRequest(
        `http://localhost:3000/api/admin/pedidos/${pedidoId}`,
        'GET'
      );

      if (data.success) {
        setPedidoDetalle(data.pedido);
        setMostrarDetalle(true);
      } else {
        toast.error(data.message || 'Error al cargar el detalle del pedido');
      }

    } catch (err) {
      console.error('Error al cargar detalle:', err);
      toast.error('No se pudo cargar el detalle del pedido');
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Cambiar estado de un pedido
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado, descripcion = '') => {
    try {
      setCambiandoEstado(pedidoId);
      
      const data = await authenticatedRequest(
        `http://localhost:3000/api/admin/pedidos/${pedidoId}/estado`,
        'PUT',
        {
          nuevo_estado: nuevoEstado,
          descripcion: descripcion || `Cambio de estado a ${nuevoEstado}`
        }
      );

      if (data.success) {
        toast.success(data.message);
        // Recargar la lista de pedidos
        await cargarPedidos();
        // Si está viendo el detalle, actualizarlo también
        if (mostrarDetalle && pedidoDetalle?.id_pedido === pedidoId) {
          await cargarDetallePedido(pedidoId);
        }
      } else {
        toast.error(data.message || 'Error al cambiar el estado');
      }

    } catch (err) {
      console.error('Error al cambiar estado:', err);
      toast.error(err.response?.data?.message || 'No se pudo cambiar el estado del pedido');
    } finally {
      setCambiandoEstado(null);
    }
  };

  // Filtrar pedidos por estado
  const pedidosFiltrados = pedidos.filter(pedido => {
    if (filtroEstado === 'todos') return true;
    return pedido.nombre_estado.toLowerCase() === filtroEstado.toLowerCase();
  });

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
  }, []);

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear precio
  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precio);
  };

  // Función para obtener clase CSS del estado
  const getEstadoClass = (estado) => {
    const clases = {
      'Pendiente': 'estado-badge estado-pendiente',
      'Pagado': 'estado-badge estado-pagado',
      'Enviado': 'estado-badge estado-enviado',
      'Entregado': 'estado-badge estado-entregado',
      'Cancelado': 'estado-badge estado-cancelado'
    };
    return clases[estado] || 'estado-badge';
  };

  // Función para obtener acciones permitidas según el estado
  const getAccionesPermitidas = (estadoActual) => {
    const acciones = {
      'Pendiente': ['Enviado'],
      'Pagado': ['Enviado'],
      'Enviado': ['Entregado'],
      'Entregado': [],
      'Cancelado': []
    };
    return acciones[estadoActual] || [];
  };

  return (
    <div className="gestionar-pedidos-container">
      <div className="gestionar-pedidos-header">
        <h1 className="page-title">Gestión de Pedidos</h1>
        <div className="filtros-container">
          <label htmlFor="filtro-estado">Filtrar por estado:</label>
          <select 
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">Cargando pedidos...</span>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3 className="empty-title">No se encontraron pedidos</h3>
          <p className="empty-subtitle">
            {filtroEstado === 'todos' 
              ? 'No hay pedidos registrados en el sistema'
              : `No hay pedidos con estado "${filtroEstado}"`
            }
          </p>
        </div>
      ) : (
        <div className="pedidos-lista">
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id_pedido} className="pedido-card">
              <div className="pedido-header">
                <div className="pedido-info-izquierda">
                  {pedido.imagen_principal && (
                    <img 
                      src={pedido.imagen_principal} 
                      alt="Producto" 
                      className="pedido-imagen"
                    />
                  )}
                  <div className="pedido-datos">
                    <h3 className="pedido-id">Pedido #{pedido.id_pedido}</h3>
                    <p className="usuario-info">
                      <strong>Cliente:</strong> {pedido.nombre_usuario} {pedido.apellido_usuario} (ID: {pedido.id_usuario})
                    </p>
                    <p className="pedido-fecha">
                      <strong>Fecha:</strong> {formatearFecha(pedido.fecha_pedido)}
                    </p>
                    <p className="productos-resumen">
                      <strong>Productos:</strong> {pedido.productos_resumen}
                    </p>
                  </div>
                </div>
                
                <div className="pedido-info-derecha">
                  <div className="estado-y-total">
                    <span className={getEstadoClass(pedido.nombre_estado)}>
                      {pedido.nombre_estado}
                    </span>
                    <div className="pedido-total">
                      {formatearPrecio(pedido.total)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pedido-acciones">
                <button 
                  className="btn-detalle"
                  onClick={() => cargarDetallePedido(pedido.id_pedido)}
                  disabled={loadingDetalle}
                >
                  {loadingDetalle ? 'Cargando...' : 'Ver Detalle'}
                </button>

                {/* Botones para cambiar estado */}
                {getAccionesPermitidas(pedido.nombre_estado).map((accion) => (
                  <button
                    key={accion}
                    className={`btn-cambiar-estado btn-${accion.toLowerCase()}`}
                    onClick={() => cambiarEstadoPedido(pedido.id_pedido, accion)}
                    disabled={cambiandoEstado === pedido.id_pedido}
                  >
                    {cambiandoEstado === pedido.id_pedido ? 'Cambiando...' : `Marcar como ${accion}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle del pedido */}
      {mostrarDetalle && pedidoDetalle && (
        <div className="modal-overlay">
          <div className="modal-detalle-pedido">
            <div className="modal-header">
              <h2>Detalle del Pedido #{pedidoDetalle.id_pedido}</h2>
              <button 
                className="btn-cerrar-modal"
                onClick={() => {
                  setMostrarDetalle(false);
                  setPedidoDetalle(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {/* Información del cliente */}
              <div className="seccion-detalle">
                <h3>Información del Cliente</h3>
                <div className="info-grid">
                  <p><strong>Nombre:</strong> {pedidoDetalle.nombre_usuario} {pedidoDetalle.apellido_usuario}</p>
                  <p><strong>Email:</strong> {pedidoDetalle.correo}</p>
                  <p><strong>RUT:</strong> {pedidoDetalle.rut}</p>
                  <p><strong>Dirección:</strong> {pedidoDetalle.direccion}</p>
                  <p><strong>Comuna:</strong> {pedidoDetalle.nombre_comuna}</p>
                  <p><strong>Región:</strong> {pedidoDetalle.nombre_region}</p>
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="seccion-detalle">
                <h3>Productos del Pedido</h3>
                <div className="productos-lista">
                  {pedidoDetalle.productos.map((producto, index) => (
                    <div key={index} className="producto-item">
                      <img 
                        src={producto.imagen_url} 
                        alt={producto.nombre_producto}
                        className="producto-imagen-pequena"
                      />
                      <div className="producto-info">
                        <h4>{producto.nombre_producto}</h4>
                        <p>{producto.nombre_marca} - {producto.nombre_talla}</p>
                        <p>Cantidad: {producto.cantidad} | Precio: {formatearPrecio(producto.precio)}</p>
                        <p><strong>Subtotal: {formatearPrecio(producto.subtotal)}</strong></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seguimiento del pedido */}
              <div className="seccion-detalle">
                <h3>Seguimiento del Pedido</h3>
                <div className="seguimiento-lista">
                  {pedidoDetalle.seguimiento.map((estado, index) => (
                    <div key={index} className="seguimiento-item">
                      <div className="seguimiento-fecha">
                        {formatearFecha(estado.fecha_cb_estado)}
                      </div>
                      <div className="seguimiento-estado">
                        <span className={getEstadoClass(estado.nombre_estado)}>
                          {estado.nombre_estado}
                        </span>
                        {estado.descripcion_cb_estado && (
                          <p className="seguimiento-descripcion">
                            {estado.descripcion_cb_estado}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de pago */}
              {pedidoDetalle.venta && (
                <div className="seccion-detalle">
                  <h3>Información de Pago</h3>
                  <div className="info-grid">
                    <p><strong>Método de pago:</strong> {pedidoDetalle.venta.metodo_pago}</p>
                    <p><strong>Fecha de pago:</strong> {formatearFecha(pedidoDetalle.venta.fecha_venta)}</p>
                    <p><strong>Total:</strong> {formatearPrecio(pedidoDetalle.total)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarPedidos;