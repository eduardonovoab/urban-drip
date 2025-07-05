// pages/Cliente.jsx - VERSIÓN CON FILTRO DE ESTADOS DINÁMICO Y CÓDIGOS DE RESERVA
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import '../Styles/Cliente.css';

const Cliente = () => {
  const [historialPedidos, setHistorialPedidos] = useState([]);
  const [historialPedidosFiltrado, setHistorialPedidosFiltrado] = useState([]);
  const [estadosFiltro, setEstadosFiltro] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('todos');
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [modificarDatos, setModificarDatos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [loadingComunas, setLoadingComunas] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(null);
  const [detallePedido, setDetallePedido] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [generandoBoleta, setGenerandoBoleta] = useState(null);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [tipoConfirmacion, setTipoConfirmacion] = useState('');
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

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

  const [usuarioOriginal, setUsuarioOriginal] = useState(null);
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

  // Cargar estados disponibles desde la base de datos
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        setLoadingEstados(true);

        // Llamada a tu API para obtener los estados disponibles
        const data = await authenticatedRequest(
          'http://localhost:3000/api/client/estados/pedido',
          'GET'
        );

        if (data.success) {
          setEstadosFiltro(data.estados || []);
        } else {
          toast.error('Error al cargar los estados de pedido');
        }

      } catch (err) {
        console.error('Error al cargar estados:', err);
        toast.error('No se pudieron cargar los estados de pedido');
      } finally {
        setLoadingEstados(false);
      }
    };

    const token = getAuthToken();
    if (token) {
      fetchEstados();
    }
  }, []);

  // Filtrar pedidos cuando cambia el estado seleccionado
  useEffect(() => {
    if (estadoSeleccionado === 'todos') {
      setHistorialPedidosFiltrado(historialPedidos);
    } else {
      const pedidosFiltrados = historialPedidos.filter(
        pedido => pedido.nombre_estado === estadoSeleccionado
      );
      setHistorialPedidosFiltrado(pedidosFiltrados);
    }
  }, [estadoSeleccionado, historialPedidos]);

  // Función para generar y descargar la boleta
  const generarBoleta = async (pedidoId) => {
    try {
      setGenerandoBoleta(pedidoId);

      // Cargar los detalles del pedido si no están disponibles
      let datosPedido = detallePedido;
      if (mostrarDetalle !== pedidoId || !detallePedido) {
        const data = await authenticatedRequest(
          `http://localhost:3000/api/client/pedidos/${pedidoId}`,
          'GET'
        );

        if (!data.success) {
          toast.error('Error al cargar los datos del pedido');
          return;
        }
        datosPedido = data.pedido;
      }

      // Crear el PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let currentY = 20;

      // Configurar fuentes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);

      // Encabezado
      doc.setTextColor(44, 62, 80);
      doc.text('URBANDRIP', pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      doc.setFontSize(16);
      doc.text('BOLETA ELECTRÓNICA', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Información de la empresa
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('UrbanDrip SpA', pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
      doc.text('RUT: 76.XXX.XXX-X', pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
      doc.text('Dirección: Concepción,Chile', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 10;

      // Información del pedido
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text('INFORMACIÓN DEL PEDIDO', 20, currentY);
      currentY += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Datos del pedido en dos columnas
      const leftColumn = 20;
      const rightColumn = pageWidth / 2 + 10;

      doc.text(`Número de Pedido: #${datosPedido.id_pedido}`, leftColumn, currentY);
      doc.text(`Fecha: ${formatearFecha(datosPedido.fecha_pedido)}`, rightColumn, currentY);
      currentY += 7;

      doc.text(`Estado: ${datosPedido.seguimiento[datosPedido.seguimiento.length - 1]?.nombre_estado || 'N/A'}`, leftColumn, currentY);
      const metodoPago = datosPedido.venta?.metodo_pago || 'No especificado';
      doc.text(`Método de Pago: ${metodoPago}`, rightColumn, currentY);
      currentY += 15;

      // Información del cliente
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DATOS DEL CLIENTE', 20, currentY);
      currentY += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Cliente: ${datosPedido.nombre_usuario} ${datosPedido.apellido_usuario}`, leftColumn, currentY);
      doc.text(`RUT: ${usuario.rut}`, rightColumn, currentY);
      currentY += 7;

      doc.text(`Dirección: ${datosPedido.direccion}`, leftColumn, currentY);
      currentY += 7;
      doc.text(`Comuna: ${datosPedido.nombre_comuna}, ${datosPedido.nombre_region}`, leftColumn, currentY);
      currentY += 15;

      // Línea separadora
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 10;

      // Detalles de productos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DETALLE DE PRODUCTOS', 20, currentY);
      currentY += 10;

      // Encabezado de tabla
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PRODUCTO', 20, currentY);
      doc.text('MARCA/TALLA', 85, currentY);
      doc.text('CANT.', 130, currentY);
      doc.text('PRECIO UNIT.', 150, currentY);
      doc.text('TOTAL', 180, currentY);
      currentY += 5;

      // Línea bajo encabezado
      doc.setLineWidth(0.3);
      doc.line(20, currentY, pageWidth - 20, currentY);
      currentY += 8;

      // Productos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      datosPedido.productos.forEach((producto) => {
        // Verificar si necesitamos una nueva página
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        const nombreProducto = doc.splitTextToSize(producto.nombre_producto, 60);
        const marcaTalla = `${producto.nombre_marca} - ${producto.nombre_talla}`;
        const cantidad = producto.cantidad.toString();
        const precioUnit = formatearPrecio(producto.precio);
        const total = formatearPrecio(producto.subtotal);

        doc.text(nombreProducto, 20, currentY);
        doc.text(marcaTalla, 85, currentY);
        doc.text(cantidad, 135, currentY, { align: 'center' });
        doc.text(precioUnit, 165, currentY, { align: 'right' });
        doc.text(total, 195, currentY, { align: 'right' });

        currentY += Math.max(7, nombreProducto.length * 4);
      });

      currentY += 5;

      // Línea antes de totales
      doc.setLineWidth(0.5);
      doc.line(130, currentY, pageWidth - 20, currentY);
      currentY += 10;

      // Cálculos correctos para Chile (precios incluyen IVA)
      const totalConIva = parseFloat(datosPedido.total);
      const subtotalSinIva = totalConIva / 1.19; // Precio sin IVA
      const ivaCalculado = totalConIva - subtotalSinIva; // IVA = Total - Subtotal

      // Totales
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);

      doc.text('SUBTOTAL:', 150, currentY);
      doc.text(formatearPrecio(subtotalSinIva), 195, currentY, { align: 'right' });
      currentY += 8;

      doc.text('IVA (19%):', 150, currentY);
      doc.text(formatearPrecio(ivaCalculado), 195, currentY, { align: 'right' });
      currentY += 8;

      // Línea antes del total
      doc.setLineWidth(0.8);
      doc.line(130, currentY, pageWidth - 20, currentY);
      currentY += 8;

      doc.setFontSize(14);
      doc.setTextColor(220, 53, 69);
      doc.text('TOTAL:', 150, currentY);
      doc.text(formatearPrecio(datosPedido.total), 195, currentY, { align: 'right' });
      currentY += 15;

      // Información adicional
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      doc.text('INFORMACIÓN ADICIONAL:', 20, currentY);
      currentY += 8;
      doc.text('• Esta boleta fue generada electrónicamente.', 20, currentY);
      currentY += 5;
      doc.text('• Para consultas, contáctanos a soporte@urbandrip.cl', 20, currentY);
      currentY += 5;
      doc.text('• Conserve este documento como comprobante de compra.', 20, currentY);
      currentY += 10;

      // Pie de página
      const fechaGeneracion = new Date().toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.text(`Documento generado el ${fechaGeneracion}`, pageWidth / 2, currentY, { align: 'center' });

      // Descargar el PDF
      const nombreArchivo = `Boleta_UrbanDrip_${datosPedido.id_pedido}_${new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);

      toast.success('Boleta descargada exitosamente');

    } catch (error) {
      console.error('Error al generar la boleta:', error);
      toast.error('Error al generar la boleta. Intenta nuevamente.');
    } finally {
      setGenerandoBoleta(null);
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
          setHistorialPedidosFiltrado(data.pedidos || []);
        } else {
          toast.error(data.message || 'Error al cargar el historial');
        }

      } catch (err) {
        if (err.response?.status === 500) {
          toast.error('Error del servidor. Intenta más tarde.');
        } else if (err.response?.status === 404) {
          toast.info('No se encontraron pedidos.');
          setHistorialPedidos([]);
          setHistorialPedidosFiltrado([]);
        } else if (!err.message.includes('autenticado')) {
          toast.error('No se pudo cargar el historial de pedidos');
        }

        setHistorialPedidos([]);
        setHistorialPedidosFiltrado([]);
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
          setUsuarioOriginal(data.usuario); // Guardar copia original
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

  // Función para verificar si hubo cambios
  const huboCambios = () => {
    if (!usuarioOriginal) return false;
    
    return (
      usuario.nombre_usuario !== usuarioOriginal.nombre_usuario ||
      usuario.apellido_usuario !== usuarioOriginal.apellido_usuario ||
      usuario.correo !== usuarioOriginal.correo ||
      usuario.direccion !== usuarioOriginal.direccion ||
      usuario.region_id_region !== usuarioOriginal.region_id_region ||
      usuario.comuna_id_comuna !== usuarioOriginal.comuna_id_comuna
    );
  };

  // Manejar clic en cancelar
  const handleCancelar = () => {
    if (huboCambios()) {
      setTipoConfirmacion('cancelar');
      setMostrarModalConfirmacion(true);
    } else {
      setModificarDatos(false);
    }
  };

  // Manejar confirmación de cancelar
  const confirmarCancelar = () => {
    setUsuario(usuarioOriginal); // Restaurar datos originales
    setModificarDatos(false);
    setMostrarModalConfirmacion(false);
    toast.info('Los cambios han sido descartados');
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

    // Mostrar modal de confirmación
    setTipoConfirmacion('guardar');
    setMostrarModalConfirmacion(true);
  };

  // Confirmar guardado de cambios
  const confirmarGuardado = async () => {
    try {
      setLoadingUsuario(true);
      setMostrarModalConfirmacion(false);

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
        setMostrarModalExito(true);
        setModificarDatos(false);
        setUsuarioOriginal(usuario); // Actualizar los datos originales
        
        // Cerrar el modal de éxito después de 3 segundos
        setTimeout(() => {
          setMostrarModalExito(false);
          // Recargar la página después de cerrar el modal
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }, 3000);
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

  // Función para copiar código de reserva
  const copiarCodigoReserva = (codigo) => {
    navigator.clipboard.writeText(codigo)
      .then(() => {
        toast.success('Código de reserva copiado al portapapeles');
      })
      .catch(() => {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = codigo;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Código de reserva copiado');
      });
  };

  // Función para obtener clase CSS del estado
  const getEstadoClass = (estado) => {
    const clases = {
      'Pendiente': 'estado-badge estado-pendiente',
      'Pagado': 'estado-badge estado-pagado',
      'Enviado': 'estado-badge estado-enviado',
      'Entregado': 'estado-badge estado-entregado',
      'Cancelado': 'estado-badge estado-cancelado',
      'Preparado': 'estado-badge estado-preparado',
      'Reservado': 'estado-badge estado-reservado'
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
      'Cancelado': '❌',
      'Preparado': '📦',
      'Reservado': '🔒'
    };
    return iconos[estado] || '📦';
  };

  // Componente para mostrar el seguimiento del pedido
  const SeguimientoPedido = ({ seguimiento }) => {
    const estados = ['Pendiente', 'Pagado', 'Preparado', 'Enviado', 'Entregado'];

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

  // Componente Modal de Confirmación
  const ModalConfirmacion = () => {
    if (!mostrarModalConfirmacion) return null;

    const esGuardar = tipoConfirmacion === 'guardar';
    const titulo = esGuardar ? '¿Guardar cambios?' : '¿Cancelar modificación?';
    const mensaje = esGuardar 
      ? '¿Estás seguro de que deseas guardar los cambios realizados?'
      : '¿Estás seguro de que deseas cancelar? Se perderán todos los cambios no guardados.';
    const textoConfirmar = esGuardar ? 'Sí, guardar' : 'Sí, cancelar';
    const textoRechazar = esGuardar ? 'No, continuar editando' : 'No, seguir editando';
    const handleConfirmar = esGuardar ? confirmarGuardado : confirmarCancelar;

    return (
      <>
        <div className="modal-backdrop" onClick={() => setMostrarModalConfirmacion(false)}></div>
        <div className="modal-confirmacion">
          <div className="modal-header">
            <h3>{titulo}</h3>
          </div>
          <div className="modal-body">
            <p>{mensaje}</p>
          </div>
          <div className="modal-footer">
            <button 
              className="btn-modal-confirmar"
              onClick={handleConfirmar}
            >
              {textoConfirmar}
            </button>
            <button 
              className="btn-modal-cancelar"
              onClick={() => setMostrarModalConfirmacion(false)}
            >
              {textoRechazar}
            </button>
          </div>
        </div>
      </>
    );
  };

  // Componente Modal de Éxito
  const ModalExito = () => {
    if (!mostrarModalExito) return null;

    return (
      <>
        <div className="modal-backdrop-exito"></div>
        <div className="modal-exito">
          <div className="modal-exito-content">
            <div className="modal-exito-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 12.5L10.5 16L17 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="modal-exito-titulo">¡Cambios guardados con éxito!</h3>
            <p className="modal-exito-mensaje">
              Tus datos personales han sido actualizados correctamente.
            </p>
            <div className="modal-exito-loading">
              <div className="loading-bar"></div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="cliente-container">
      <h1 className="cliente-title">Mi Cuenta</h1>

      {/* Modal de Confirmación */}
      <ModalConfirmacion />
      
      {/* Modal de Éxito */}
      <ModalExito />

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
                  <label className="form-label">Nombre</label>
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
                  <label className="form-label">Apellido</label>
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
                <label className="form-label">Correo Electrónico</label>
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
                <label className="form-label">Dirección</label>
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
                  <label className="form-label">Región</label>
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
                  <label className="form-label">Comuna</label>
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
                  onClick={handleCancelar}
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

      {/* Historial de Pedidos Mejorado con Filtro */}
      <div className="cliente-card">
        <div className="pedidos-header">
          <h2 className="card-title">Historial de Pedidos</h2>

          {/* Filtro de Estados */}
          {!loading && historialPedidos.length > 0 && (
            <div className="filtro-estados">
              <label className="filtro-label">Filtrar por estado:</label>
              <select
                value={estadoSeleccionado}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                className="filtro-select"
                disabled={loadingEstados}
              >
                <option value="todos">Todos los estados</option>
                {loadingEstados ? (
                  <option>Cargando estados...</option>
                ) : (
                  estadosFiltro.map((estado) => (
                    <option key={estado.id_estado} value={estado.nombre_estado}>
                      {getEstadoIcon(estado.nombre_estado)} {estado.nombre_estado}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">Cargando historial...</span>
          </div>
        ) : historialPedidosFiltrado.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3 className="empty-title">
              {estadoSeleccionado !== 'todos'
                ? `No tienes pedidos con estado "${estadoSeleccionado}"`
                : 'No tienes pedidos realizados'
              }
            </h3>
            <p className="empty-subtitle">
              {estadoSeleccionado !== 'todos'
                ? 'Prueba seleccionando otro estado en el filtro'
                : '¡Explora nuestros productos y realiza tu primera compra!'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            {estadoSeleccionado !== 'todos' && (
              <div className="filtro-resultados">
                Mostrando {historialPedidosFiltrado.length} de {historialPedidos.length} pedidos
              </div>
            )}

            <div className="pedidos-container">
              {historialPedidosFiltrado.map((pedido) => (
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
                    
                    {/* Mostrar código de reserva si el pedido está reservado */}
                    {pedido.nombre_estado === 'Reservado' && pedido.codigo_reserva && (
                      <div className="reserva-info-box">
                        <div className="codigo-reserva-container">
                          <span className="codigo-label">Código de Reserva:</span>
                          <span className="codigo-value">{pedido.codigo_reserva}</span>
                          <button 
                            className="btn-copiar-codigo"
                            onClick={() => copiarCodigoReserva(pedido.codigo_reserva)}
                            title="Copiar código"
                          >
                            📋
                          </button>
                        </div>
                        {pedido.fecha_expiracion && (
                          <div className="expiracion-info">
                            <span className="expiracion-icon">⏰</span>
                            <span className="expiracion-text">
                              Válido hasta: {formatearFecha(pedido.fecha_expiracion)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pedido-actions">
                    <button
                      className="btn-detail"
                      onClick={() => cargarDetallePedido(pedido.id_pedido)}
                      disabled={loadingDetalle}
                    >
                      {loadingDetalle && mostrarDetalle === pedido.id_pedido ? 'Cargando...' : 'Ver Detalle'}
                    </button>

                    <button
                      className="btn-boleta"
                      onClick={() => generarBoleta(pedido.id_pedido)}
                      disabled={generandoBoleta === pedido.id_pedido}
                    >
                      {generandoBoleta === pedido.id_pedido ? (
                        <>
                          <span className="loading-spinner-btn"></span>
                          Generando...
                        </>
                      ) : (
                        <>
                          📄 Descargar Boleta
                        </>
                      )}
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

                      {/* Información de reserva */}
                      {detallePedido.seguimiento && 
                       detallePedido.seguimiento[detallePedido.seguimiento.length - 1]?.nombre_estado === 'Reservado' && 
                       detallePedido.codigo_reserva && (
                        <div className="detalle-reserva">
                          <h5>Información de Reserva</h5>
                          <div className="reserva-codigo-detalle">
                            <p><strong>Código de Reserva:</strong> 
                              <span className="codigo-destacado">{detallePedido.codigo_reserva}</span>
                              <button 
                                className="btn-copiar-inline"
                                onClick={() => copiarCodigoReserva(detallePedido.codigo_reserva)}
                              >
                                Copiar
                              </button>
                            </p>
                            <p className="reserva-instrucciones">
                              Presenta este código en tienda para retirar y pagar tu pedido
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cliente;