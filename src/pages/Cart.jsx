import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import axios from 'axios';

const Cart = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:3001/api/cliente/pedido',
        {
          productos: cartItems.map(item => ({
            detalle_producto_id: item.detalle_producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio
          })),
          total,
          metodo_pago: 'Transferencia' // puedes cambiarlo según el flujo real
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Compra realizada con éxito');
      clearCart();
      navigate('/cliente');
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      alert('Hubo un error al procesar tu pedido.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tu Carrito</h1>

      {cartItems.length === 0 ? (
        <p className="text-gray-600">Tu carrito está vacío.</p>
      ) : (
        <div>
          <ul className="space-y-2 mb-4">
            {cartItems.map((item, index) => (
              <li
                key={index}
                className="border p-3 rounded flex justify-between items-center"
              >
                <span>{item.nombre}</span>
                <span>${item.precio.toLocaleString()} x {item.cantidad}</span>
              </li>
            ))}
          </ul>

          <div className="font-semibold mb-4">Total: ${total.toLocaleString()}</div>

          <div className="flex gap-3">
            <button
              onClick={clearCart}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Vaciar Carrito
            </button>
            <button
              onClick={() => navigate('/cliente')}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Seguir Comprando
            </button>
            <button
              onClick={handleCheckout}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Confirmar Compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
