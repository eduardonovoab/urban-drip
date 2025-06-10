import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductosPorMarca = () => {
  const { id } = useParams();
  const [productos, setProductos] = useState([]);
  const [marcaNombre, setMarcaNombre] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3000/api/productos/marca/${id}`)
      .then(res => res.json())
      .then(data => {
        // Agrupar productos por nombre para evitar duplicados
        const productosUnicos = agruparProductosPorNombre(data.productos || []);
        setProductos(productosUnicos);
        setMarcaNombre(data.marcaNombre || '');
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar productos por marca:', err);
        setLoading(false);
      });
  }, [id]);

  // Función para agrupar productos por nombre y seleccionar el primero de cada grupo
  const agruparProductosPorNombre = (productos) => {
    const productosMap = new Map();
    
    productos.forEach(producto => {
      // Usar el nombre del producto como clave para agrupar
      const clave = producto.nombre;
      
      // Si no existe el producto en el Map, lo agregamos
      if (!productosMap.has(clave)) {
        productosMap.set(clave, producto);
      } else {
        // Si ya existe, podemos optar por mantener el de menor precio
        // o cualquier otra lógica que prefieras
        const productoExistente = productosMap.get(clave);
        if (producto.precio < productoExistente.precio) {
          productosMap.set(clave, producto);
        }
      }
    });
    
    return Array.from(productosMap.values());
  };

  if (loading) return <p className="text-center mt-10">Cargando productos...</p>;
  if (productos.length === 0) return <p className="text-center mt-10">No hay productos para esta marca.</p>;

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
        .producto-item {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .producto-item:hover {
          transform: scale(1.05);
        }
        .producto-item img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          transition: transform 0.3s ease;
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
          height: 2.4rem;
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
          {marcaNombre}
        </h2>
        <div className="grid-productos">
          {productos.map((prod) => (
            <Link
              key={prod.id_detalle_producto}
              to={`/producto/${prod.id_detalle_producto}`}
              className="producto-item"
              title={prod.nombre}
            >
              <img
                src={prod.imagen_url}
                alt={prod.nombre}
                loading="lazy"
              />
              <div className="producto-titulo">{prod.nombre}</div>
              <div className="producto-precio">${Number(prod.precio).toLocaleString('es-CL')}</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};

export default ProductosPorMarca;