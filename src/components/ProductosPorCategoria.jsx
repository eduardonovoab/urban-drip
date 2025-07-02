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
  const [estadisticas, setEstadisticas] = useState({
    disponibles: 0,
    agotados: 0,
    total: 0
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id || isNaN(id)) {
          throw new Error('ID de categoría no válido');
        }

        console.log('🔍 Cargando productos activos con detalles para categoría:', id);

        // NUEVA URL que filtra por estados activos
        const url = `http://localhost:3000/api/productos/categoria/${id}/activos-con-detalles`;
        console.log('🌐 URL de solicitud:', url);

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error del servidor:', errorText);
          throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos del servidor:', data);

        if (!data || !data.success) {
          throw new Error('Respuesta del servidor inválida');
        }

        const productosData = data.productos || [];
        const categoriaNombre = data.categoria || 'Categoría';
        const totalProductos = data.total_productos || productosData.length;

        // Calcular estadísticas
        const stats = calcularEstadisticas(productosData);

        console.log(`✅ ${productosData.length} productos encontrados`);
        console.log('📊 Estadísticas:', stats);

        setProductos(productosData);
        setNombreCategoria(categoriaNombre);
        setTotalProductos(totalProductos);
        setEstadisticas(stats);

      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
        setError(err.message);
        setProductos([]);
        setNombreCategoria('Categoría');
        setTotalProductos(0);
        setEstadisticas({ disponibles: 0, agotados: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  // Función para calcular estadísticas de productos
  const calcularEstadisticas = (productos) => {
    const disponibles = productos.filter(p => p.esta_disponible).length;
    const agotados = productos.filter(p => p.esta_agotado).length;
    
    return {
      disponibles,
      agotados,
      total: productos.length
    };
  };

  // Función para formatear precio mejorada
  const formatearPrecio = (producto) => {
    if (!producto.total_detalles || producto.total_detalles === 0) {
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

  // Función para obtener información de disponibilidad MEJORADA
  const obtenerInfoDisponibilidad = (producto) => {
    // Si está agotado (sin stock)
    if (producto.esta_agotado || producto.stock_total === 0) {
      return { 
        disponible: false, 
        texto: 'Agotado', 
        clase: 'agotado',
        descripcion: 'Este producto no tiene stock disponible actualmente'
      };
    }

    // Si está disponible
    if (producto.esta_disponible && producto.stock_total > 0) {
      if (producto.stock_total <= 5) {
        return { 
          disponible: true, 
          texto: `¡Solo ${producto.stock_total} disponibles!`, 
          clase: 'stock-bajo',
          descripcion: 'Stock limitado'
        };
      }

      if (producto.stock_total <= 15) {
        return { 
          disponible: true, 
          texto: `${producto.stock_total} disponibles`, 
          clase: 'stock-medio',
          descripcion: 'Stock disponible'
        };
      }

      return { 
        disponible: true, 
        texto: 'Disponible', 
        clase: 'stock-ok',
        descripcion: 'En stock'
      };
    }

    // Fallback
    return { 
      disponible: false, 
      texto: 'Sin información', 
      clase: 'sin-info',
      descripcion: 'Estado no determinado'
    };
  };

  // Función para obtener resumen de variantes
  const obtenerResumenVariantes = (producto) => {
    if (!producto.total_detalles || producto.total_detalles === 0) {
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
        <p>No se encontraron productos disponibles o agotados en la categoría "{nombreCategoria}"</p>
        <div className="empty-info">
          <p>Esta categoría podría tener:</p>
          <ul>
            <li>Productos temporalmente inhabilitados</li>
            <li>Productos sin detalles de precio o stock configurados</li>
            <li>Sin productos agregados aún</li>
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
        <div className="categoria-stats">
          <p className="productos-count">
            {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'} encontrado{totalProductos === 1 ? '' : 's'}
          </p>
          <div className="stats-breakdown">
            <span className="stat-disponibles">
              {estadisticas.disponibles} disponible{estadisticas.disponibles !== 1 ? 's' : ''}
            </span>
            {estadisticas.agotados > 0 && (
              <span className="stat-agotados">
                {estadisticas.agotados} agotado{estadisticas.agotados !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ordenar productos: disponibles primero, luego agotados */}
      <div className="productos-grid">
        {productos
          .sort((a, b) => {
            // Disponibles primero
            if (a.esta_disponible && !b.esta_disponible) return -1;
            if (!a.esta_disponible && b.esta_disponible) return 1;
            // Luego por nombre
            return a.nombre_producto.localeCompare(b.nombre_producto);
          })
          .map((producto) => {
            const disponibilidadInfo = obtenerInfoDisponibilidad(producto);
            const resumenVariantes = obtenerResumenVariantes(producto);
            
            return (
              <div 
                key={`producto-${producto.id_producto}`} 
                className={`producto-card ${
                  producto.esta_agotado ? 'producto-agotado' : ''
                } ${
                  producto.esta_disponible ? 'producto-disponible' : ''
                }`}
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
                    
                    {/* Badge de estado prominente */}
                    {producto.esta_agotado && (
                      <div className="estado-badge agotado-badge">
                        <span className="agotado-text">AGOTADO</span>
                      </div>
                    )}
                    
                    {/* Badge de variantes */}
                    {producto.total_detalles > 1 && (
                      <div className="variantes-badge">
                        {producto.total_detalles} variantes
                      </div>
                    )}
                    
                    {/* Badge de stock bajo para disponibles */}
                    {producto.esta_disponible && producto.stock_total <= 5 && (
                      <div className="stock-bajo-badge">
                        ¡Solo {producto.stock_total}!
                      </div>
                    )}
                  </div>

                  <div className="producto-info">
                    <h3 className="producto-nombre">{producto.nombre_producto}</h3>
                    
                    {producto.descripcion && (
                      <p className="producto-descripcion">{producto.descripcion}</p>
                    )}

                    <p className={`producto-precio ${producto.esta_agotado ? 'precio-agotado' : ''}`}>
                      {formatearPrecio(producto)}
                    </p>

                    <div className="producto-extras">
                      <p className={`producto-stock ${disponibilidadInfo.clase}`}>
                        {disponibilidadInfo.texto}
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

                {/* Botón de acción mejorado */}
                <div className="producto-actions">
                  <Link 
                    to={`/producto/detalle/${producto.id_producto}`}
                    className={`btn-ver-detalles ${
                      producto.esta_agotado ? 'btn-agotado' : 'btn-disponible'
                    }`}
                  >
                    {producto.esta_agotado ? (
                      <>
                        <span className="btn-icon">👁️</span>
                        Ver producto
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">🛒</span>
                        Ver detalles
                      </>
                    )}
                  </Link>
                  
                  {/* Mensaje adicional para agotados */}
                  {producto.esta_agotado && (
                    <p className="mensaje-agotado">
                      Notificaremos cuando esté disponible
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer mejorado con información */}
      <div className="categoria-footer">
        <p className="categoria-info">
          Mostrando productos disponibles y agotados en {nombreCategoria}
        </p>
        <p className="categoria-note">
          Los productos inhabilitados no se muestran en esta vista
        </p>
      </div>
    </section>
  );
};

export default ProductosPorCategoria;