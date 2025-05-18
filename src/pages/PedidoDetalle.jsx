import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PedidoDetalle = () => {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3001/api/cliente/pedido/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPedido(res.data.pedido);
      } catch (error) {
        console.error('Error al cargar el pedido', error);
      }
    };

    fetchPedido();
  }, [id]);

  if (!pedido) return <div className="p-6">Cargando pedido...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Detalle del Pedido #{pedido.id_pedido}</h2>
      <p><strong>Fecha:</strong> {pedido.fecha_pedido}</p>
      <p><strong>Total:</strong> ${pedido.total.toLocaleString()}</p>
      <h3 className="mt-4 mb-2 font-semibold">Productos:</h3>
      <ul className="list-disc ml-6">
        {pedido.productos.map((prod, i) => (
          <li key={i}>
            {prod.nombre} - {prod.cantidad} x ${prod.precio_unitario.toLocaleString()}
          </li>
        ))}
      </ul>
      <a
        href={`http://localhost:4000/api/cliente/pedido/${pedidoId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Descargar PDF
      </a>
    </div>

  );
};

export default PedidoDetalle;
