import React, { useState, useEffect } from 'react';

const Marcas = () => {
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    // Obtener marcas desde la API
    fetch('http://localhost:3000/api/marcas') // Asegúrate de que esta URL esté correcta
      .then(res => res.json())
      .then(data => {
        setMarcas(data);
      })
      .catch(err => console.error('Error al cargar marcas:', err));
  }, []);

  // Mapa de marcas y sus logos (este mapa debe ser complementado con todas las marcas y sus imágenes correspondientes)
  const marcaLogos = {
    "DcSHOES": "/logos/DcSHOES.jpg",
    "DIAMOND": "/logos/DIAMOND.jpg",
    "ESSENTIALS": "/logos/ESSENTIALS.png",
    "HUF": "/logos/HUF.webp",
    "KAYA UNITE": "/logos/KAYA UNITE.png",
    "PRIMITIVE": "/logos/Primitive.jpg",
    "STUSSY": "/logos/STUSSY.jpg",
    "VANS": "/logos/VANS.jpg",
    "VOLCOM": "/logos/VOLCOM.png"
    // Puedes agregar más marcas aquí
  };

  return (
    <section>
      <style>{`
        .grid-marcas {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .marca-item img {
          width: 100%;
          height: 180px;
          object-fit: contain;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }
        .marca-item:hover img {
          transform: scale(1.05);
        }
        /* Tablet */
        @media (min-width: 600px) {
          .grid-marcas {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        /* Desktop */
        @media (min-width: 900px) {
          .grid-marcas {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
      
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#000', fontSize: '1.5rem' }}>
        Marcas Disponibles
      </h2>

      <div className="grid-marcas">
        {marcas.map((marca, i) => {
          const logoUrl = marcaLogos[marca.nombre] || "/logos/default-logo.png"; // Si no encuentra la marca, usar una imagen por defecto
          return (
            <div key={i} className="marca-item" style={{ textAlign: 'center' }}>
              <img
                src={logoUrl}
                alt={marca.nombre}
                loading="lazy"
                className="marca-img"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Marcas;
