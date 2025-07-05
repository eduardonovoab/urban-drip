import React, { useState, useEffect } from 'react';

const GestionarPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [confirmandoPago, setConfirmandoPago] = useState(null);

  // Función para obtener el token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Función mejorada para generar código de reserva temporal
  const generarCodigoReservaTemporal = (pedidoId) => {
    const timestamp = Date.now().toString(36).toUpperCase().substring(0, 6);
    return `RES-${pedidoId}-${timestamp}`;
  };

  // Función para hacer requests autenticadas
  const authenticatedRequest = async (url, method = 'GET', data = null) => {
    const token = getAuthToken();
    
    if (!token) {
      showToast('No estás autenticado. Redirigiendo al login...', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      throw new Error('No autenticado');
    }

    const config = {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        showToast('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        throw new Error('Sesión expirada');
      }

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }
      
      return responseData;
    } catch (error) {
      if (error.name === 'SyntaxError') {
        throw new Error('Error al procesar la respuesta del servidor');
      }
      throw error;
    }
  };

  // Función para mostrar notificaciones
  const showToast = (message, type = 'info') => {
    // Crear elemento de notificación
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
      color: white;
      border-radius: 5px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Función mejorada para copiar código de reserva
  const copiarCodigoReserva = async (codigo, pedidoId) => {
    // Si no hay código, generar uno temporal
    const codigoFinal = codigo || generarCodigoReservaTemporal(pedidoId);
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codigoFinal);
        showToast('Código de reserva copiado al portapapeles', 'success');
      } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = codigoFinal;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Código de reserva copiado', 'success');
      }
    } catch (error) {
      console.error('Error al copiar:', error);
      showToast('Error al copiar el código', 'error');
    }
  };

  // Cargar todos los pedidos con validaciones mejoradas
  const cargarPedidos = async () => {
    try {
      setLoading(true);
      
      const data = await authenticatedRequest(
        'http://localhost:3000/api/admin/pedidos',
        'GET'
      );

      if (data && data.success) {
        // Asegurar que cada pedido tenga los campos esperados
        const pedidosNormalizados = (data.pedidos || []).map(pedido => ({
          ...pedido,
          codigo_reserva: pedido.codigo_reserva || pedido.código_reserva || null,
          nombre_estado: pedido.nombre_estado || 'Desconocido',
          total: pedido.total || 0,
          productos_resumen: pedido.productos_resumen || 'Sin productos',
          metodo_pago_nombre: pedido.metodo_pago_nombre || pedido.metodo_pago || null,
          nombre_usuario: pedido.nombre_usuario || 'Sin nombre',
          apellido_usuario: pedido.apellido_usuario || '',
          id_usuario: pedido.id_usuario || 'N/A',
          fecha_pedido: pedido.fecha_pedido || null,
          correo: pedido.correo || 'Sin correo',
          imagen_principal: pedido.imagen_principal || null
        }));
        
        setPedidos(pedidosNormalizados);
      } else {
        showToast(data?.message || 'Error al cargar los pedidos', 'error');
        setPedidos([]);
      }

    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      showToast('No se pudieron cargar los pedidos', 'error');
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

      if (data && data.success && data.pedido) {
        // Normalizar datos del pedido
        const pedidoNormalizado = {
          ...data.pedido,
          codigo_reserva: data.pedido.codigo_reserva || data.pedido.código_reserva || null,
          productos: data.pedido.productos || [],
          seguimiento: data.pedido.seguimiento || [],
          venta: data.pedido.venta || null
        };
        
        setPedidoDetalle(pedidoNormalizado);
        setMostrarDetalle(true);
      } else {
        showToast(data?.message || 'Error al cargar el detalle del pedido', 'error');
      }

    } catch (err) {
      console.error('Error al cargar detalle:', err);
      showToast('No se pudo cargar el detalle del pedido', 'error');
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Cambiar estado de un pedido
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado, descripcion = '') => {
    try {
      setCambiandoEstado(pedidoId);
      
      const data = await authenticatedRequest(
        `http://localhost:3000/api/admin/pedido/${pedidoId}/cambiar-estado`,
        'PUT',
        {
          nuevo_estado: nuevoEstado,
          descripcion: descripcion || `Cambio de estado a ${nuevoEstado}`
        }
      );

      if (data && data.success) {
        showToast(data.message || 'Estado actualizado', 'success');
        await cargarPedidos();
        if (mostrarDetalle && pedidoDetalle?.id_pedido === pedidoId) {
          await cargarDetallePedido(pedidoId);
        }
      } else {
        showToast(data?.message || 'Error al cambiar el estado', 'error');
      }

    } catch (err) {
      console.error('Error al cambiar estado:', err);
      showToast('No se pudo cambiar el estado del pedido', 'error');
    } finally {
      setCambiandoEstado(null);
    }
  };

  // Confirmar pago en efectivo
  const confirmarPagoEfectivo = async (pedidoId) => {
    if (!window.confirm('¿Confirmas que se ha recibido el pago en efectivo?')) {
      return;
    }

    try {
      setConfirmandoPago(pedidoId);
      
      const data = await authenticatedRequest(
        `http://localhost:3000/api/admin/pedido/${pedidoId}/confirmar-pago`,
        'PUT'
      );

      if (data && data.success) {
        showToast('Pago confirmado exitosamente', 'success');
        await cargarPedidos();
        if (mostrarDetalle && pedidoDetalle?.id_pedido === pedidoId) {
          await cargarDetallePedido(pedidoId);
        }
      } else {
        showToast(data?.message || 'Error al confirmar el pago', 'error');
      }

    } catch (err) {
      console.error('Error al confirmar pago:', err);
      showToast('No se pudo confirmar el pago', 'error');
    } finally {
      setConfirmandoPago(null);
    }
  };

  // Cancelar reserva
  const cancelarReserva = async (pedidoId) => {
    const motivo = window.prompt('Motivo de cancelación:');
    if (!motivo) return;

    try {
      setCambiandoEstado(pedidoId);
      
      const data = await authenticatedRequest(
        `http://localhost:3000/api/admin/pedido/${pedidoId}/cancelar-reserva`,
        'PUT',
        { motivo }
      );

      if (data && data.success) {
        showToast('Reserva cancelada exitosamente', 'success');
        await cargarPedidos();
        if (mostrarDetalle && pedidoDetalle?.id_pedido === pedidoId) {
          setMostrarDetalle(false);
          setPedidoDetalle(null);
        }
      } else {
        showToast(data?.message || 'Error al cancelar la reserva', 'error');
      }

    } catch (err) {
      console.error('Error al cancelar reserva:', err);
      showToast('No se pudo cancelar la reserva', 'error');
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

  // Función mejorada para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    
    try {
      return new Date(fecha).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para formatear precio
  const formatearPrecio = (precio) => {
    const precioNumerico = Number(precio) || 0;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(precioNumerico);
  };

  // Función para obtener clase CSS del estado
  const getEstadoClass = (estado) => {
    const clases = {
      'Pendiente': 'estado-pendiente',
      'Pagado': 'estado-pagado',
      'Enviado': 'estado-enviado',
      'Entregado': 'estado-entregado',
      'Cancelado': 'estado-cancelado',
      'Reservado': 'estado-reservado',
      'Preparado': 'estado-preparado'
    };
    return `estado-badge ${clases[estado] || ''}`;
  };

  // Función para obtener acciones permitidas según el estado
  const getAccionesPermitidas = (estadoActual, pedido) => {
    const acciones = {
      'Pendiente': ['Cancelado'],
      'Pagado': ['Preparado', 'Cancelado'],
      'Preparado': ['Entregado'],
      'Enviado': ['Entregado'],
      'Entregado': [],
      'Cancelado': [],
      'Reservado': [] // Las acciones para Reservado se manejan aparte
    };
    return acciones[estadoActual] || [];
  };

  return (
    <div className="gestionar-pedidos-container">
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 20px;
          color: white;
          border-radius: 5px;
          z-index: 10000;
          animation: slideIn 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .toast-success {
          background-color: #28a745;
        }

        .toast-error {
          background-color: #dc3545;
        }

        .toast-info {
          background-color: #17a2b8;
        }

        .gestionar-pedidos-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .gestionar-pedidos-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .page-title {
          font-size: 28px;
          color: #333;
          margin: 0;
        }

        .filtros-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filtro-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          background-color: white;
          cursor: pointer;
        }

        .filtro-select:hover {
          border-color: #999;
        }

        .loading-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 72px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-title {
          color: #666;
          margin-bottom: 10px;
        }

        .empty-subtitle {
          color: #999;
        }

        .pedidos-lista {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pedido-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .pedido-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .pedido-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .pedido-info-izquierda {
          display: flex;
          gap: 20px;
          flex: 1;
          min-width: 0;
        }

        .pedido-imagen {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .pedido-datos {
          flex: 1;
          min-width: 0;
        }

        .pedido-id {
          font-size: 18px;
          color: #333;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .usuario-info, .pedido-fecha, .productos-resumen, .metodo-pago {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pedido-info-derecha {
          flex-shrink: 0;
        }

        .estado-y-total {
          text-align: right;
        }

        .estado-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .estado-pendiente {
          background-color: #fff3cd;
          color: #856404;
        }

        .estado-pagado {
          background-color: #d1ecf1;
          color: #0c5460;
        }

        .estado-reservado {
          background-color: #e2e3e5;
          color: #383d41;
          border: 2px solid #6c757d;
        }

        .estado-preparado {
          background-color: #cfe2ff;
          color: #084298;
        }

        .estado-enviado {
          background-color: #d4edda;
          color: #155724;
        }

        .estado-entregado {
          background-color: #d1e7dd;
          color: #0f5132;
        }

        .estado-cancelado {
          background-color: #f8d7da;
          color: #721c24;
        }

        .pedido-total {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .pedido-acciones {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }

        .btn-detalle, .btn-cambiar-estado, .btn-confirmar-pago, .btn-cancelar-reserva {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-detalle {
          background-color: #6c757d;
          color: white;
        }

        .btn-detalle:hover {
          background-color: #5a6268;
        }

        .btn-cambiar-estado {
          background-color: #007bff;
          color: white;
        }

        .btn-cambiar-estado:hover {
          background-color: #0056b3;
        }

        .btn-confirmar-pago {
          background-color: #28a745;
          color: white;
        }

        .btn-confirmar-pago:hover {
          background-color: #218838;
        }

        .btn-cancelar-reserva {
          background-color: #dc3545;
          color: white;
        }

        .btn-cancelar-reserva:hover {
          background-color: #c82333;
        }

        .btn-preparado {
          background-color: #17a2b8;
          color: white;
        }

        .btn-entregado {
          background-color: #28a745;
          color: white;
        }

        .btn-cancelado {
          background-color: #dc3545;
          color: white;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .codigo-reserva-container {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #f8f9fa;
          padding: 6px 12px;
          border-radius: 6px;
        }

        .codigo-reserva {
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
          color: #495057;
        }

        .btn-copiar-codigo {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          font-size: 16px;
          transition: transform 0.2s;
        }

        .btn-copiar-codigo:hover {
          transform: scale(1.2);
        }

        .info-reserva {
          background-color: #f8f9fa;
          padding: 12px 16px;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 4px solid #6c757d;
        }

        .fecha-expiracion {
          color: #dc3545;
          font-weight: 500;
          margin-left: auto;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-detalle-pedido {
          background: white;
          border-radius: 10px;
          padding: 30px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .modal-header h2 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .btn-cerrar-modal {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 5px;
          transition: color 0.3s;
        }

        .btn-cerrar-modal:hover {
          color: #333;
        }

        .seccion-detalle {
          margin-bottom: 30px;
        }

        .seccion-detalle h3 {
          margin-bottom: 15px;
          color: #333;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 10px;
        }

        .info-grid p {
          margin: 5px 0;
        }

        .productos-lista {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .producto-item {
          display: flex;
          gap: 15px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          align-items: center;
        }

        .producto-imagen-pequena {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 5px;
          flex-shrink: 0;
        }

        .producto-info {
          flex: 1;
        }

        .producto-info h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .producto-info p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }

        .seguimiento-lista {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .seguimiento-item {
          display: flex;
          gap: 20px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 5px;
          align-items: flex-start;
        }

        .seguimiento-fecha {
          font-size: 13px;
          color: #666;
          min-width: 150px;
        }

        .seguimiento-estado {
          flex: 1;
        }

        .seguimiento-descripcion {
          font-size: 13px;
          color: #666;
          margin-top: 5px;
        }

        .detalle-reserva {
          background-color: #e8f4f8;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #17a2b8;
        }

        .reserva-codigo-detalle {
          margin-top: 10px;
        }

        .codigo-destacado {
          background-color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-weight: bold;
          margin: 0 10px;
        }

        .btn-copiar-inline {
          background-color: #17a2b8;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-copiar-inline:hover {
          background-color: #138496;
        }

        .reserva-instrucciones {
          margin-top: 10px;
          color: #666;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .pedido-header {
            flex-direction: column;
          }
          
          .pedido-info-derecha {
            width: 100%;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .modal-detalle-pedido {
            padding: 20px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

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
            <option value="reservado">Reservado</option>
            <option value="pagado">Pagado</option>
            <option value="preparado">Preparado</option>
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
                    <h3 className="pedido-id">
                      Pedido #{pedido.id_pedido}
                      {pedido.nombre_estado === 'Reservado' && (
                        <div className="codigo-reserva-container">
                          <span className="codigo-reserva">
                            {pedido.codigo_reserva || generarCodigoReservaTemporal(pedido.id_pedido)}
                          </span>
                          <button
                            className="btn-copiar-codigo"
                            onClick={() => copiarCodigoReserva(pedido.codigo_reserva, pedido.id_pedido)}
                            title="Copiar código de reserva"
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </h3>
                    <p className="usuario-info">
                      <strong>Cliente:</strong> {pedido.nombre_usuario} {pedido.apellido_usuario} (ID: {pedido.id_usuario})
                    </p>
                    <p className="pedido-fecha">
                      <strong>Fecha:</strong> {formatearFecha(pedido.fecha_pedido)}
                    </p>
                    <p className="productos-resumen">
                      <strong>Productos:</strong> {pedido.productos_resumen}
                    </p>
                    {pedido.metodo_pago_nombre && (
                      <p className="metodo-pago">
                        <strong>Método de pago:</strong> {pedido.metodo_pago_nombre}
                      </p>
                    )}
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

              {/* Información adicional para reservas */}
              {pedido.nombre_estado === 'Reservado' && (
                <div className="info-reserva">
                  <strong>⏰ Reserva activa</strong> - El cliente debe presentarse en tienda con el código de reserva para realizar el pago en efectivo.
                  {pedido.fecha_expiracion && (
                    <span className="fecha-expiracion">
                      Expira: {formatearFecha(pedido.fecha_expiracion)}
                    </span>
                  )}
                </div>
              )}

              <div className="pedido-acciones">
                <button 
                  className="btn-detalle"
                  onClick={() => cargarDetallePedido(pedido.id_pedido)}
                  disabled={loadingDetalle}
                >
                  {loadingDetalle ? 'Cargando...' : 'Ver Detalle'}
                </button>

                {/* Acciones específicas para reservas */}
                {pedido.nombre_estado === 'Reservado' && (
                  <>
                    <button
                      className="btn-confirmar-pago"
                      onClick={() => confirmarPagoEfectivo(pedido.id_pedido)}
                      disabled={confirmandoPago === pedido.id_pedido}
                    >
                      {confirmandoPago === pedido.id_pedido ? 'Confirmando...' : '✓ Confirmar Pago Efectivo'}
                    </button>
                    <button
                      className="btn-cancelar-reserva"
                      onClick={() => cancelarReserva(pedido.id_pedido)}
                      disabled={cambiandoEstado === pedido.id_pedido}
                    >
                      ✕ Cancelar Reserva
                    </button>
                  </>
                )}

                {/* Botones para cambiar estado regular */}
                {getAccionesPermitidas(pedido.nombre_estado, pedido).map((accion) => (
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
              <h2>
                Detalle del Pedido #{pedidoDetalle.id_pedido}
                {pedidoDetalle.seguimiento?.find(s => s.nombre_estado === 'Reservado') && (
                  <div className="codigo-reserva-container">
                    <span className="codigo-reserva">
                      {pedidoDetalle.codigo_reserva || generarCodigoReservaTemporal(pedidoDetalle.id_pedido)}
                    </span>
                    <button
                      className="btn-copiar-codigo"
                      onClick={() => copiarCodigoReserva(pedidoDetalle.codigo_reserva, pedidoDetalle.id_pedido)}
                      title="Copiar código"
                    >
                      📋
                    </button>
                  </div>
                )}
              </h2>
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
                  {pedidoDetalle.nombre_comuna && (
                    <p><strong>Comuna:</strong> {pedidoDetalle.nombre_comuna}</p>
                  )}
                  {pedidoDetalle.nombre_region && (
                    <p><strong>Región:</strong> {pedidoDetalle.nombre_region}</p>
                  )}
                </div>
              </div>

              {/* Productos del pedido */}
              <div className="seccion-detalle">
                <h3>Productos del Pedido</h3>
                <div className="productos-lista">
                  {pedidoDetalle.productos.map((producto, index) => (
                    <div key={index} className="producto-item">
                      {producto.imagen_url && (
                        <img 
                          src={producto.imagen_url} 
                          alt={producto.nombre_producto}
                          className="producto-imagen-pequena"
                        />
                      )}
                      <div className="producto-info">
                        <h4>{producto.nombre_producto}</h4>
                        <p>{producto.nombre_marca} - {producto.nombre_talla}</p>
                        <p>Cantidad: {producto.cantidad} | Precio: {formatearPrecio(producto.precio)}</p>
                        <p><strong>Subtotal: {formatearPrecio(producto.subtotal)}</strong></p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '18px' }}>
                  <strong>Total del pedido: {formatearPrecio(pedidoDetalle.total)}</strong>
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

              {/* Información de reserva */}
              {pedidoDetalle.seguimiento?.find(s => s.nombre_estado === 'Reservado') && (
                <div className="seccion-detalle">
                  <h3>Información de Reserva</h3>
                  <div className="detalle-reserva">
                    <div className="reserva-codigo-detalle">
                      <p><strong>Código de Reserva:</strong>
                        <span className="codigo-destacado">
                          {pedidoDetalle.codigo_reserva || generarCodigoReservaTemporal(pedidoDetalle.id_pedido)}
                        </span>
                        <button
                          className="btn-copiar-inline"
                          onClick={() => copiarCodigoReserva(pedidoDetalle.codigo_reserva, pedidoDetalle.id_pedido)}
                        >
                          Copiar
                        </button>
                      </p>
                      <p className="reserva-instrucciones">
                        El cliente debe presentar este código en tienda para retirar y pagar su pedido
                      </p>
                      {pedidoDetalle.fecha_expiracion && (
                        <p>
                          <strong>Fecha de expiración:</strong> {formatearFecha(pedidoDetalle.fecha_expiracion)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

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