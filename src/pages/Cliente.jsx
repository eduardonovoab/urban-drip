// pages/Cliente.jsx - VERSIÓN MEJORADA CON HISTORIAL DETALLADO
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../Styles/Cliente.css';

const Cliente = () => {
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [modificarDatos, setModificarDatos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [loadingComunas, setLoadingComunas] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(null);
  const [detallePedido, setDetallePedido] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  
  const [usuario, setUsuario] = useState({
    id_usuario: '',
    nombre_usuario: '',
    apellido_usuario: '',
    correo: '',
    rut: '',
    direccion: '',
    region_id_region: '',
    comuna_id_comuna: '',
    rol: '',
    estado_usuario: '',
    nombre_region: '',
    nombre_comuna: ''
  });
  
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);

  // Función para obtener el token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Función para hacer requests autenticadas
  const authenticatedRequest = async (url, method = 'GET', data = null) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No estás autenticado. Por favor inicia sesión.');
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

  // Cargar historial de pedidos mejorado
  useEffect(() => {
    const fetchHistorialPedidos = async () => {
      try {
        setLoading(true);
        
        const data = await authenticatedRequest(
          'http://localhost:3000/api/client/pedidos/historial',
          'GET'
        );

        if (data.success) {
          setHistorialPedidos(data.pedidos || []);
        } else {
          toast.error(data.message || 'Error al cargar el historial');
        }

      } catch (err) {
        if (err.response?.status === 500) {
          toast.error('Error del servidor. Intenta más tarde.');
        } else if (err.response?.status === 404) {
          toast.info('No se encontraron pedidos.');
          setHistorialPedidos([]);
        } else if (!err.message.includes('autenticado')) {
          toast.error('No se pudo cargar el historial de pedidos');
        }
        
        setHistorialPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    const token = getAuthToken();
    if (token) {
      fetchHistorialPedidos();
    }
  }, []);

  // Cargar datos del usuario
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        setLoadingUsuario(true);

        const data = await authenticatedRequest(
          'http://localhost:3000/api/client/usuario/datos',
          'GET'
        );

        if (data.success) {
          setUsuario(data.usuario);
        } else {
          toast.error(data.message || 'Error al cargar los datos del usuario');
        }

      } catch (err) {
        if (err.response?.status === 500) {
          toast.error('Error del servidor al cargar los datos del usuario.');
        } else if (!err.message.includes('autenticado')) {
          toast.error('No se pudieron cargar los datos del usuario');
        }
      } finally {
        setLoadingUsuario(false);
      }
    };

    const token = getAuthToken();
    if (token) {
      fetchUsuario();
    }
  }, []);

  // Cargar regiones
  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/location/regiones');
        setRegiones(response.data);
      } catch (err) {
        toast.error('No se pudieron cargar las regiones');
      }
    };
    
    fetchRegiones();
  }, []);

  // Cargar comunas cuando cambia la región
  useEffect(() => {
    if (usuario.region_id_region) {
      const fetchComunas = async () => {
        try {
          setLoadingComunas(true);
          const response = await axios.get(`http://localhost:3000/api/location/comunas/${usuario.region_id_region}`);
          setComunas(response.data);
        } catch (err) {
          toast.error('No se pudieron cargar las comunas');
          setComunas([]);
        } finally {
          setLoadingComunas(false);
        }
      };
      
      fetchComunas();
    } else {
      setComunas([]);
      setUsuario(prev => ({ ...prev, comuna_id_comuna: '' }));
    }
  }, [usuario.region_id_region]);

  // Función para cargar detalle del pedido
  const cargarDetallePedido = async (pedidoId) => {
    try {
      setLoadingDetalle(true);
      
      const data = await authenticatedRequest(
        `http://localhost:3000/api/client/pedidos/${pedidoId}`,
        'GET'
      );

      if (data.success) {
        setDetallePedido(data.pedido);
        setMostrarDetalle(pedidoId);
      } else {
        toast.error(data.message || 'Error al cargar el detalle del pedido');
      }

    } catch (err) {
      toast.error('No se pudo cargar el detalle del pedido');
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Manejar cambio de región
  const handleRegionChange = (e) => {
    const nuevaRegion = e.target.value;
    setUsuario(prev => ({ 
      ...prev, 
      region_id_region: nuevaRegion,
      comuna_id_comuna: ''
    }));
  };

  // Manejar envío del formulario de modificación
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuario.region_id_region) {
      toast.error('Por favor selecciona una región');
      return;
    }
    
    if (!usuario.comuna_id_comuna) {
      toast.error('Por favor selecciona una comuna');
      return;
    }
    
    try {
      setLoadingUsuario(true);

      const datosParaEnviar = {
        nombre_usuario: usuario.nombre_usuario,
        apellido_usuario: usuario.apellido_usuario,
        correo: usuario.correo,
        direccion: usuario.direccion,
        region_id_region: parseInt(usuario.region_id_region),
        comuna_id_comuna: parseInt(usuario.comuna_id_comuna)
      };

      const data = await authenticatedRequest(
        'http://localhost:3000/api/client/usuario/modificar',
        'PUT',
        datosParaEnviar
      );

      if (data.success) {
        toast.success(data.message || 'Datos actualizados correctamente');
        setModificarDatos(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data.message || 'Error al modificar datos');
      }

    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Error al modificar datos');
      }
    } finally {
      setLoadingUsuario(false);
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
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

  // Función para obtener el ícono del estado
  const getEstadoIcon = (estado) => {
    const iconos = {
      'Pendiente': '⏳',
      'Pagado': '💳',
      'Enviado': '🚚',
      'Entregado': '✅',
      'Cancelado': '❌'
    };
    return iconos[estado] || '📦';
  };

  // Componente para mostrar el seguimiento del pedido
  const SeguimientoPedido = ({ seguimiento }) => {
    const estados = ['Pendiente', 'Pagado', 'Enviado', 'Entregado'];
    
    return (
      <div className="seguimiento-container">
        <h4 className="seguimiento-title">Seguimiento del Pedido</h4>
        <div className="seguimiento-timeline">
          {estados.map((estado, index) => {
            const estadoInfo = seguimiento.find(s => s.nombre_estado === estado);
            const isCompleted = !!estadoInfo;
            const isActive = estadoInfo && index === seguimiento.length - 1;
            
            return (
              <div 
                key={estado} 
                className={`timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="timeline-marker">
                  <span className="timeline-icon">{getEstadoIcon(estado)}</span>
                </div>
                <div className="timeline-content">
                  <h5 className="timeline-state">{estado}</h5>
                  {estadoInfo && (
                    <>
                      <p className="timeline-date">
                        {formatearFecha(estadoInfo.fecha_cb_estado)}
                      </p>
                      {estadoInfo.descripcion_cb_estado && (
                        <p className="timeline-description">
                          {estadoInfo.descripcion_cb_estado}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="cliente-container">
      <h1 className="cliente-title">Mi Cuenta</h1>

      {/* Información del Usuario */}
      <div className="cliente-card">
        <h2 className="card-title">Información Personal</h2>
        {loadingUsuario ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">Cargando datos...</span>
          </div>
        ) : (
          <div className="user-info-grid">
            <div className="info-item">
              <div className="info-label">Nombre Completo</div>
              <div className="info-value">{usuario.nombre_usuario} {usuario.apellido_usuario}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Correo Electrónico</div>
              <div className="info-value">{usuario.correo}</div>
            </div>
            <div className="info-item">
              <div className="info-label">RUT</div>
              <div className="info-value">{usuario.rut}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Región</div>
              <div className="info-value">{usuario.nombre_region || 'No especificada'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Comuna</div>
              <div className="info-value">{usuario.nombre_comuna || 'No especificada'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Dirección</div>
              <div className="info-value">{usuario.direccion || 'No especificada'}</div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setModificarDatos(!modificarDatos)}
          disabled={loadingUsuario}
          className={`btn-primary ${loadingUsuario ? 'btn-disabled' : ''}`}
        >
          {modificarDatos ? 'Cancelar' : 'Modificar mis datos'}
        </button>
      </div>

      {/* Formulario de Modificación */}
      {modificarDatos && (
        <div className="cliente-card">
          <h3 className="card-title">Modificar Datos Personales</h3>
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    value={usuario.nombre_usuario}
                    onChange={(e) => setUsuario({ ...usuario, nombre_usuario: e.target.value })}
                    placeholder="Ingresa tu nombre"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Apellido *</label>
                  <input
                    type="text"
                    value={usuario.apellido_usuario}
                    onChange={(e) => setUsuario({ ...usuario, apellido_usuario: e.target.value })}
                    placeholder="Ingresa tu apellido"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico *</label>
                <input
                  type="email"
                  value={usuario.correo}
                  onChange={(e) => setUsuario({ ...usuario, correo: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección *</label>
                <input
                  type="text"
                  value={usuario.direccion}
                  onChange={(e) => setUsuario({ ...usuario, direccion: e.target.value })}
                  placeholder="Dirección completa"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Región *</label>
                  <select
                    value={usuario.region_id_region}
                    onChange={handleRegionChange}
                    className="form-input"
                    required
                  >
                    <option value="">Selecciona una región</option>
                    {regiones.map((region) => (
                      <option key={region.id_region} value={region.id_region}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Comuna *</label>
                  <select
                    value={usuario.comuna_id_comuna}
                    onChange={(e) => setUsuario({ ...usuario, comuna_id_comuna: e.target.value })}
                    className="form-input"
                    required
                    disabled={!usuario.region_id_region || loadingComunas}
                  >
                    <option value="">
                      {!usuario.region_id_region 
                        ? 'Primero selecciona una región' 
                        : loadingComunas 
                        ? 'Cargando comunas...' 
                        : 'Selecciona una comuna'
                      }
                    </option>
                    {comunas.map((comuna) => (
                      <option key={comuna.id_comuna} value={comuna.id_comuna}>
                        {comuna.nombre_comuna}
                      </option>
                    ))}
                  </select>
                  {loadingComunas && (
                    <div className="loading-indicator">
                      <div className="loading-spinner-small"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loadingUsuario || loadingComunas}
                  className={`btn-success ${(loadingUsuario || loadingComunas) ? 'btn-disabled' : ''}`}
                >
                  {loadingUsuario ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setModificarDatos(false)}
                  disabled={loadingUsuario}
                  className={`btn-cancel ${loadingUsuario ? 'btn-disabled' : ''}`}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial de Pedidos Mejorado */}
      <div className="cliente-card">
        <h2 className="card-title">Historial de Pedidos</h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">Cargando historial...</span>
          </div>
        ) : historialPedidos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3 className="empty-title">No tienes pedidos realizados</h3>
            <p className="empty-subtitle">¡Explora nuestros productos y realiza tu primera compra!</p>
          </div>
        ) : (
          <div className="pedidos-container">
            {historialPedidos.map((pedido) => (
              <div key={pedido.id_pedido} className="pedido-item-mejorado">
                <div className="pedido-header-mejorado">
                  <div className="pedido-info-principal">
                    {pedido.imagen_principal && (
                      <img 
                        src={pedido.imagen_principal} 
                        alt="Producto" 
                        className="pedido-imagen"
                      />
                    )}
                    <div className="pedido-detalles">
                      <h3 className="pedido-title">Pedido #{pedido.id_pedido}</h3>
                      <p className="pedido-productos-resumen">
                        {pedido.productos_resumen || `${pedido.cantidad_productos} producto(s)`}
                      </p>
                      <p className="pedido-fecha">{formatearFecha(pedido.fecha_pedido)}</p>
                    </div>
                  </div>
                  <div className="pedido-estado-precio">
                    <span className={getEstadoClass(pedido.nombre_estado)}>
                      {getEstadoIcon(pedido.nombre_estado)} {pedido.nombre_estado}
                    </span>
                    <div className="pedido-total">{formatearPrecio(pedido.total)}</div>
                  </div>
                </div>
                
                <div className="pedido-actions">
                  <button 
                    className="btn-detail"
                    onClick={() => cargarDetallePedido(pedido.id_pedido)}
                    disabled={loadingDetalle}
                  >
                    {loadingDetalle && mostrarDetalle === pedido.id_pedido ? 'Cargando...' : 'Ver Detalle'}
                  </button>
                </div>

                {/* Modal de detalle del pedido */}
                {mostrarDetalle === pedido.id_pedido && detallePedido && (
                  <div className="pedido-detalle-expandido">
                    <div className="detalle-header">
                      <h4>Detalle del Pedido #{pedido.id_pedido}</h4>
                      <button 
                        className="btn-cerrar"
                        onClick={() => {
                          setMostrarDetalle(null);
                          setDetallePedido(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Información de entrega */}
                    <div className="detalle-entrega">
                      <h5>Información de Entrega</h5>
                      <p><strong>Destinatario:</strong> {detallePedido.nombre_usuario} {detallePedido.apellido_usuario}</p>
                      <p><strong>Dirección:</strong> {detallePedido.direccion}</p>
                      <p><strong>Comuna:</strong> {detallePedido.nombre_comuna}</p>
                      <p><strong>Región:</strong> {detallePedido.nombre_region}</p>
                    </div>

                    {/* Productos del pedido */}
                    <div className="detalle-productos">
                      <h5>Productos</h5>
                      {detallePedido.productos.map((producto, index) => (
                        <div key={index} className="producto-detalle-item">
                          <img 
                            src={producto.imagen_url} 
                            alt={producto.nombre_producto}
                            className="producto-detalle-imagen"
                          />
                          <div className="producto-detalle-info">
                            <h6>{producto.nombre_producto}</h6>
                            <p>{producto.nombre_marca} - {producto.nombre_talla}</p>
                            <p>Cantidad: {producto.cantidad}</p>
                            <p>Precio unitario: {formatearPrecio(producto.precio)}</p>
                            <p><strong>Subtotal: {formatearPrecio(producto.subtotal)}</strong></p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Seguimiento del pedido */}
                    <SeguimientoPedido seguimiento={detallePedido.seguimiento} />

                    {/* Información de pago */}
                    {detallePedido.venta && (
                      <div className="detalle-pago">
                        <h5>Información de Pago</h5>
                        <p><strong>Método de pago:</strong> {detallePedido.venta.metodo_pago}</p>
                        <p><strong>Fecha de pago:</strong> {formatearFecha(detallePedido.venta.fecha_venta)}</p>
                        <p><strong>Total pagado:</strong> {formatearPrecio(detallePedido.total)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cliente;