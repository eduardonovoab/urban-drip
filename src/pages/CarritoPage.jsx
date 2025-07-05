// components/CarritoPage.jsx - VERSIÓN COMBINADA CON SISTEMA DE ESTADOS Y PAGO EN EFECTIVO
import React, { useState, useEffect } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/CarritoPage.css';

const CarritoPage = () => {
  const carritoContext = useCarrito();
  
  const {
    carrito,
    carritoCompleto,
    carritoLoading,
    loading,
    error,
    initialized,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    clearError,
    fetchCarrito,
    calcularTotal,
    cantidadTotal,
    finalizarCompra // Nueva función del contexto
  } = carritoContext;

  const navigate = useNavigate();
  const [procesandoCompra, setProcesandoCompra] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');

  const isLoading = loading || carritoLoading;
  const isInitialized = initialized;

  const carritoData = carritoCompleto || {
    id_pedido: null,
    items: carrito || [],
    total: calcularTotal ? calcularTotal() : 0
  };

  console.log('Estado del carrito:', {
    carrito,
    carritoCompleto,
    carritoData,
    isLoading,
    isInitialized,
    error
  });

  useEffect(() => {
    if (!isInitialized && fetchCarrito && !isLoading) {
      console.log('Cargando carrito...');
      fetchCarrito(true);
    }
  }, [isInitialized, fetchCarrito, isLoading]);

  const handleCantidadChange = async (detalle_id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) return;

    try {
      const result = await actualizarCantidad(detalle_id, nuevaCantidad);
      if (!result.success) {
        console.error('Error al actualizar cantidad:', result.message);
        toast.error(result.message || 'Error al actualizar cantidad');
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      toast.error('Error al actualizar cantidad');
    }
  };

  const handleEliminar = async (detalle_producto_id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
      try {
        const result = await eliminarDelCarrito(detalle_producto_id);
        if (!result.success) {
          console.error('Error al eliminar producto:', result.message);
          toast.error(result.message || 'Error al eliminar producto');
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        toast.error('Error al eliminar producto');
      }
    }
  };

  const handleLimpiarCarrito = async () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      try {
        const result = await limpiarCarrito();
        if (!result.success) {
          console.error('Error al vaciar carrito:', result.message);
          toast.error(result.message || 'Error al vaciar carrito');
        }
      } catch (error) {
        console.error('Error al vaciar carrito:', error);
        toast.error('Error al vaciar carrito');
      }
    }
  };

  // Función mejorada para generar identificadores únicos
  const generarBuyOrder = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `ORD${timestamp}${random}`.substring(0, 26);
  };

  const generarSessionId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `SES${timestamp}${random}`.substring(0, 26);
  };

  // Función para crear formulario POST y enviarlo a Transbank
  const enviarFormularioTransbank = (url, token) => {
    console.log('=== CREANDO FORMULARIO POST PARA TRANSBANK ===');
    console.log('URL:', url);
    console.log('Token:', token);

    // Crear formulario dinámicamente
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;

    // Agregar token como campo oculto
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token_ws';
    tokenInput.value = token;
    form.appendChild(tokenInput);

    // Agregar formulario al body y enviarlo
    document.body.appendChild(form);
    
    console.log('Enviando formulario POST a Transbank...');
    form.submit();
    
    // Limpiar el formulario después de enviarlo
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  };

  // 🎯 FUNCIÓN COMBINADA: Mostrar modal de selección de pago
  const handleProcederAlPago = () => {
    // Validaciones iniciales
    if (!carritoData.items || carritoData.items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    if (!carritoData.total || carritoData.total <= 0) {
      toast.error('El total del carrito debe ser mayor a $0');
      return;
    }

    // Mostrar modal de opciones de pago
    setMostrarModalPago(true);
    setMetodoPagoSeleccionado('');
  };

  // 🎯 FUNCIÓN COMBINADA: Procesar pago unificado
  const procesarPago = async () => {
    if (!metodoPagoSeleccionado) {
      toast.error('Por favor selecciona un método de pago');
      return;
    }

    setProcesandoCompra(true);
    
    try {
      console.log('=== PROCESANDO PAGO ===');
      console.log('Método de pago:', metodoPagoSeleccionado);
      
      if (metodoPagoSeleccionado === 'Efectivo') {
        await procesarPagoEfectivo();
      } else if (metodoPagoSeleccionado === 'Webpay') {
        await procesarPagoWebpay();
      }
      
    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setProcesandoCompra(false);
    }
  };

  // 🎯 FUNCIÓN: Procesar pago en efectivo
  const procesarPagoEfectivo = async () => {
    try {
      console.log('=== INICIANDO PROCESO DE RESERVA (PAGO EN EFECTIVO) ===');
      console.log('Carrito data:', carritoData);

      // PASO 1: Finalizar carrito con método "Efectivo" (creará pedido en estado "Reservado")
      console.log('🛒 PASO 1: Creando reserva del pedido...');
      
      const resultFinalizar = await finalizarCompra('Efectivo');
      
      if (!resultFinalizar.success) {
        throw new Error(resultFinalizar.message || 'Error al crear la reserva');
      }
      
      const pedidoId = resultFinalizar.pedido_id;
      const codigoReserva = resultFinalizar.codigo_reserva || `RES-${pedidoId}`;
      console.log('✅ Pedido reservado. ID:', pedidoId);

      // Guardar información de la reserva
      const reservaInfo = {
        pedido_id: pedidoId,
        codigo_reserva: codigoReserva,
        metodo_pago: 'Efectivo',
        estado: 'Reservado',
        total: carritoData.total,
        items: carritoData.items.map(item => ({
          nombre: item.nombre_producto || item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.subtotal || (item.precio * item.cantidad)
        })),
        fecha_reserva: new Date().toISOString(),
        fecha_expiracion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 horas
      };

      localStorage.setItem('reservaInfo', JSON.stringify(reservaInfo));

      // Mostrar mensaje de éxito
      toast.success('¡Pedido reservado exitosamente!', {
        autoClose: 3000
      });

      // Cerrar modal
      setMostrarModalPago(false);

      // Redirigir a página de confirmación de reserva
      setTimeout(() => {
        navigate('/reserva-confirmada', { 
          state: { 
            pedidoId,
            codigoReserva,
            total: carritoData.total,
            metodo_pago: 'Efectivo'
          } 
        });
      }, 1000);

    } catch (error) {
      console.error('=== ERROR EN PROCESO DE RESERVA ===');
      console.error('Error:', error);
      
      toast.error(error.message || 'Error al procesar la reserva', {
        autoClose: 5000
      });
      
      localStorage.removeItem('reservaInfo');
      
      if (fetchCarrito) {
        fetchCarrito(false);
      }
      
      throw error;
    }
  };

  // 🔄 FUNCIÓN: Procesar pago con Webpay
  const procesarPagoWebpay = async () => {
    try {
      console.log('=== INICIANDO PROCESO DE COMPRA CON WEBPAY ===');
      console.log('Carrito data:', carritoData);

      // PASO 1: Finalizar carrito (crear pedido en estado "Pendiente")
      console.log('🛒 PASO 1: Finalizando carrito...');
      
      const resultFinalizar = await finalizarCompra('Webpay');
      
      if (!resultFinalizar.success) {
        throw new Error(resultFinalizar.message || 'Error al finalizar el carrito');
      }
      
      const pedidoId = resultFinalizar.pedido_id;
      console.log('✅ Carrito finalizado. Pedido ID:', pedidoId);

      // PASO 2: Preparar datos para Webpay
      console.log('💳 PASO 2: Preparando pago con Webpay...');
      
      // Generar identificadores únicos
      const buyOrder = generarBuyOrder();
      const sessionId = generarSessionId();
      const returnUrl = `${window.location.origin}/pago-resultado`;

      console.log('=== IDENTIFICADORES GENERADOS ===');
      console.log('Buy Order:', buyOrder);
      console.log('Session ID:', sessionId);
      console.log('Return URL:', returnUrl);
      console.log('Pedido ID:', pedidoId);

      // Guardar información para después del pago
      const purchaseInfo = {
        pedido_id: pedidoId,
        buyOrder,
        sessionId,
        total: carritoData.total,
        items: carritoData.items.map(item => ({
          nombre: item.nombre_producto || item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.subtotal || (item.precio * item.cantidad)
        })),
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('purchaseInfo', JSON.stringify(purchaseInfo));

      // Datos para enviar a Webpay
      const transactionData = {
        amount: Math.round(carritoData.total),
        buyOrder: buyOrder,
        sessionId: sessionId,
        returnUrl: returnUrl,
        pedido_id: pedidoId
      };

      console.log('=== ENVIANDO A WEBPAY ===');
      console.log('Transaction Data:', transactionData);

      // PASO 3: Crear transacción en Webpay
      const response = await fetch('http://localhost:3000/api/webpay/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transactionData)
      });

      console.log('=== RESPUESTA DE WEBPAY ===');
      console.log('Status:', response.status);
      console.log('OK:', response.ok);

      // Manejar respuesta
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.error('Respuesta no es JSON:', textResponse);
        throw new Error('El servidor devolvió una respuesta inválida');
      }

      console.log('Datos recibidos:', data);

      if (!response.ok) {
        console.error('=== ERROR EN WEBPAY ===');
        console.error('Error data:', data);
        
        let errorMessage = 'Error al conectar con el sistema de pagos';
        
        if (data.error) {
          errorMessage = data.error;
        } else if (response.status >= 500) {
          errorMessage = 'Error interno del servidor de pagos';
        } else if (response.status === 422) {
          errorMessage = 'Datos de transacción inválidos';
        } else if (response.status === 503) {
          errorMessage = 'Servicio de pagos no disponible temporalmente';
        }
        
        throw new Error(errorMessage);
      }

      // Validar respuesta exitosa
      if (!data.success || !data.url || !data.token) {
        console.error('=== RESPUESTA INCOMPLETA DE WEBPAY ===');
        console.error('Success:', data.success);
        console.error('URL:', data.url);
        console.error('Token:', data.token);
        console.error('Full response:', data);
        throw new Error('Respuesta incompleta del servidor de pagos');
      }

      console.log('=== PREPARANDO REDIRECCIÓN A TRANSBANK ===');
      console.log('URL de Transbank:', data.url);
      console.log('Token:', data.token);

      // Validar URL
      try {
        new URL(data.url);
      } catch (urlError) {
        console.error('URL inválida recibida:', data.url);
        throw new Error('URL de pago inválida recibida del servidor');
      }

      // Guardar token de Transbank
      localStorage.setItem('transbankToken', data.token);

      // Cerrar modal
      setMostrarModalPago(false);

      // PASO 4: Redirigir a Transbank
      toast.success('Pedido creado correctamente. Redirigiendo a Transbank...', {
        autoClose: 2000
      });

      console.log('=== ENVIANDO FORMULARIO POST A TRANSBANK ===');
      
      // Pausa para mostrar mensaje
      setTimeout(() => {
        enviarFormularioTransbank(data.url, data.token);
      }, 1500);

    } catch (error) {
      console.error('=== ERROR COMPLETO EN PROCESO DE COMPRA ===');
      console.error('Error object:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Mensajes de error más específicos
      let errorMessage;
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Error de comunicación con el servidor';
      } else if (error.message.includes('inválida')) {
        errorMessage = error.message;
      } else if (error.message.includes('servidor')) {
        errorMessage = error.message;
      } else if (error.message.includes('finalizar')) {
        errorMessage = 'Error al procesar el pedido: ' + error.message;
      } else {
        errorMessage = error.message || 'Error inesperado al procesar la compra';
      }
      
      toast.error(errorMessage, {
        autoClose: 5000
      });
      
      // Limpiar datos en caso de error
      localStorage.removeItem('purchaseInfo');
      localStorage.removeItem('transbankToken');
      
      // Recargar carrito para refrescar estado
      if (fetchCarrito) {
        fetchCarrito(false);
      }
      
      throw error;
    }
  };

  return (
    <div className="carrito-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <nav className="breadcrumb">
          <span onClick={() => navigate('/')} className="breadcrumb-link">Inicio</span> / 
          <span className="breadcrumb-current"> Carrito de Compras</span>
        </nav>
      </div>

      <div className="carrito-page-container">
        <div className="carrito-page-header">
          <h1>Mi Carrito de Compras</h1>
          {carritoData.items && carritoData.items.length > 0 && (
            <p className="carrito-items-count">
              {carritoData.items.length} producto{carritoData.items.length !== 1 ? 's' : ''} en tu carrito
            </p>
          )}
        </div>

        {error && (
          <div className="carrito-error">
            <p>{error}</p>
            <button onClick={clearError} className="error-close">×</button>
          </div>
        )}

        <div className="carrito-page-content">
          {isLoading && (
            <div className="carrito-loading">
              <div className="loading-spinner"></div>
              <p>Cargando tu carrito...</p>
            </div>
          )}

          {!isLoading && (!carritoData.items || carritoData.items.length === 0) && (
            <div className="carrito-empty">
              <div className="empty-icon">🛍️</div>
              <h2>Tu carrito está vacío</h2>
              <p>¡Descubre nuestros increíbles productos!</p>
              <button 
                onClick={() => navigate('/productos')} 
                className="btn-continue-shopping"
              >
                Continuar Comprando
              </button>
            </div>
          )}

          {!isLoading && carritoData.items && carritoData.items.length > 0 && (
            <div className="carrito-content-grid">
              {/* Lista de productos */}
              <div className="carrito-items-section">
                <h2>Productos en tu carrito</h2>
                <div className="carrito-items">
                  {carritoData.items.map((item) => (
                    <div key={item.id_detalle || item.id_detalle_producto} className="carrito-item">
                      <div className="item-image">
                        <img 
                          src={item.imagen_url || '/placeholder-image.jpg'} 
                          alt={item.nombre_producto || item.nombre}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      
                      <div className="item-details">
                        <h3>{item.nombre_producto || item.nombre}</h3>
                        <p className="item-description">{item.descripcion}</p>
                        <p className="item-specs">
                          {item.nombre_marca} - Talla: {item.nombre_talla || item.talla}
                        </p>
                        <p className="item-price">${item.precio.toLocaleString('es-CL')}</p>
                      </div>

                      <div className="item-quantity">
                        <label>Cantidad:</label>
                        <div className="quantity-controls">
                          <button 
                            onClick={() => handleCantidadChange(item.id_detalle || item.id_detalle_producto, item.cantidad - 1)}
                            disabled={isLoading || item.cantidad <= 1}
                            className="quantity-btn"
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.cantidad}</span>
                          <button 
                            onClick={() => handleCantidadChange(item.id_detalle || item.id_detalle_producto, item.cantidad + 1)}
                            disabled={isLoading || item.cantidad >= item.stock}
                            className="quantity-btn"
                          >
                            +
                          </button>
                        </div>
                        <small>Stock: {item.stock}</small>
                      </div>

                      <div className="item-subtotal">
                        <p className="subtotal-label">Subtotal:</p>
                        <p className="subtotal-value">
                          ${(item.subtotal || (item.precio * item.cantidad)).toLocaleString('es-CL')}
                        </p>
                      </div>

                      <button 
                        className="item-remove"
                        onClick={() => handleEliminar(item.id_detalle_producto)}
                        disabled={isLoading}
                        title="Eliminar producto"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen del carrito */}
              <div className="carrito-summary-section">
                <div className="carrito-summary">
                  <h2>Resumen del Pedido</h2>
                  
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Productos ({carritoData.items.length}):</span>
                      <span>${carritoData.total.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="summary-row">
                      <span>Envío:</span>
                      <span>Gratis</span>
                    </div>
                    <div className="summary-row total-row">
                      <span>Total:</span>
                      <span>${carritoData.total.toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  <div className="carrito-actions">
                    <button 
                      className="btn-limpiar"
                      onClick={handleLimpiarCarrito}
                      disabled={isLoading || procesandoCompra}
                    >
                      Vaciar Carrito
                    </button>
                    
                    {/* 🔥 BOTÓN PRINCIPAL - MUESTRA MODAL DE OPCIONES */}
                    <button 
                      className="btn-comprar"
                      onClick={handleProcederAlPago}
                      disabled={isLoading || procesandoCompra || !carritoData.items || carritoData.items.length === 0}
                      style={{
                        opacity: procesandoCompra ? 0.7 : 1,
                        cursor: procesandoCompra ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {procesandoCompra ? (
                        <>
                          <div className="loading-spinner-btn"></div>
                          Procesando...
                        </>
                      ) : (
                        '💳 Proceder al Pago'
                      )}
                    </button>
                  </div>

                  <button 
                    onClick={() => navigate('/productos')} 
                    className="btn-continue-shopping-small"
                    disabled={procesandoCompra}
                  >
                    ← Continuar Comprando
                  </button>

                  {/* 🔥 INFORMACIÓN DE PROCESO MEJORADA */}
                  <div className="purchase-process-info" style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    borderLeft: '4px solid #007bff'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>📋 Proceso de Compra:</h4>
                    <div style={{ marginBottom: '15px' }}>
                      <h5 style={{ margin: '8px 0', fontWeight: 'bold' }}>💰 Pago en Efectivo:</h5>
                      <ol style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>Se crea tu pedido en estado <strong>Reservado</strong></li>
                        <li>Tienes <strong>48 horas</strong> para retirar y pagar en tienda</li>
                        <li>Al pagar, tu pedido pasa a <strong>Pagado</strong></li>
                        <li>Retiras tu producto inmediatamente</li>
                      </ol>
                    </div>
                    <div>
                      <h5 style={{ margin: '8px 0', fontWeight: 'bold' }}>💳 Pago con Webpay:</h5>
                      <ol style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>Se crea tu pedido en estado <strong>Pendiente</strong></li>
                        <li>Te redirigimos a <strong>Transbank</strong> para el pago</li>
                        <li>Después del pago exitoso, tu pedido pasa a <strong>Pagado</strong></li>
                        <li>Preparamos tu pedido y lo marcamos como <strong>Preparado</strong></li>
                        <li>Retiras en tienda cuando esté listo</li>
                      </ol>
                    </div>
                  </div>

                  {/* Información de seguridad */}
                  <div className="payment-security-info">
                    <div className="security-badges">
                      <span className="security-badge">🔒 Pago Seguro</span>
                      <span className="security-badge">🏦 Transbank</span>
                      <span className="security-badge">💵 Efectivo</span>
                    </div>
                    <p className="security-text">
                      Puedes pagar de forma segura con Transbank o reservar para pagar en efectivo al retirar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎯 MODAL DE SELECCIÓN DE MÉTODO DE PAGO COMBINADO */}
      {mostrarModalPago && (
        <div className="modal-overlay" onClick={() => setMostrarModalPago(false)}>
          <div className="modal-pago" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Selecciona tu método de pago</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setMostrarModalPago(false);
                  setMetodoPagoSeleccionado('');
                }}
                disabled={procesandoCompra}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="metodos-pago">
                {/* Opción: Pago en Efectivo */}
                <div 
                  className={`metodo-pago-card ${metodoPagoSeleccionado === 'Efectivo' ? 'selected' : ''}`}
                  onClick={() => setMetodoPagoSeleccionado('Efectivo')}
                >
                  <div className="metodo-icon">💵</div>
                  <h3>Pago en Efectivo</h3>
                  <p>Reserva tu pedido y paga al retirar en tienda</p>
                  <ul className="metodo-features">
                    <li>✅ Sin necesidad de tarjeta</li>
                    <li>✅ Reserva por 48 horas</li>
                    <li>✅ Paga cuando retires</li>
                    <li>✅ Sin cargos adicionales</li>
                  </ul>
                  <div className="metodo-badge">Retiro en Tienda</div>
                </div>

                {/* Opción: Pago con Webpay */}
                <div 
                  className={`metodo-pago-card ${metodoPagoSeleccionado === 'Webpay' ? 'selected' : ''}`}
                  onClick={() => setMetodoPagoSeleccionado('Webpay')}
                >
                  <div className="metodo-icon">💳</div>
                  <h3>Pago con Webpay</h3>
                  <p>Paga de forma segura con tarjetas de crédito o débito</p>
                  <ul className="metodo-features">
                    <li>✅ Pago inmediato y seguro</li>
                    <li>✅ Acepta todas las tarjetas</li>
                    <li>✅ Transacción segura</li>
                    <li>✅ Confirmación instantánea</li>
                  </ul>
                  <div className="metodo-badge">Pago Online</div>
                </div>
              </div>

              {/* Información adicional según método seleccionado */}
              {metodoPagoSeleccionado === 'Efectivo' && (
                <div className="metodo-info-adicional">
                  <h4>📍 Información de retiro en tienda:</h4>
                  <p><strong>Dirección:</strong> Av. Principal 123, Santiago</p>
                  <p><strong>Horario:</strong> Lunes a Sábado 10:00 - 20:00</p>
                  <p><strong>Importante:</strong> Debes presentar tu código de reserva al momento del retiro.</p>
                </div>
              )}

              {metodoPagoSeleccionado === 'Webpay' && (
                <div className="metodo-info-adicional">
                  <h4>🔒 Pago seguro con Transbank:</h4>
                  <p>Serás redirigido al portal seguro de Transbank para completar tu pago.</p>
                  <p>Aceptamos todas las tarjetas de crédito y débito nacionales.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalPago(false);
                  setMetodoPagoSeleccionado('');
                }}
                disabled={procesandoCompra}
              >
                Cancelar
              </button>
              <button 
                className="btn-continuar"
                onClick={procesarPago}
                disabled={!metodoPagoSeleccionado || procesandoCompra}
              >
                {procesandoCompra ? (
                  <>
                    <div className="loading-spinner-btn"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    Continuar con {metodoPagoSeleccionado === 'Efectivo' ? 'Efectivo' : 'Webpay'}
                    →
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoPage;