import React, { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Categorias from '../components/Categorias';

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
    <div className="bg-white text-black min-h-screen">
      <Banner />
      <Categorias />
      
      <style>{`
        .grid-productos {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          max-width: 960px;
          margin: 0 auto 60px;
          padding: 0 20px;
        }
        .producto-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          transition: box-shadow 0.3s ease;
          max-width: 280px;
          margin: 0 auto;
        }
        .producto-item:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .producto-img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 12px;
          transition: transform 0.3s ease;
        }
        .producto-item:hover .producto-img {
          transform: scale(1.05);
        }
        .producto-nombre {
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 6px;
          color: #111;
          text-align: center;
        }
        .producto-marca {
          color: #555;
          margin-bottom: 8px;
          text-align: center;
        }
        .producto-precio {
          color: #f97316; /* naranja */
          font-weight: 700;
          font-size: 1.2rem;
          text-align: center;
        }
        /* Tablet */
        @media (min-width: 600px) {
          .grid-productos {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        /* Desktop */
        @media (min-width: 900px) {
          .grid-productos {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-black text-center">Productos Destacados</h2>
        <ul className="grid-productos">
          {productos.map((prod, i) => (
            <li key={i} className="producto-item">
              <img
                src={prod.imagen_url}
                alt={prod.nombre_producto}
                className="producto-img"
              />
              <div className="producto-nombre">{prod.nombre_producto}</div>
              <div className="producto-marca">{prod.nombre_marca}</div>
              <div className="producto-precio">${prod.precio}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Home;
