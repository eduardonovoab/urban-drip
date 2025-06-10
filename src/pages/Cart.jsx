import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext'; // Usar el mismo contexto que navbar
import { toast } from 'react-toastify';
import '../styles/Cart.css';

const Cart = () => {
  const { 
    carrito, 
    carritoLoading, 
    initialized,
    fetchCarrito, 
    eliminarDelCarrito, 
    calcularTotal,
    cantidadTotal,
    limpiarCarrito,
    realizarCompra
  } = useCart(); // Usar el contexto del carrito

  useEffect(() => {
    // Cargar el carrito si no está inicializado
    if (!initialized) {
      fetchCarrito(true);
    }
  }, [initialized, fetchCarrito]);

  // Eliminar una unidad o producto completo del carrito
  const eliminarProducto = async (detalle_producto_id) => {
    await eliminarDelCarrito(detalle_producto_id);
  };

  // Realizar la compra usando el contexto
  const handleRealizarCompra = async () => {
    await realizarCompra();
  };

  // Calcular total del carrito usando el contexto
  const total = calcularTotal();

  if (carritoLoading) {
    return (
      <div className="cart-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="cart-title">Mi Carrito de Compras</h2>
        <p className="cart-subtitle">
          {carrito.length === 0 ? 'Tu carrito está vacío' : `${carrito.length} producto${carrito.length > 1 ? 's' : ''} en tu carrito`}
        </p>
      </div>

      {carrito.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛍️</div>
          <h3>Tu carrito está vacío</h3>
          <p>¡Agrega algunos productos increíbles a tu carrito!</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => window.history.back()}
          >
            Continuar comprando
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {carrito.map((item) => (
              <div key={`${item.id_detalle_producto}-${item.talla || 'notalla'}`} className="cart-item">
                <div className="product-image-container">
                  <img 
                    src={item.imagen_url || '/placeholder-image.jpg'} 
                    alt={item.nombre}
                    className="product-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                
                <div className="product-details">
                  <h3 className="product-name">{item.nombre}</h3>
                  <div className="product-specs">
                    <span className="product-size">Talla: {item.talla || 'N/A'}</span>
                  </div>
                  <div className="product-price">
                    ${item.precio.toLocaleString('es-CL')}
                  </div>
                </div>

                <div className="quantity-controls">
                  <div className="quantity-info">
                    <span className="quantity-label">Cantidad:</span>
                    <span className="quantity-value">{item.cantidad}</span>
                  </div>
                </div>

                <div className="item-total">
                  <div className="subtotal-label">Subtotal</div>
                  <div className="subtotal-price">
                    ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                  </div>
                </div>

                <div className="item-actions">
                  <button
                    onClick={() => eliminarProducto(item.id_detalle_producto)}
                    className="remove-btn"
                    title="Eliminar producto del carrito"
                  >
                    <span className="remove-icon">🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3 className="summary-title">Resumen del pedido</h3>
              
              <div className="summary-line">
                <span>Subtotal ({cantidadTotal()} producto{cantidadTotal() > 1 ? 's' : ''})</span>
                <span>${total.toLocaleString('es-CL')}</span>
              </div>
              
              <div className="summary-line">
                <span>Envío</span>
                <span className="free-shipping">Gratis</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-total">
                <span>Total</span>
                <span>${total.toLocaleString('es-CL')}</span>
              </div>

              <button
                onClick={handleRealizarCompra}
                className="checkout-btn"
                disabled={carrito.length === 0}
              >
                <span className="checkout-icon">🛒</span>
                Finalizar compra
              </button>

              <div className="security-info">
                <span className="security-icon">🔒</span>
                <span>Compra 100% segura</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;