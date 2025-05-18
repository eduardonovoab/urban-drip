import React, { useState, useEffect } from 'react';

const Home = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/productos-detalles')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => {
        console.error('Error cargando productos:', err);
        setProductos([]);
      });
  }, []);

  return (
    <div>
      <h2>Productos Destacados</h2>
      <ul>
        {productos.map((prod, i) => (
          <li key={i}>
            <img src={prod.imagen_url} alt={prod.nombre_producto} style={{width: '150px'}} />
            <div>{prod.nombre_producto}</div>
            <div>{prod.nombre_marca}</div>
            <div>${prod.precio}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
