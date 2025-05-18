import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MisPedidos = () => {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get('http://localhost:3001/api/cliente/mis-pedidos', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPedidos(res.data.pedidos);
      } catch (error) {
        console.error('Error al obtener pedidos:', error);
      }
    };

    fetchPedidos();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Mis Pedidos</h2>

      {pedidos.length === 0 ? (
        <p>No has realizado pedidos aún.</p>
      ) : (
        pedidos.map((pedido) => (
          <div key={pedido.id_pedido} className="border p-4 mb-4 rounded shadow-sm">
            <div className="mb-2">
              <strong>Fecha:</strong> {pedido.fecha_pedido}
            </div>
            <div className="mb-2">
              <strong>Total:</strong> ${pedido.total.toLocaleString()}
            </div>
            <div>
              <strong>Productos:</strong>
              <ul className="ml-4 list-disc">
                {pedido.productos.map((prod, index) => (
                  <li key={index}>
                    {prod.nombre} - {prod.cantidad} x ${prod.precio_unitario.toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}
      <Link
        to={`/cliente/pedido/${pedido.id_pedido}`}
        className="text-blue-600 underline text-sm mt-2 inline-block"
      >
        Ver detalle
      </Link>
    </div>
  );
};

export default MisPedidos;
