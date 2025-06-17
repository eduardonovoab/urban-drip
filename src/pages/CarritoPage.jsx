// components/CarritoPage.jsx - INTEGRADO CON SISTEMA DE ESTADOS
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

  // 🚀 FUNCIÓN ACTUALIZADA - INTEGRADA CON SISTEMA DE ESTADOS
  const handleProcederAlPago = async () => {
    // Validaciones iniciales
    if (!carritoData.items || carritoData.items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    if (!carritoData.total || carritoData.total <= 0) {
      toast.error('El total del carrito debe ser mayor a $0');
      return;
    }

    setProcesandoCompra(true);

    try {
      console.log('=== INICIANDO PROCESO DE COMPRA ===');
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
        pedido_id: pedidoId, // 🔥 NUEVO: Guardar ID del pedido
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
        pedido_id: pedidoId // 🔥 NUEVO: Incluir pedido_id
      };

      console.log('=== ENVIANDO A WEBPAY ===');
      console.log('Transaction Data:', transactionData);

      // PASO 3: Crear transacción en Webpay
      const response = await fetch('http://localhost:3000/api/webpay/crear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // 🔥 NUEVO: Incluir token
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
      
    } finally {
      setProcesandoCompra(false);
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
                    
                    {/* 🔥 BOTÓN ACTUALIZADO - INTEGRADO CON NUEVOS ESTADOS */}
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
                          Procesando pedido...
                        </>
                      ) : (
                        '🛒 Crear Pedido y Pagar'
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

                  {/* 🔥 NUEVA INFORMACIÓN DE PROCESO */}
                  <div className="purchase-process-info" style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    borderLeft: '4px solid #007bff'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>📋 Proceso de Compra:</h4>
                    <ol style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>Se crea tu pedido en estado <strong>Pendiente</strong></li>
                      <li>Te redirigimos a <strong>Transbank</strong> para el pago</li>
                      <li>Después del pago exitoso, tu pedido pasa a <strong>Pagado</strong></li>
                      <li>Preparamos tu pedido y lo marcamos como <strong>Enviado</strong></li>
                      <li>Finalmente llega a ti como <strong>Entregado</strong></li>
                    </ol>
                  </div>

                  {/* Información de debug en desarrollo */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="debug-info" style={{
                      marginTop: '20px',
                      padding: '10px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px',
                      fontSize: '12px'
                    }}>
                      <h4>Debug Info:</h4>
                      <p>Items: {carritoData.items?.length || 0}</p>
                      <p>Total: ${carritoData.total}</p>
                      <p><strong>Flujo:</strong> finalizar → webpay → confirmar</p>
                      <p><strong>Estados:</strong> Carrito → Pendiente → Pagado → Enviado → Entregado</p>
                    </div>
                  )}

                  {/* Información de seguridad */}
                  <div className="payment-security-info">
                    <div className="security-badges">
                      <span className="security-badge">🔒 Pago Seguro</span>
                      <span className="security-badge">🏦 Transbank</span>
                      <span className="security-badge">✅ SSL</span>
                    </div>
                    <p className="security-text">
                      Tu pago será procesado de forma segura a través de Transbank, 
                      el sistema de pagos más confiable de Chile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarritoPage;