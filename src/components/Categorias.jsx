import React from 'react';

const categorias = [
  {
    id: 1,
    nombre: 'Poleras',
    url: '/collection/poleras',
    imagenes: {
      desktop: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/dsc088169991.jpg?24&time=1747953932',
      mobile: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/T_dsc088169991.jpg?24&time=1747953932',
    },
  },
  {
    id: 3,
    nombre: 'Polerones',
    url: '/collection/polerones',
    imagenes: {
      desktop: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/dsc067993420.jpg?24&time=1747953932',
      mobile: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/T_dsc067993420.jpg?24&time=1747953932',
    },
  },
  {
    id: 4,
    nombre: 'Pantalones',
    url: '/collection/calzado',
    imagenes: {
      desktop: 'https://catcl.vtexassets.com/arquivos/ids/526939/4070031_2JU_1.jpg?v=638442098146330000?width=1200&height=auto',
      mobile: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/T_img-69030242.jpg?24&time=1747953932',
    },
  },
  {
    id: 5,
    nombre: 'Shorts',
    url: '/collection/vinilos-resuena?srsltid=AfmBOopn5Cu79qIv2YoZ-lVBxK5iPiBxNBhoMU-f_nTh-qknk_aWXZLt',
    imagenes: {
      desktop: 'https://nikeclprod.vtexassets.com/arquivos/ids/724300-800-800?v=638241059659430000&width=800&height=800&aspect=true',
      mobile: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/T_sinti-tulo-166645.png?24&time=1747953932',
    },
  },
  {
    id: 7,
    nombre: 'Casacas',
    url: '/collection/chaquetas',
    imagenes: {
      desktop: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/copiadedsc071799865.jpg?24&time=1747953932',
      mobile: 'https://dojiw2m9tvv09.cloudfront.net/77327/1/T_copiadedsc071799865.jpg?24&time=1747953932',
    },
  },
];

const Categorias = () => {
  return (
    <>
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
      <section>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#000', fontSize: '2rem' }}>
          Categorías
        </h2>
        <div className="grid-categorias">
          {categorias.map(({ id, nombre, url, imagenes }) => (
            <a
              key={id}
              href={url}
              className="categoria-item"
              title={nombre}
              style={{ textDecoration: 'none' }}
            >
              <img
                src={imagenes.desktop}
                alt={nombre}
                loading="lazy"
              />
              <div className="categoria-titulo">{nombre}</div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
};

export default Categorias;
