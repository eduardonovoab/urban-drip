import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Cart.css';

const Cart = () => {
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar el carrito desde la API
  const fetchCarrito = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/cliente/carrito', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
          // 🔍 AGREGAR ESTE CONSOLE.LOG PARA VER LOS DATOS
    console.log('Datos completos del carrito:', res.data);
    console.log('Primer producto:', res.data.productos[0]);
      // Mapear para agregar una key única para React (id + talla si existe)
      const productosUnicos = res.data.productos.map((item, index) => ({
        ...item,
        uniqueKey: `${item.id_detalle_producto}-${index}`,
      }));
      setCarrito(productosUnicos);
    } catch (error) {
      toast.error('Error al cargar el carrito');
      console.error('Error al obtener carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarrito();
  }, []);

  // Eliminar una unidad o producto completo del carrito
  const eliminarProducto = async (detalle_producto_id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:3000/api/cliente/carrito/${detalle_producto_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(res.data.message);
      // Recargar carrito
      fetchCarrito();
    } catch (error) {
      toast.error('Error al eliminar producto del carrito');
      console.error('Error al eliminar producto:', error);
    }
  };

  // Realizar la compra
  const realizarCompra = async () => {
    try {
      const token = localStorage.getItem('token');
      const carritoParaEnvio = carrito.map(({ uniqueKey, ...item }) => item);
      const res = await axios.post(
        'http://localhost:3000/api/cliente/comprar',
        { carrito: carritoParaEnvio },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.message);
      setCarrito([]);
    } catch (error) {
      toast.error('Error al realizar la compra');
      console.error('Error al realizar la compra:', error);
    }
  };

  // Calcular total del carrito
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  if (loading) {
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
              <div key={item.uniqueKey} className="cart-item">
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
                <span>Subtotal ({carrito.length} producto{carrito.length > 1 ? 's' : ''})</span>
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
                onClick={realizarCompra}
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