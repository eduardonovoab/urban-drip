import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';  // Importa Link

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/productos/categorias')
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error('Error al cargar categorías:', err));
  }, []);

  const categoriaImagenes = {
    'POLERAS': 'https://dojiw2m9tvv09.cloudfront.net/77327/1/dsc088169991.jpg?24&time=1747953932',
    'POLERONES': 'https://dojiw2m9tvv09.cloudfront.net/77327/1/dsc067993420.jpg?24&time=1747953932',
    'PANTALONES': 'https://catcl.vtexassets.com/arquivos/ids/526939/4070031_2JU_1.jpg?v=638442098146330000?width=1200&height=auto',
    'CHAQUETAS': 'https://dojiw2m9tvv09.cloudfront.net/77327/1/copiadedsc071799865.jpg?24&time=1747953932',
  };

  return (
    <section>
      <style>{`
        .grid-categorias {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .categoria-item img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }
        .categoria-item:hover img {
          transform: scale(1.05);
        }
        .categoria-titulo {
          margin-top: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #000;
          text-align: center;
        }
        /* Tablet */
        @media (min-width: 600px) {
          .grid-categorias {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        /* Desktop */
        @media (min-width: 900px) {
          .grid-categorias {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#000', fontSize: '2rem' }}>
        Categorías
      </h2>

      <div className="grid-categorias">
        {categorias.length === 0 ? (
          <p style={{ textAlign: 'center' }}>Cargando categorías...</p>
        ) : (
          categorias.map(({ id_categoria, nombre_categoria }) => {
            const imgUrl = categoriaImagenes[nombre_categoria] || 'https://via.placeholder.com/300x180?text=Sin+imagen';

            return (
              <Link
                key={id_categoria}
                to={`/productos/categoria/${id_categoria}`}  // Navega a la ruta que muestra los productos de esa categoría
                className="categoria-item"
                title={nombre_categoria}
                style={{ textDecoration: 'none' }}
              >
                <img src={imgUrl} alt={nombre_categoria} loading="lazy" />
                <div className="categoria-titulo">{nombre_categoria}</div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
};

export default Categorias;
