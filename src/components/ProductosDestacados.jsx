import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../Styles/ProductosDestacados.css';

const ProductosDestacados = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(5);

  // Actualizar items por slide según el tamaño de pantalla
  useEffect(() => {
    const updateItemsPerSlide = () => {
      if (window.innerWidth >= 1200) {
        setItemsPerSlide(5);
      } else if (window.innerWidth >= 1024) {
        setItemsPerSlide(4);
      } else if (window.innerWidth >= 768) {
        setItemsPerSlide(3);
      } else if (window.innerWidth >= 640) {
        setItemsPerSlide(2);
      } else {
        setItemsPerSlide(1);
      }
    };

    updateItemsPerSlide();
    window.addEventListener('resize', updateItemsPerSlide);
    return () => window.removeEventListener('resize', updateItemsPerSlide);
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        
        // Usar endpoint que filtra productos activos (disponibles y agotados)
        // Si tienes el endpoint /productos/destacados/activos, úsalo, sino usa /productos/productos-detalles
        const response = await fetch('http://localhost:3000/api/productos/destacados/activos');
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos de la API:', data);
        
        // Validar que los datos sean un array
        let productosArray;
        if (Array.isArray(data)) {
          productosArray = data;
        } else if (data && Array.isArray(data.productos)) {
          productosArray = data.productos;
        } else if (data && Array.isArray(data.data)) {
          productosArray = data.data;
        } else if (data && typeof data === 'object') {
          productosArray = Object.values(data);
        } else {
          throw new Error('Los datos recibidos no tienen el formato esperado');
        }

        if (!Array.isArray(productosArray)) {
          throw new Error('No se pudo obtener un array de productos válido');
        }

        if (productosArray.length === 0) {
          console.warn('No se recibieron productos de la API');
          setProductos([]);
          return;
        }
        
        console.log('Primer producto de ejemplo:', productosArray[0]);
        
        // Procesar productos con manejo de estados activos
        const productosProcessados = procesarProductosConEstados(productosArray);
        const productosFiltrados = filtrarPorCategoria(productosProcessados, 2); // 2 por categoría
        
        console.log('Productos procesados y filtrados:', productosFiltrados);
        setProductos(productosFiltrados);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  // Función para procesar productos con manejo de estados activos
  const procesarProductosConEstados = (productosRaw) => {
    if (!Array.isArray(productosRaw)) {
      console.error('procesarProductosConEstados recibió datos que no son un array:', productosRaw);
      return [];
    }

    return productosRaw.map(producto => {
      // Verificar que el producto tenga la estructura esperada
      if (!producto || !producto.id_producto) {
        console.warn('Producto inválido encontrado:', producto);
        return null;
      }

      console.log('Procesando producto:', producto.nombre_producto);

      // Si tiene estructura de detalles (como el endpoint productos-detalles)
      let precio_minimo, precio_maximo, stock_total, nombre_marca, detalles;
      
      if (Array.isArray(producto.detalles) && producto.detalles.length > 0) {
        // Estructura con detalles
        detalles = producto.detalles;
        const precios = detalles
          .map(detalle => parseFloat(detalle.precio))
          .filter(precio => !isNaN(precio) && precio > 0);
        
        precio_minimo = precios.length > 0 ? Math.min(...precios) : 0;
        precio_maximo = precios.length > 0 ? Math.max(...precios) : 0;
        stock_total = detalles.reduce((total, detalle) => total + (parseInt(detalle.stock) || 0), 0);
        nombre_marca = detalles[0]?.marca?.nombre_marca || 'Sin marca';
      } else {
        // Estructura simple
        precio_minimo = parseFloat(producto.precio || producto.precio_minimo || 0);
        precio_maximo = parseFloat(producto.precio || producto.precio_maximo || precio_minimo);
        stock_total = parseInt(producto.stock || producto.stock_total || 0);
        nombre_marca = producto.nombre_marca || producto.marca?.nombre_marca || 'Sin marca';
        detalles = [];
      }

      // Determinar estado del producto
      let estadoFinal = 'disponible';
      let disponible = true;

      // Verificar si el producto tiene estado definido
      const estadoProducto = producto.estado_producto || producto.estado || '';
      
      if (estadoProducto.toLowerCase() === 'inhabilitado') {
        // Filtrar productos inhabilitados - no los incluimos
        return null;
      } else if (stock_total === 0 || estadoProducto.toLowerCase() === 'agotado') {
        estadoFinal = 'agotado';
        disponible = false;
      } else if (stock_total > 0) {
        estadoFinal = 'disponible';
        disponible = true;
      }

      const productoProcessado = {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto || 'Producto sin nombre',
        descripcion: producto.descripcion || '',
        imagen_url: producto.imagen_url || 'https://via.placeholder.com/300x300?text=Sin+Imagen',
        nombre_categoria: producto.categoria?.nombre_categoria || producto.nombre_categoria || 'Sin categoría',
        nombre_marca: nombre_marca,
        precio_minimo: precio_minimo,
        precio_maximo: precio_maximo,
        stock_total: stock_total,
        detalles: detalles,
        
        // Estados calculados
        estado: estadoFinal,
        disponible: disponible,
        tiene_stock: stock_total > 0,
        
        // Tallas disponibles
        tallas: detalles.length > 0 
          ? detalles.map(d => d.talla?.nombre_talla || 'Única').filter((t, i, arr) => arr.indexOf(t) === i)
          : ['Única']
      };

      console.log('Producto procesado:', {
        id: productoProcessado.id_producto,
        nombre: productoProcessado.nombre_producto,
        estado: productoProcessado.estado,
        disponible: productoProcessado.disponible,
        stock: productoProcessado.stock_total
      });

      return productoProcessado;
    }).filter(producto => producto !== null); // Filtrar productos nulos (inhabilitados)
  };

  // Función para filtrar productos por categoría (manteniendo tu lógica original)
  const filtrarPorCategoria = (productos, limitePorCategoria = 2) => {
    if (!Array.isArray(productos)) {
      console.error('filtrarPorCategoria recibió datos que no son un array:', productos);
      return [];
    }

    const grupos = {};

    // Separar productos disponibles y agotados
    const productosDisponibles = productos.filter(p => p.disponible);
    const productosAgotados = productos.filter(p => !p.disponible);

    // Priorizar productos disponibles por categoría
    productosDisponibles.forEach(prod => {
      const categoria = prod.nombre_categoria || 'Sin categoría';
      
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      if (grupos[categoria].length < limitePorCategoria) {
        grupos[categoria].push(prod);
      }
    });

    // Completar con productos agotados si hay espacio en las categorías
    productosAgotados.forEach(prod => {
      const categoria = prod.nombre_categoria || 'Sin categoría';
      
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      if (grupos[categoria].length < limitePorCategoria) {
        grupos[categoria].push(prod);
      }
    });

    const resultado = Object.values(grupos).flat();
    console.log(`Productos filtrados por categoría (${limitePorCategoria} por categoría):`, resultado.length);
    
    return resultado;
  };

  // Navegación del carousel
  const nextSlide = () => {
    if (productos.length > itemsPerSlide) {
      setCurrentSlide((prev) => {
        const maxSlide = productos.length - itemsPerSlide;
        return prev >= maxSlide ? 0 : prev + 1;
      });
    }
  };

  const prevSlide = () => {
    if (productos.length > itemsPerSlide) {
      setCurrentSlide((prev) => {
        const maxSlide = productos.length - itemsPerSlide;
        return prev <= 0 ? maxSlide : prev - 1;
      });
    }
  };

  const goToSlide = (index) => {
    const maxSlide = Math.max(0, productos.length - itemsPerSlide);
    if (index >= 0 && index <= maxSlide) {
      setCurrentSlide(index);
    }
  };

  // Auto-play del carousel
  useEffect(() => {
    if (productos.length > itemsPerSlide) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [productos.length, itemsPerSlide, currentSlide]);

  // Función para formatear precio
  const formatearPrecio = (precio) => {
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return 'Precio no disponible';
    }
    return `$ ${precioNum.toLocaleString('es-CL')}`;
  };

  // Función para obtener información de disponibilidad
  const obtenerInfoDisponibilidad = (producto) => {
    if (!producto.disponible) {
      return {
        disponible: false,
        texto: 'Agotado',
        clase: 'agotado',
        showBadge: true
      };
    }
    
    if (producto.stock_total <= 5) {
      return {
        disponible: true,
        texto: `¡Últimas ${producto.stock_total} unidades!`,
        clase: 'stock-bajo',
        showBadge: false
      };
    }
    
    return {
      disponible: true,
      texto: 'Disponible',
      clase: 'disponible',
      showBadge: false
    };
  };

  // Estados de carga y error
  if (loading) {
    return (
      <section className="productos-destacados">
        <div className="container">
          <h2 className="section-title">PRODUCTOS DESTACADOS</h2>
          <div className="products-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="product-card skeleton">
                <div className="product-image skeleton-image"></div>
                <div className="product-info">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                  <div className="skeleton-text medium"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="productos-destacados">
        <div className="container">
          <h2 className="section-title">PRODUCTOS DESTACADOS</h2>
          <div className="error-state">
            <p>Error al cargar productos: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (productos.length === 0) {
    return (
      <section className="productos-destacados">
        <div className="container">
          <h2 className="section-title">PRODUCTOS DESTACADOS</h2>
          <div className="empty-state">
            <p>No hay productos disponibles en este momento.</p>
          </div>
        </div>
      </section>
    );
  }

  const totalSlides = Math.max(0, productos.length - itemsPerSlide + 1);

  return (
    <section className="productos-destacados">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">PRODUCTOS DESTACADOS</h2>
        </div>

        <div className="swiper-container">
          {/* Botones de navegación */}
          {productos.length > itemsPerSlide && (
            <>
              <button
                onClick={prevSlide}
                className="swiper-button swiper-button-prev"
                aria-label="Producto anterior"
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="icon" />
              </button>
              <button
                onClick={nextSlide}
                className="swiper-button swiper-button-next"
                aria-label="Siguiente producto"
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="icon" />
              </button>
            </>
          )}

          {/* Grid de productos */}
          <div className="products-wrapper">
            <div 
              className="products-grid"
              style={{ 
                transform: `translateX(-${(currentSlide * 100) / itemsPerSlide}%)`,
                width: `${(productos.length * 100) / itemsPerSlide}%`
              }}
            >
              {productos.map((producto) => {
                const infoDisponibilidad = obtenerInfoDisponibilidad(producto);
                
                return (
                  <Link
                    key={producto.id_producto}
                    to={`/producto/detalle/${producto.id_producto}`}
                    className={`product-card ${!infoDisponibilidad.disponible ? 'agotado' : ''}`}
                    style={{ 
                      flex: `0 0 ${100 / productos.length}%`,
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    {/* Imagen del producto */}
                    <div className="product-image-container">
                      {/* Badge de agotado */}
                      {infoDisponibilidad.showBadge && (
                        <div className="badge-agotado">Agotado</div>
                      )}
                      
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre_producto}
                        className="product-image"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300?text=Sin+Imagen';
                        }}
                      />
                      
                      {/* Badge de stock bajo */}
                      {producto.stock_total <= 5 && producto.stock_total > 0 && (
                        <div className="stock-badge">
                          ¡Últimas {producto.stock_total} unidades!
                        </div>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="product-info">
                      <h3 className="product-title">{producto.nombre_producto}</h3>
                      
                      {/* Marca del producto */}
                      <div className="product-brand">
                        {producto.nombre_marca}
                      </div>
                      
                      {/* Precio */}
                      <div className={`product-price ${!infoDisponibilidad.disponible ? 'agotado' : ''}`}>
                        {producto.precio_minimo === producto.precio_maximo ? (
                          <span className="price-main">
                            {formatearPrecio(producto.precio_minimo)}
                          </span>
                        ) : (
                          <span className="price-main">
                            {formatearPrecio(producto.precio_minimo)} - {formatearPrecio(producto.precio_maximo)}
                          </span>
                        )}
                      </div>

                      {/* Tallas disponibles */}
                      {producto.tallas.length > 1 && (
                        <div className="product-sizes">
                          <small>Tallas: {producto.tallas.join(', ')}</small>
                        </div>
                      )}
                      
                      {/* Estado de disponibilidad */}
                      <div className={`product-availability ${infoDisponibilidad.clase}`}>
                        <small>{infoDisponibilidad.texto}</small>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Indicadores de paginación */}
          {productos.length > itemsPerSlide && totalSlides > 1 && (
            <div className="swiper-pagination">
              {Array.from({ length: totalSlides }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`pagination-dot ${index === currentSlide ? 'active' : ''}`}
                  aria-label={`Ir a la posición ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductosDestacados;