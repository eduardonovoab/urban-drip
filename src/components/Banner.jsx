import React from 'react';
import Slider from 'react-slick';

// Importar estilos de slick-carousel (necesarios)
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const Banner = () => {
  const images = [
    "https://www.superadmin.cl/superadmin/img_gallery/1031/slider/1d5250ccae0a4fc.jpg",
    "https://www.superadmin.cl/superadmin/img_gallery/1031/slider/b9ea191ee9ce8a7.jpg",
  ];

  const settings = {
    dots: true,           // puntos de navegación
    infinite: true,       // loop infinito
    speed: 500,           // velocidad transición (ms)
    slidesToShow: 1,      // imágenes visibles
    slidesToScroll: 1,    // imágenes que pasan por scroll
    autoplay: true,       // rotación automática
    autoplaySpeed: 4000,  // tiempo por slide (ms)
    arrows: false,         // flechas izquierda/derecha
    pauseOnHover: true,   // pausa al posar cursor
  };

  return (
    <div className="max-w-full mx-auto rounded-md overflow-hidden mb-12">
      <Slider {...settings}>
        {images.map((img, i) => (
          <div key={i}>
            <img
              src={img}
              alt={`Banner slide ${i + 1}`}
              className="w-full h-[330px] object-cover"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Banner;
