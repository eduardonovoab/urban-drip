import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/ProductosPorCategoria.css';

const ProductosPorCategoria = () => {
  const { id } = useParams();
  const [productos, setProductos] = useState([]);
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [totalProductos, setTotalProductos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id || isNaN(id)) {
          throw new Error('ID de categoría no válido');
        }

        console.log('🔍 Cargando productos con detalles para categoría:', id);

        // URL corregida según las nuevas rutas del backend
        const url = `http://localhost:3000/api/productos/categoria/${id}/con-detalles`;
        console.log('🌐 URL de solicitud:', url);

        const productosResponse = await fetch(url);

        if (!productosResponse.ok) {
          const errorText = await productosResponse.text();
          console.error('Error del servidor:', errorText);
          throw new Error(`Error del servidor: ${productosResponse.status} - ${productosResponse.statusText}`);
        }

        const data = await productosResponse.json();
        console.log('✅ Datos recibidos del servidor:', data);

        // Verificar la estructura de la respuesta
        if (!data || typeof data !== 'object') {
          throw new Error('Respuesta del servidor inválida');
        }

        // Extraer datos de la respuesta
        const productosData = data.productos || [];
        const categoriaNombre = data.categoria || 'Categoría';
        const totalProductos = data.total_productos || productosData.length;

        console.log(`✅ ${productosData.length} productos encontrados`);
        if (productosData.length > 0) {
          console.log('📋 Estructura de producto ejemplo:', productosData[0]);
        }

        setProductos(productosData);
        setNombreCategoria(categoriaNombre);
        setTotalProductos(totalProductos);

      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
        setError(err.message);
        setProductos([]);
        setNombreCategoria('Categoría');
        setTotalProductos(0);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  // Función para formatear precio mejorada
  const formatearPrecio = (producto) => {
    if (!producto.tiene_detalles || producto.total_detalles === 0) {
      return 'Consultar precio';
    }

    const precioMin = producto.precio_minimo;
    const precioMax = producto.precio_maximo;

    if (precioMin === null || precioMin === undefined || isNaN(precioMin)) {
      return 'Precio no disponible';
    }

    const formatear = (precio) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(precio);
    };

    // Si los precios son iguales o muy similares, mostrar solo uno
    if (Math.abs(precioMin - precioMax) < 100) {
      return formatear(precioMin);
    }

    // Si son diferentes, mostrar rango
    return `${formatear(precioMin)} - ${formatear(precioMax)}`;
  };

  // Función para obtener información de stock
  const obtenerInfoStock = (producto) => {
    if (!producto.tiene_detalles || producto.total_detalles === 0) {
      return { disponible: false, texto: 'Sin información de stock', clase: 'sin-info' };
    }

    const stockTotal = producto.stock_total || 0;
    
    if (stockTotal === 0) {
      return { disponible: false, texto: 'Sin stock', clase: 'sin-stock' };
    }

    if (stockTotal <= 5) {
      return { disponible: true, texto: `¡Últimas ${stockTotal} unidades!`, clase: 'stock-bajo' };
    }

    return { disponible: true, texto: `${stockTotal} disponibles`, clase: 'stock-ok' };
  };

  // Función para obtener resumen de variantes
  const obtenerResumenVariantes = (producto) => {
    if (!producto.tiene_detalles || producto.total_detalles === 0) {
      return 'Sin variantes';
    }

    const variantes = [];
    
    if (producto.marcas_disponibles && producto.marcas_disponibles.length > 0) {
      variantes.push(`${producto.marcas_disponibles.length} marca${producto.marcas_disponibles.length > 1 ? 's' : ''}`);
    }

    if (producto.tallas_disponibles && producto.tallas_disponibles.length > 0) {
      variantes.push(`${producto.tallas_disponibles.length} talla${producto.tallas_disponibles.length > 1 ? 's' : ''}`);
    }

    if (variantes.length === 0) {
      return `${producto.total_detalles} variante${producto.total_detalles > 1 ? 's' : ''}`;
    }

    return variantes.join(' • ');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h3>Error al cargar productos</h3>
        <p>{error}</p>
        <div className="error-actions">
          <Link to="/" className="btn-volver">
            Volver al inicio
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="btn-retry"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="empty">
        <h3>No hay productos disponibles</h3>
        <p>No se encontraron productos con detalles en la categoría "{nombreCategoria}"</p>
        <div className="empty-info">
          <p>Posibles causas:</p>
          <ul>
            <li>La categoría no tiene productos con detalles configurados</li>
            <li>Los productos no tienen precio ni stock asignados</li>
            <li>Error en la conexión con la base de datos</li>
          </ul>
        </div>
        <Link to="/" className="btn-volver">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <section className="productos-container">
      <div className="categoria-header">
        <Link to="/" className="btn-volver">
          ← Volver al inicio
        </Link>
        <h2>{nombreCategoria}</h2>
        <p className="productos-count">
          {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'} disponible{totalProductos === 1 ? '' : 's'}
        </p>
      </div>

      <div className="productos-grid">
        {productos.map((producto) => {
          const stockInfo = obtenerInfoStock(producto);
          const resumenVariantes = obtenerResumenVariantes(producto);
          
          return (
            <div 
              key={`producto-${producto.id_producto}`} 
              className={`producto-card ${!stockInfo.disponible ? 'sin-stock' : ''}`}
            >
              <Link to={`/producto/detalle/${producto.id_producto}`}>
                <div className="producto-imagen">
                  <img
                    src={producto.imagen_url || '/images/placeholder-product.jpg'}
                    alt={producto.nombre_producto}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/images/placeholder-product.jpg';
                    }}
                  />
                  {/* Badge de cantidad de variantes */}
                  {producto.total_detalles > 1 && (
                    <div className="variantes-badge">
                      {producto.total_detalles} variantes
                    </div>
                  )}
                </div>

                <div className="producto-info">
                  <h3 className="producto-nombre">{producto.nombre_producto}</h3>
                  
                  {producto.descripcion && (
                    <p className="producto-descripcion">{producto.descripcion}</p>
                  )}

                  <p className="producto-precio">
                    {formatearPrecio(producto)}
                  </p>

                  <div className="producto-extras">
                    <p className={`producto-stock ${stockInfo.clase}`}>
                      {stockInfo.texto}
                    </p>

                    {resumenVariantes && resumenVariantes !== 'Sin variantes' && (
                      <p className="producto-variantes">
                        {resumenVariantes}
                      </p>
                    )}

                    {/* Mostrar marcas si hay más de una */}
                    {producto.marcas_disponibles && producto.marcas_disponibles.length > 0 && (
                      <p className="producto-marcas">
                        {producto.marcas_disponibles.slice(0, 2).join(', ')}
                        {producto.marcas_disponibles.length > 2 && ` +${producto.marcas_disponibles.length - 2} más`}
                      </p>
                    )}

                    {/* Mostrar tallas si hay más de una */}
                    {producto.tallas_disponibles && producto.tallas_disponibles.length > 0 && (
                      <p className="producto-tallas">
                        Tallas: {producto.tallas_disponibles.slice(0, 4).join(', ')}
                        {producto.tallas_disponibles.length > 4 && ` +${producto.tallas_disponibles.length - 4} más`}
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {/* Botón rápido para ver detalles */}
              <div className="producto-actions">
                <Link 
                  to={`/producto/detalle/${producto.id_producto}`}
                  className={`btn-ver-detalles ${!stockInfo.disponible ? 'disabled' : ''}`}
                >
                  {stockInfo.disponible ? 'Ver detalles' : 'Sin stock'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="categoria-footer">
        <p className="categoria-info">
          Mostrando productos con precio y stock disponibles en {nombreCategoria}
        </p>
      </div>
    </section>
  );
};

export default ProductosPorCategoria;