import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductosPorMarca = () => {
  const { id } = useParams();
  const [productos, setProductos] = useState([]);
  const [marcaNombre, setMarcaNombre] = useState('');
  const [totalProductos, setTotalProductos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id || isNaN(id)) {
          throw new Error('ID de marca no válido');
        }

        console.log('🔍 Cargando productos activos para marca:', id);

        // Usar el endpoint que filtra productos activos (disponibles y agotados, NO inhabilitados)
        const url = `http://localhost:3000/api/productos/marca/${id}/activos`;
        console.log('🌐 URL de solicitud:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error del servidor:', errorText);
          throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // Manejar la estructura de respuesta del backend
        let productosData = [];
        let nombreMarca = '';
        let total = 0;

        if (data && typeof data === 'object') {
          productosData = data.productos || [];
          nombreMarca = data.marcaNombre || data.marca_nombre || `Marca ${id}`;
          total = data.total_productos || productosData.length;
        } else if (Array.isArray(data)) {
          productosData = data;
          nombreMarca = `Marca ${id}`;
          total = data.length;
        } else {
          throw new Error('Estructura de respuesta inesperada del servidor');
        }

        // Procesar productos para manejar estados y eliminar duplicados
        const productosConEstado = procesarProductosConEstado(productosData);
        const productosUnicos = agruparProductosPorNombre(productosConEstado);
        
        setProductos(productosUnicos);
        setMarcaNombre(nombreMarca);
        setTotalProductos(total);
        
        console.log(`✅ ${productosUnicos.length} productos únicos cargados de ${total} total`);
        
      } catch (err) {
        console.error('❌ Error al cargar productos por marca:', err);
        setError(err.message);
        setProductos([]);
        setMarcaNombre('');
        setTotalProductos(0);
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, [id]);

  // Función para procesar productos y normalizar estados
  const procesarProductosConEstado = (productos) => {
    if (!Array.isArray(productos)) {
      console.warn('⚠️ productos no es un array:', productos);
      return [];
    }

    return productos.map(producto => {
      const stock = Number(producto.stock || producto.stock_total || 0);
      const estado = producto.estado || producto.nombre_estado || '';
      
      // Determinar estado final del producto
      let estadoFinal = 'disponible';
      let disponible = true;
      
      if (estado.toLowerCase() === 'inhabilitado') {
        // Los inhabilitados no deberían llegar aquí, pero por seguridad
        return null;
      } else if (stock === 0 || estado.toLowerCase() === 'agotado') {
        estadoFinal = 'agotado';
        disponible = false;
      } else if (stock > 0) {
        estadoFinal = 'disponible';
        disponible = true;
      }

      return {
        // ID y datos básicos
        id_producto: producto.id_producto || producto.id || Math.random().toString(36).substr(2, 9),
        nombre: producto.nombre_producto || producto.nombre || 'Producto sin nombre',
        descripcion: producto.descripcion || '',
        imagen_url: producto.imagen_url || '/images/placeholder-product.jpg',
        
        // Datos de precios y stock
        precio: Number(producto.precio || producto.precio_minimo || 0),
        stock: stock,
        
        // Información de categorización
        categoria: producto.categoria || producto.nombre_categoria || 'Sin categoría',
        marca: producto.marca || producto.nombre_marca || 'Sin marca',
        talla: producto.talla || producto.nombre_talla || 'Sin talla',
        
        // Estados calculados
        estado: estadoFinal,
        disponible: disponible,
        fecha_ultimo_estado: producto.fecha_ultimo_estado || null
      };
    }).filter(producto => producto !== null); // Filtrar productos nulos (inhabilitados)
  };

  // Función para agrupar productos por nombre y seleccionar la mejor variante
  const agruparProductosPorNombre = (productos) => {
    if (!Array.isArray(productos)) {
      console.warn('⚠️ productos no es un array:', productos);
      return [];
    }

    const productosMap = new Map();
    
    productos.forEach(producto => {
      // Normalizar el nombre del producto para la agrupación
      const nombreNormalizado = (producto.nombre || '').trim().toLowerCase();
      
      if (!nombreNormalizado) {
        console.warn('⚠️ Producto sin nombre:', producto);
        return;
      }

      // Si no existe el producto en el Map, lo agregamos
      if (!productosMap.has(nombreNormalizado)) {
        productosMap.set(nombreNormalizado, producto);
      } else {
        // Si ya existe, mantener el que esté disponible o el de menor precio
        const productoExistente = productosMap.get(nombreNormalizado);
        const precioNuevo = Number(producto.precio || 0);
        const precioExistente = Number(productoExistente.precio || 0);
        
        // Priorizar productos disponibles sobre agotados
        if (producto.disponible && !productoExistente.disponible) {
          productosMap.set(nombreNormalizado, producto);
        } else if (producto.disponible && productoExistente.disponible && precioNuevo < precioExistente) {
          // Si ambos están disponibles, usar el de menor precio
          productosMap.set(nombreNormalizado, producto);
        }
      }
    });
    
    return Array.from(productosMap.values());
  };

  // Función para formatear precio
  const formatearPrecio = (precio) => {
    const precioNumerico = Number(precio);
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      return 'Consultar precio';
    }
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(precioNumerico);
  };

  // Función para obtener información de disponibilidad (mejorada)
  const obtenerInfoDisponibilidad = (producto) => {
    const stock = Number(producto.stock || 0);
    const estado = producto.estado || 'disponible';
    
    if (!producto.disponible || estado === 'agotado' || stock === 0) {
      return { 
        disponible: false, 
        texto: 'Agotado', 
        clase: 'agotado',
        descripcion: 'Producto temporalmente sin stock'
      };
    }
    
    if (stock <= 5) {
      return { 
        disponible: true, 
        texto: `¡Últimas ${stock} unidades!`, 
        clase: 'stock-bajo',
        descripcion: 'Stock limitado'
      };
    }
    
    return { 
      disponible: true, 
      texto: 'Disponible', 
      clase: 'disponible',
      descripcion: 'En stock'
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <div style={{ 
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px' }}>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '20px',
          border: '1px solid #e74c3c',
          borderRadius: '8px',
          backgroundColor: '#fdf2f2'
        }}>
          <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>Error al cargar productos</h3>
          <p style={{ color: '#721c24', marginBottom: '20px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link 
              to="/" 
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px'
              }}
            >
              Volver al inicio
            </Link>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h3>No hay productos disponibles</h3>
        <p>No se encontraron productos activos para la marca "{marcaNombre}"</p>
        <Link 
          to="/"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px'
          }}
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  // Separar productos disponibles y agotados para mejor presentación
  const productosDisponibles = productos.filter(p => p.disponible);
  const productosAgotados = productos.filter(p => !p.disponible);

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .marca-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .marca-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .marca-header h2 {
          color: #000;
          font-size: 2rem;
          margin-bottom: 10px;
        }
        .marca-stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .stat-item {
          background: #f8f9fa;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          color: #6c757d;
        }
        .btn-volver {
          display: inline-block;
          margin-bottom: 20px;
          padding: 10px 20px;
          background-color: #f3f4f6;
          color: #374151;
          text-decoration: none;
          border-radius: 6px;
          transition: background-color 0.3s;
        }
        .btn-volver:hover {
          background-color: #e5e7eb;
        }
        .seccion-productos {
          margin-bottom: 40px;
        }
        .seccion-titulo {
          font-size: 1.3rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .grid-productos {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          margin: 0 auto;
        }
        .producto-item {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          text-decoration: none;
          color: inherit;
          background: white;
          position: relative;
        }
        .producto-item:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-decoration: none;
          color: inherit;
        }
        .producto-item.agotado {
          opacity: 0.75;
          position: relative;
        }
        .producto-item.agotado::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.7);
          z-index: 1;
          pointer-events: none;
        }
        .producto-item img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .producto-titulo {
          margin: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #000;
          text-align: center;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.8rem;
          line-height: 1.4;
          position: relative;
          z-index: 2;
        }
        .producto-precio {
          margin: 10px;
          font-weight: 700;
          font-size: 1.2rem;
          color: #f97316;
          text-align: center;
          position: relative;
          z-index: 2;
        }
        .producto-precio.agotado {
          color: #6b7280;
        }
        .producto-disponibilidad {
          margin: 10px;
          text-align: center;
          font-size: 0.9rem;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          position: relative;
          z-index: 2;
        }
        .disponible {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .stock-bajo {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          animation: pulse-warning 2s infinite;
        }
        .agotado {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-agotado {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #dc2626;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          z-index: 3;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        @keyframes pulse-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .productos-agotados {
          margin-top: 40px;
        }
        .aviso-agotados {
          background: #fef7f0;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          text-align: center;
        }
        .aviso-agotados h3 {
          color: #c2410c;
          margin: 0 0 8px 0;
          font-size: 1.1rem;
        }
        .aviso-agotados p {
          color: #9a3412;
          margin: 0;
          font-size: 0.9rem;
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
      
      <div className="marca-container">
        <Link to="/" className="btn-volver">
          ← Volver al inicio
        </Link>
        
        <div className="marca-header">
          <h2>{marcaNombre}</h2>
          <div className="marca-stats">
            <div className="stat-item">
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'} encontrado{productos.length === 1 ? '' : 's'}
            </div>
            {productosDisponibles.length > 0 && (
              <div className="stat-item">
                {productosDisponibles.length} disponible{productosDisponibles.length === 1 ? '' : 's'}
              </div>
            )}
            {productosAgotados.length > 0 && (
              <div className="stat-item">
                {productosAgotados.length} agotado{productosAgotados.length === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>

        {/* Productos Disponibles */}
        {productosDisponibles.length > 0 && (
          <div className="seccion-productos">
            <h3 className="seccion-titulo">
              Productos Disponibles ({productosDisponibles.length})
            </h3>
            <div className="grid-productos">
              {productosDisponibles.map((prod) => {
                const infoDisponibilidad = obtenerInfoDisponibilidad(prod);
                
                return (
                  <Link
                    key={`disponible-${prod.id_producto}`}
                    to={`/producto/detalle/${prod.id_producto}`}
                    className={`producto-item ${infoDisponibilidad.clase}`}
                    title={prod.nombre}
                  >
                    <img
                      src={prod.imagen_url || '/images/placeholder-product.jpg'}
                      alt={prod.nombre}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-product.jpg';
                      }}
                    />
                    <div className="producto-titulo">{prod.nombre}</div>
                    <div className="producto-precio">
                      {formatearPrecio(prod.precio)}
                    </div>
                    <div className={`producto-disponibilidad ${infoDisponibilidad.clase}`}>
                      {infoDisponibilidad.texto}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Productos Agotados */}
        {productosAgotados.length > 0 && (
          <div className="seccion-productos productos-agotados">
            <h3 className="seccion-titulo">
              Productos Agotados ({productosAgotados.length})
            </h3>
            
            <div className="aviso-agotados">
              <h3>📦 Productos temporalmente sin stock</h3>
              <p>Estos productos volverán a estar disponibles próximamente. Puedes verlos para conocer nuestro catálogo completo.</p>
            </div>

            <div className="grid-productos">
              {productosAgotados.map((prod) => {
                const infoDisponibilidad = obtenerInfoDisponibilidad(prod);
                
                return (
                  <Link
                    key={`agotado-${prod.id_producto}`}
                    to={`/producto/detalle/${prod.id_producto}`}
                    className={`producto-item ${infoDisponibilidad.clase}`}
                    title={`${prod.nombre} - ${infoDisponibilidad.descripcion}`}
                  >
                    <div className="badge-agotado">Agotado</div>
                    <img
                      src={prod.imagen_url || '/images/placeholder-product.jpg'}
                      alt={prod.nombre}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-product.jpg';
                      }}
                    />
                    <div className="producto-titulo">{prod.nombre}</div>
                    <div className={`producto-precio ${infoDisponibilidad.clase}`}>
                      {formatearPrecio(prod.precio)}
                    </div>
                    <div className={`producto-disponibilidad ${infoDisponibilidad.clase}`}>
                      {infoDisponibilidad.texto}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensaje si no hay productos */}
        {productos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No hay productos disponibles</h3>
            <p>Esta marca no tiene productos activos en este momento.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductosPorMarca;