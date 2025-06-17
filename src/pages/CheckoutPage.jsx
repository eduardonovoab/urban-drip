// pages/CheckoutPage.js (React)

import { useState } from 'react';
import axios from 'axios';

const CheckoutPage = () => {
  const [amount, setAmount] = useState(100); // Monto de la compra
  const [buyOrder, setBuyOrder] = useState('ORD12345'); // Número de orden único
  const [sessionId, setSessionId] = useState('SESSION123'); // Identificador de sesión único
  const [returnUrl, setReturnUrl] = useState('http://localhost:3000/confirmar-pago'); // URL de retorno

  const handleCheckout = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/webpay/crear-transaccion', {
        amount,
        buyOrder,
        sessionId,
        returnUrl,
      });

      // Redirigir a la URL de Webpay para procesar el pago
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error al crear la transacción', error);
    }
  };

  return (
    <div>
      <h1>Checkout</h1>
      <p>Total: ${amount}</p>
      <button onClick={handleCheckout}>Pagar con Webpay</button>
    </div>
  );
};

export default CheckoutPage;
