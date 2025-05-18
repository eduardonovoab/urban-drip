import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Cliente = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/productos');
        setProductos(res.data);
      } catch (err) {
        console.error('Error al cargar productos:', err.message);
      }
    };
    fetchProductos();
  }, []);

  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const realizarCompra = async () => {
    try {
      await axios.post('http://localhost:3000/api/cliente/comprar', { carrito });
      alert('Compra realizada con éxito');
      setCarrito([]);
    } catch (err) {
      console.error('Error al realizar compra:', err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Productos Disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {productos.map((producto) => (
          <div key={producto.id} className="border rounded p-4">
            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-40 object-cover mb-2" />
            <h3 className="text-lg font-semibold">{producto.nombre}</h3>
            <p>{producto.descripcion}</p>
            <p className="font-bold mt-2">${producto.precio}</p>
            <button
              onClick={() => agregarAlCarrito(producto)}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
            >
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-2">Carrito</h2>
        {carrito.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          <div>
            {carrito.map((item, index) => (
              <div key={index} className="border-b py-2">{item.nombre} - ${item.precio}</div>
            ))}
            <button
              onClick={realizarCompra}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            >
              Confirmar compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cliente;
