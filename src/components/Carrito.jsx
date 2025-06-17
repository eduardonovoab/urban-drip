// components/Carrito.js
import React, { useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { toast } from 'react-toastify';
import '../styles/Carrito.css';

const Carrito = ({ isOpen, onClose }) => {
  const {
    carritoCompleto,
    loading,
    error,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    finalizarCompra,
    clearError
  } = useCarrito();

  const [showCheckout, setShowCheckout] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [procesandoCompra, setProcesandoCompra] = useState(false);

  // Usar la estructura completa del carrito que viene del backend
  const carrito = carritoCompleto || { id_pedido: null, items: [], total: 0 };

  // Manejar cambio de cantidad
  const handleCantidadChange = async (detalle_id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      return;
    }

    try {
      const result = await actualizarCantidad(detalle_id, nuevaCantidad);
      if (!result.success) {
        console.error('Error al actualizar cantidad:', result.message);
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    }
  };

  // Manejar eliminación de producto
  const handleEliminar = async (detalle_producto_id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
      try {
        const result = await eliminarDelCarrito(detalle_producto_id);
        if (!result.success) {
          console.error('Error al eliminar producto:', result.message);
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  // Manejar limpiar carrito
  const handleLimpiarCarrito = async () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      try {
        const result = await limpiarCarrito();
        if (!result.success) {
          console.error('Error al vaciar carrito:', result.message);
        }
      } catch (error) {
        console.error('Error al vaciar carrito:', error);
      }
    }
  };

  // Manejar finalizar compra
  const handleFinalizarCompra = async () => {
    setProcesandoCompra(true);
    
    try {
      const result = await finalizarCompra(metodoPago);
      
      if (result.success) {
        setShowCheckout(false);
        onClose();
      }
    } catch (error) {
      console.error('Error al finalizar compra:', error);
    } finally {
      setProcesandoCompra(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="carrito-overlay" onClick={onClose}>
      <div className="carrito-container" onClick={(e) => e.stopPropagation()}>
        <div className="carrito-header">
          <h2>Carrito de Compras</h2>
          <button className="carrito-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && (
          <div className="carrito-error">
            <p>{error}</p>
            <button onClick={clearError}>×</button>
          </div>
        )}

        <div className="carrito-content">
          {loading && (
            <div className="carrito-loading">
              <div className="loading-spinner"></div>
              <p>Cargando...</p>
            </div>
          )}

          {!loading && (!carrito.items || carrito.items.length === 0) && (
            <div className="carrito-empty">
              <div className="empty-icon">🛍️</div>
              <p>Tu carrito está vacío</p>
              <small>¡Agrega algunos productos increíbles!</small>
            </div>
          )}

          {!loading && carrito.items && carrito.items.length > 0 && !showCheckout && (
            <>
              <div className="carrito-items">
                {carrito.items.map((item) => (
                  <div key={item.id_detalle} className="carrito-item">
                    <div className="item-image">
                      <img 
                        src={item.imagen_url} 
                        alt={item.nombre_producto}
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                    
                    <div className="item-details">
                      <h4>{item.nombre_producto}</h4>
                      <p className="item-description">{item.descripcion}</p>
                      <p className="item-specs">
                        {item.nombre_marca} - Talla: {item.nombre_talla}
                      </p>
                      <p className="item-price">${item.precio.toLocaleString('es-CL')}</p>
                    </div>

                    <div className="item-quantity">
                      <button 
                        onClick={() => handleCantidadChange(item.id_detalle, item.cantidad - 1)}
                        disabled={loading || item.cantidad <= 1}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.cantidad}</span>
                      <button 
                        onClick={() => handleCantidadChange(item.id_detalle, item.cantidad + 1)}
                        disabled={loading || item.cantidad >= item.stock}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>

                    <div className="item-subtotal">
                      <p>${item.subtotal.toLocaleString('es-CL')}</p>
                    </div>

                    <button 
                      className="item-remove"
                      onClick={() => handleEliminar(item.id_detalle_producto)}
                      disabled={loading}
                      title="Eliminar producto"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="carrito-summary">
                <div className="carrito-total">
                  <h3>Total: ${carrito.total.toLocaleString('es-CL')}</h3>
                </div>

                <div className="carrito-actions">
                  <button 
                    className="btn-limpiar"
                    onClick={handleLimpiarCarrito}
                    disabled={loading}
                  >
                    Vaciar Carrito
                  </button>
                  <button 
                    className="btn-comprar"
                    onClick={() => setShowCheckout(true)}
                    disabled={loading}
                  >
                    Proceder al Pago
                  </button>
                </div>
              </div>
            </>
          )}

          {showCheckout && (
            <div className="checkout-section">
              <h3>Finalizar Compra</h3>
              
              <div className="checkout-summary">
                <p>Total de productos: {carrito.items ? carrito.items.length : 0}</p>
                <p>Total a pagar: <strong>${carrito.total.toLocaleString('es-CL')}</strong></p>
              </div>

              <div className="checkout-payment">
                <label>Método de Pago:</label>
                <select 
                  value={metodoPago} 
                  onChange={(e) => setMetodoPago(e.target.value)}
                  disabled={procesandoCompra}
                  className="payment-select"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta_credito">Tarjeta de Crédito</option>
                  <option value="tarjeta_debito">Tarjeta de Débito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              <div className="checkout-actions">
                <button 
                  className="btn-back"
                  onClick={() => setShowCheckout(false)}
                  disabled={procesandoCompra}
                >
                  Volver al Carrito
                </button>
                <button 
                  className="btn-confirm"
                  onClick={handleFinalizarCompra}
                  disabled={procesandoCompra}
                >
                  {procesandoCompra ? (
                    <>
                      <div className="loading-spinner-btn"></div>
                      Procesando...
                    </>
                  ) : (
                    'Confirmar Compra'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Carrito;