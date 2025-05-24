import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ProductosPorCategoria = () => {
  const { id } = useParams();
  const [productos, setProductos] = useState([]);
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar productos
    fetch(`http://localhost:3000/api/productos/categoria/${id}`)
      .then(res => res.json())
      .then(data => {
        setProductos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar productos por categoría:', err);
        setLoading(false);
      });

    // Cargar nombre de categoría
    fetch(`http://localhost:3000/api/categorias/${id}`)  // Ajusta URL según backend
      .then(res => res.json())
      .then(data => {
        // Suponiendo que data tiene la forma { id_categoria: ..., nombre_categoria: '...' }
        setNombreCategoria(data.nombre_categoria || 'Categoría');
      })
      .catch(err => {
        console.error('Error al cargar nombre de categoría:', err);
        setNombreCategoria('Categoría');
      });
  }, [id]);

  if (loading) return <p className="text-center mt-10">Cargando productos...</p>;
  if (productos.length === 0) return <p className="text-center mt-10">No hay productos en esta categoría.</p>;

  return (
    <>
      <style>{`
        .grid-productos {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .producto-item img {
          width: 100%;
          height: 220px;
          object-fit: contain;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }
        .producto-item:hover img {
          transform: scale(1.05);
        }
        .producto-titulo {
          margin-top: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #000;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .producto-precio {
          margin-top: 6px;
          font-weight: 700;
          font-size: 1.2rem;
          color: #f97316;
          text-align: center;
        }
        @media (min-width: 600px) {
          .grid-productos {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 900px) {
          .grid-productos {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1200px) {
          .grid-productos {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>

      <section>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#000', fontSize: '2rem' }}>
          {nombreCategoria}
        </h2>
        <div className="grid-productos">
          {productos.map((prod, index) => (
            <div key={prod.id_detalle_producto ?? index} className="producto-item" title={prod.nombre_producto}>
              <img
                src={prod.imagen_url}
                alt={prod.nombre_producto}
                loading="lazy"
              />
              <div className="producto-titulo">{prod.nombre_producto}</div>
              <div className="producto-precio">${Number(prod.precio).toLocaleString('es-CL')}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default ProductosPorCategoria;
