// components/ReservaConfirmadaPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/ReservaConfirmada.css';

const ReservaConfirmadaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [reservaInfo, setReservaInfo] = useState(null);
  const [codigoReserva, setCodigoReserva] = useState('');

  useEffect(() => {
    // Obtener información de la reserva del localStorage o state
    const reservaData = localStorage.getItem('reservaInfo');
    
    if (reservaData) {
      const data = JSON.parse(reservaData);
      setReservaInfo(data);
      
      // Generar código de reserva único
      const codigo = `RES-${data.pedido_id}-${Date.now().toString().slice(-4)}`;
      setCodigoReserva(codigo);
      
      // Limpiar localStorage después de usar la data
      localStorage.removeItem('reservaInfo');
    } else if (location.state) {
      // Si no hay data en localStorage, usar la del state
      setReservaInfo({
        pedido_id: location.state.pedidoId,
        total: location.state.total,
        metodo_pago: location.state.metodo_pago,
        fecha_reserva: new Date().toISOString(),
        fecha_expiracion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      });
      
      const codigo = `RES-${location.state.pedidoId}-${Date.now().toString().slice(-4)}`;
      setCodigoReserva(codigo);
    } else {
      // Si no hay información, redirigir al carrito
      toast.error('No se encontró información de la reserva');
      navigate('/carrito');
    }
  }, [navigate, location.state]);

  const handleDescargarComprobante = () => {
    // Crear contenido del comprobante
    const contenido = `
COMPROBANTE DE RESERVA
======================

Código de Reserva: ${codigoReserva}
Fecha: ${new Date().toLocaleDateString('es-CL')}
Hora: ${new Date().toLocaleTimeString('es-CL')}

DETALLES DEL PEDIDO
-------------------
ID del Pedido: ${reservaInfo?.pedido_id}
Total a Pagar: $${reservaInfo?.total?.toLocaleString('es-CL')}
Método de Pago: Efectivo al retirar

PRODUCTOS RESERVADOS
--------------------
${reservaInfo?.items?.map(item => 
  `- ${item.nombre} (x${item.cantidad}) - $${item.subtotal.toLocaleString('es-CL')}`
).join('\n') || 'Ver detalle en tienda'}

INFORMACIÓN IMPORTANTE
----------------------
- Esta reserva es válida por 48 horas
- Vence el: ${new Date(reservaInfo?.fecha_expiracion).toLocaleDateString('es-CL')} a las ${new Date(reservaInfo?.fecha_expiracion).toLocaleTimeString('es-CL')}
- Presenta este código al momento del retiro
- Pago en efectivo al retirar el producto

DIRECCIÓN DE RETIRO
-------------------
Tienda Principal
Horario: Lunes a Sábado 10:00 - 20:00

Gracias por tu compra!
    `;

    // Crear blob y descargar
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reserva_${codigoReserva}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Comprobante descargado correctamente');
  };

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(codigoReserva)
      .then(() => {
        toast.success('Código copiado al portapapeles');
      })
      .catch(() => {
        toast.error('No se pudo copiar el código');
      });
  };

  if (!reservaInfo) {
    return (
      <div className="reserva-loading">
        <div className="loading-spinner"></div>
        <p>Cargando información de la reserva...</p>
      </div>
    );
  }

  return (
    <div className="reserva-confirmada-page">
      <div className="reserva-container">
        <div className="reserva-header success">
          <div className="success-icon">✓</div>
          <h1>¡Reserva Confirmada!</h1>
          <p>Tu pedido ha sido reservado exitosamente</p>
        </div>

        <div className="reserva-content">
          {/* Código de Reserva */}
          <div className="codigo-reserva-section">
            <h2>Tu Código de Reserva</h2>
            <div className="codigo-reserva-box">
              <span className="codigo-reserva">{codigoReserva}</span>
              <button 
                className="btn-copiar"
                onClick={handleCopiarCodigo}
                title="Copiar código"
              >
                📋 Copiar
              </button>
            </div>
            <p className="codigo-nota">
              Presenta este código al momento de retirar y pagar tu pedido
            </p>
          </div>

          {/* Información de la Reserva */}
          <div className="reserva-info-grid">
            <div className="info-card">
              <h3>📦 Detalles del Pedido</h3>
              <div className="info-item">
                <span className="label">ID del Pedido:</span>
                <span className="value">#{reservaInfo.pedido_id}</span>
              </div>
              <div className="info-item">
                <span className="label">Total a Pagar:</span>
                <span className="value total">${reservaInfo.total?.toLocaleString('es-CL')}</span>
              </div>
              <div className="info-item">
                <span className="label">Método de Pago:</span>
                <span className="value">Efectivo al retirar</span>
              </div>
            </div>

            <div className="info-card">
              <h3>⏰ Validez de la Reserva</h3>
              <div className="info-item">
                <span className="label">Fecha de Reserva:</span>
                <span className="value">
                  {new Date(reservaInfo.fecha_reserva).toLocaleDateString('es-CL')}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Vence el:</span>
                <span className="value expiracion">
                  {new Date(reservaInfo.fecha_expiracion).toLocaleDateString('es-CL')} 
                  {' a las '}
                  {new Date(reservaInfo.fecha_expiracion).toLocaleTimeString('es-CL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="alert-expiracion">
                ⚠️ Tienes 48 horas para retirar y pagar tu pedido
              </div>
            </div>
          </div>

          {/* Información de Retiro */}
          <div className="retiro-info">
            <h3>📍 Información de Retiro</h3>
            <div className="tienda-info">
              <div className="tienda-detalle">
                <h4>Tienda Principal</h4>
                <p>Av. Principal 123, Santiago</p>
                <p>Teléfono: +56 2 1234 5678</p>
              </div>
              <div className="horario-info">
                <h4>Horario de Atención</h4>
                <p>Lunes a Viernes: 10:00 - 20:00</p>
                <p>Sábado: 10:00 - 18:00</p>
                <p>Domingo: Cerrado</p>
              </div>
            </div>
          </div>

          {/* Productos Reservados */}
          {reservaInfo.items && reservaInfo.items.length > 0 && (
            <div className="productos-reservados">
              <h3>🛍️ Productos Reservados</h3>
              <div className="productos-lista">
                {reservaInfo.items.map((item, index) => (
                  <div key={index} className="producto-item">
                    <span className="producto-nombre">{item.nombre}</span>
                    <span className="producto-cantidad">x{item.cantidad}</span>
                    <span className="producto-precio">${item.subtotal.toLocaleString('es-CL')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pasos Siguientes */}
          <div className="pasos-siguientes">
            <h3>📋 Pasos Siguientes</h3>
            <ol>
              <li>
                <strong>Guarda tu código de reserva:</strong> {codigoReserva}
              </li>
              <li>
                <strong>Acude a la tienda</strong> dentro de las próximas 48 horas
              </li>
              <li>
                <strong>Presenta tu código</strong> al personal de la tienda
              </li>
              <li>
                <strong>Realiza el pago en efectivo</strong> y retira tu pedido
              </li>
            </ol>
          </div>

          {/* Acciones */}
          <div className="reserva-acciones">
            <button 
              className="btn-descargar"
              onClick={handleDescargarComprobante}
            >
              📥 Descargar Comprobante
            </button>
            <button 
              className="btn-mis-pedidos"
              onClick={() => navigate('/mis-pedidos')}
            >
              📦 Ver Mis Pedidos
            </button>
            <button 
              className="btn-volver"
              onClick={() => navigate('/')}
            >
              🏠 Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservaConfirmadaPage;