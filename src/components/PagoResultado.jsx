// components/PagoResultado.jsx - VERSIÓN MEJORADA
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

function PagoResultado() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estadoPago, setEstadoPago] = useState('procesando');
  const [detallesPago, setDetallesPago] = useState(null);
  const [error, setError] = useState(null);
  const [purchaseInfo, setPurchaseInfo] = useState(null);
  const [yaConfirmado, setYaConfirmado] = useState(false);

  // Función para limpiar datos del localStorage
  const limpiarDatosTemporales = useCallback(() => {
    localStorage.removeItem('purchaseInfo');
    localStorage.removeItem('transbankToken');
    localStorage.removeItem('webpayTransaction');
  }, []);

  useEffect(() => {
    console.log('=== COMPONENTE PAGO RESULTADO MONTADO ===');
    console.log('Search params:', Object.fromEntries(searchParams));
    console.log('URL completa:', window.location.href);

    // Obtener información de compra guardada
    const savedPurchaseInfo = localStorage.getItem('purchaseInfo');
    if (savedPurchaseInfo) {
      try {
        const parsed = JSON.parse(savedPurchaseInfo);
        setPurchaseInfo(parsed);
        console.log('Purchase info recuperada:', parsed);
      } catch (error) {
        console.error('Error parsing purchase info:', error);
      }
    }

    // Solo confirmar una vez
    if (!yaConfirmado) {
      confirmarPago();
    }
  }, [searchParams, yaConfirmado]);

  const confirmarPago = async () => {
    // Prevenir múltiples confirmaciones
    if (yaConfirmado) {
      console.log('Ya se confirmó el pago, evitando duplicación');
      return;
    }

    setYaConfirmado(true);

    try {
      // Obtener token de la URL
      const token_ws = searchParams.get('token_ws');
      const TBK_TOKEN = searchParams.get('TBK_TOKEN');
      const TBK_ORDEN_COMPRA = searchParams.get('TBK_ORDEN_COMPRA');
      const TBK_ID_SESION = searchParams.get('TBK_ID_SESION');

      console.log('=== PARÁMETROS RECIBIDOS ===');
      console.log('token_ws:', token_ws);
      console.log('TBK_TOKEN:', TBK_TOKEN);
      console.log('TBK_ORDEN_COMPRA:', TBK_ORDEN_COMPRA);
      console.log('TBK_ID_SESION:', TBK_ID_SESION);

      // Si hay TBK_TOKEN significa que la transacción fue anulada/rechazada
      if (TBK_TOKEN) {
        console.log('=== TRANSACCIÓN ANULADA/RECHAZADA ===');
        setEstadoPago('rechazado');
        setError('La transacción fue cancelada o rechazada por el banco');
        toast.error('Transacción cancelada');
        return;
      }

      if (!token_ws) {
        console.error('=== TOKEN FALTANTE ===');
        setError('Token de transacción no encontrado en la URL');
        setEstadoPago('error');
        toast.error('Error: Token no encontrado');
        return;
      }

      console.log('=== CONFIRMANDO TRANSACCIÓN ===');
      
      // Obtener la URL base del backend desde variables de entorno o usar localhost
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const confirmUrl = `${apiBaseUrl}/api/webpay/confirmar-pago?token_ws=${token_ws}`;
      
      console.log('URL de confirmación:', confirmUrl);
      
      // Llamar al backend para confirmar la transacción
      const response = await fetch(confirmUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Añadir timeout para evitar cuelgue
        signal: AbortSignal.timeout(30000) // 30 segundos
      });

      console.log('=== RESPUESTA CONFIRMACIÓN ===');
      console.log('Status:', response.status);

      const data = await response.json();
      console.log('Data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al confirmar el pago');
      }

      if (data.success) {
        console.log('=== PAGO APROBADO ===');
        setEstadoPago('aprobado');
        setDetallesPago(data.details);
        
        // Limpiar localStorage ya que el pago fue exitoso
        limpiarDatosTemporales();
        
        toast.success('¡Pago realizado exitosamente!');
      } else {
        console.log('=== PAGO RECHAZADO ===');
        setEstadoPago('rechazado');
        setDetallesPago(data.details);
        setError(data.message || 'El pago fue rechazado por el banco');
        toast.error('Pago rechazado');
      }

    } catch (error) {
      console.error('=== ERROR CONFIRMANDO PAGO ===');
      console.error('Error:', error);
      
      let errorMessage = 'Error al procesar la confirmación del pago';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Tiempo de espera agotado al confirmar el pago';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Error de conexión con el servidor';
      }
      
      setEstadoPago('error');
      setError(error.message || errorMessage);
      toast.error('Error al confirmar el pago');
    }
  };

  const formatearFecha = (fechaString) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaString;
    }
  };

  const formatearMonto = (monto) => {
    return parseInt(monto).toLocaleString('es-CL');
  };

  const handleVolverInicio = () => {
    limpiarDatosTemporales();
    navigate('/');
  };

  const handleVerPedidos = () => {
    navigate('/cliente');
  };

  const handleNuevaCompra = () => {
    navigate('/productos');
  };

  const handleReintentar = () => {
    // No limpiar purchaseInfo para que el usuario pueda intentar de nuevo
    navigate('/carrito');
  };

  return (
    <div className="pago-resultado-page">
      <div className="pago-resultado-container">
        
        {/* Estado de procesando */}
        {estadoPago === 'procesando' && (
          <div className="resultado-procesando">
            <div className="loading-spinner-large"></div>
            <h2>Procesando tu pago...</h2>
            <p>Por favor espera mientras confirmamos tu transacción con el banco.</p>
            <small>No cierres esta ventana ni presiones el botón atrás.</small>
          </div>
        )}

        {/* Pago aprobado */}
        {estadoPago === 'aprobado' && (
          <div className="resultado-exitoso">
            <div className="icono-exito">✅</div>
            <h1>¡Pago Exitoso!</h1>
            <p className="mensaje-principal">Tu pago ha sido procesado correctamente</p>

            {detallesPago && (
              <div className="detalles-transaccion">
                <h3>Detalles de la Transacción</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <span className="label">Orden de Compra:</span>
                    <span className="value">{detallesPago.buy_order}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="label">Monto:</span>
                    <span className="value">${formatearMonto(detallesPago.amount)}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="label">Fecha:</span>
                    <span className="value">{formatearFecha(detallesPago.transaction_date)}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="label">Código de Autorización:</span>
                    <span className="value">{detallesPago.authorization_code}</span>
                  </div>
                  {detallesPago.card_detail && (
                    <div className="detalle-item">
                      <span className="label">Tarjeta:</span>
                      <span className="value">**** **** **** {detallesPago.card_detail.card_number}</span>
                    </div>
                  )}
                  <div className="detalle-item">
                    <span className="label">Estado:</span>
                    <span className="value status-approved">{detallesPago.status}</span>
                  </div>
                </div>
              </div>
            )}

            {purchaseInfo && (
              <div className="resumen-compra">
                <h3>Resumen de tu Compra</h3>
                <div className="items-comprados">
                  {purchaseInfo.items.map((item, index) => (
                    <div key={index} className="item-comprado">
                      <span className="item-nombre">{item.nombre}</span>
                      <span className="item-cantidad">x{item.cantidad}</span>
                      <span className="item-precio">${formatearMonto(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="total-compra">
                  <strong>Total: ${formatearMonto(purchaseInfo.total)}</strong>
                </div>
              </div>
            )}

            <div className="acciones-exito">
              <button onClick={handleVerPedidos} className="btn-ver-pedidos">
                Ver Mis Pedidos
              </button>
              <button onClick={handleNuevaCompra} className="btn-nueva-compra">
                Continuar Comprando
              </button>
              <button onClick={handleVolverInicio} className="btn-volver-inicio">
                Volver al Inicio
              </button>
            </div>
          </div>
        )}

        {/* Pago rechazado */}
        {estadoPago === 'rechazado' && (
          <div className="resultado-rechazado">
            <div className="icono-error">❌</div>
            <h1>Pago Rechazado</h1>
            <p className="mensaje-principal">Tu pago no pudo ser procesado</p>
            
            {error && (
              <div className="mensaje-error">
                <p>{error}</p>
              </div>
            )}

            {detallesPago && (
              <div className="detalles-rechazo">
                <h3>Detalles del Rechazo</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <span className="label">Orden de Compra:</span>
                    <span className="value">{detallesPago.buy_order}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="label">Estado:</span>
                    <span className="value status-rejected">{detallesPago.status}</span>
                  </div>
                  {detallesPago.response_code && (
                    <div className="detalle-item">
                      <span className="label">Código de Respuesta:</span>
                      <span className="value">{detallesPago.response_code}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="acciones-rechazo">
              <button onClick={handleReintentar} className="btn-reintentar">
                Intentar de Nuevo
              </button>
              <button onClick={handleVolverInicio} className="btn-volver-inicio">
                Volver al Inicio
              </button>
            </div>
          </div>
        )}

        {/* Error general */}
        {estadoPago === 'error' && (
          <div className="resultado-error">
            <div className="icono-error">⚠️</div>
            <h1>Error en la Transacción</h1>
            <p className="mensaje-principal">Ocurrió un problema al procesar tu pago</p>
            
            {error && (
              <div className="mensaje-error">
                <p>{error}</p>
                <small>Si el problema persiste, contacta con soporte técnico.</small>
              </div>
            )}

            <div className="acciones-error">
              <button onClick={handleReintentar} className="btn-reintentar">
                Volver al Carrito
              </button>
              <button onClick={handleVolverInicio} className="btn-volver-inicio">
                Volver al Inicio
              </button>
            </div>
          </div>
        )}

        {/* Información de debug en desarrollo */}
        {import.meta.env.DEV && (
          <div className="debug-info" style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <h4>Debug Info (Solo en desarrollo):</h4>
            <p><strong>Estado:</strong> {estadoPago}</p>
            <p><strong>Ya confirmado:</strong> {yaConfirmado ? 'Sí' : 'No'}</p>
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Params:</strong> {JSON.stringify(Object.fromEntries(searchParams))}</p>
            <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:3000'}</p>
            {error && (
              <p><strong>Error:</strong> {error}</p>
            )}
            {detallesPago && (
              <details>
                <summary>Detalles de Transbank:</summary>
                <pre>{JSON.stringify(detallesPago, null, 2)}</pre>
              </details>
            )}
            {purchaseInfo && (
              <details>
                <summary>Info de Compra:</summary>
                <pre>{JSON.stringify(purchaseInfo, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PagoResultado;