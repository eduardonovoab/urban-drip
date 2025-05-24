import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';

const ProductosDestacados = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    // Cargar los productos desde la API
    fetch('http://localhost:3000/api/admin/productos-detalles') // Asegúrate de que esta URL sea la correcta
      .then(res => res.json())
      .then(data => {
        console.log('Productos recibidos:', data); // Verifica la respuesta de la API
        setProductos(data);
      })
      .catch(err => console.error('Error al cargar productos:', err));
  }, []);

  // Agrupar productos por categoría y seleccionar 2 por categoría
  const filtrarPorCategoria = (productos, limitePorCategoria = 2) => {
    const grupos = {}; // Objeto para agrupar productos por categoría

    productos.forEach(prod => {
      // Usar 'nombre_categoria' ahora que ya lo tenemos desde la API
      const categoria = prod.nombre_categoria || 'Sin categoría'; 
      console.log(`Producto: ${prod.nombre_producto}, Categoría: ${categoria}`); // Verificar qué categoría asignamos

      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      if (grupos[categoria].length < limitePorCategoria) {
        grupos[categoria].push(prod);
      }
    });

    console.log(grupos); // Verifica cómo quedan agrupados los productos por categoría
    return Object.values(grupos).flat(); // Aplana los grupos en un solo arreglo
  };

  const productosFiltrados = filtrarPorCategoria(productos);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-black text-center">Productos Destacados</h2>

      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          600: {
            slidesPerView: 2, // Muestra 2 productos por fila en pantallas medianas
          },
          900: {
            slidesPerView: 4, // Muestra 4 productos por fila en pantallas grandes
          },
        }}
        style={{ paddingBottom: '60px' }} // Espacio para flechas y paginación
      >
        {productosFiltrados.map((prod, i) => (
          <SwiperSlide key={i}>
            <div
              className="producto-item"
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                maxWidth: '280px',
                margin: '0 auto',
                transition: 'box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                e.currentTarget.querySelector('.producto-img').style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                e.currentTarget.querySelector('.producto-img').style.transform = 'scale(1)';
              }}
            >
              <img
                src={prod.imagen_url}
                alt={prod.nombre_producto}
                className="producto-img"
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  transition: 'transform 0.3s ease',
                }}
              />
              <div
                className="producto-nombre"
                style={{
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  marginBottom: '6px',
                  color: '#111',
                  textAlign: 'center',
                }}
              >
                {prod.nombre_producto}
              </div>
              <div
                className="producto-marca"
                style={{ color: '#555', marginBottom: '8px', textAlign: 'center' }}
              >
                {prod.nombre_marca}
              </div>
              <div
                className="producto-precio"
                style={{
                  color: '#f97316',
                  fontWeight: '700',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                }}
              >
                ${prod.precio}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default ProductosDestacados;
