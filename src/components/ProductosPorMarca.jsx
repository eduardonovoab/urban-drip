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

        console.log('🔍 Cargando productos para marca:', id);

        // URL corregida para coincidir con las rutas del backend
        const url = `http://localhost:3000/api/productos/marca/${id}`;
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

        // Agrupar productos por nombre para evitar duplicados
        const productosUnicos = agruparProductosPorNombre(productosData);
        
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

  // Función para agrupar productos por nombre y seleccionar la mejor variante
  const agruparProductosPorNombre = (productos) => {
    if (!Array.isArray(productos)) {
      console.warn('⚠️ productos no es un array:', productos);
      return [];
    }

    const productosMap = new Map();
    
    productos.forEach(producto => {
      // Normalizar el nombre del producto para la agrupación
      const nombreNormalizado = (
        producto.nombre_producto || 
        producto.nombre || 
        ''
      ).trim().toLowerCase();
      
      if (!nombreNormalizado) {
        console.warn('⚠️ Producto sin nombre:', producto);
        return;
      }

      // Si no existe el producto en el Map, lo agregamos
      if (!productosMap.has(nombreNormalizado)) {
        productosMap.set(nombreNormalizado, {
          ...producto,
          // Asegurar que tenga un ID válido
          id_producto: producto.id_producto || producto.id || Math.random().toString(36).substr(2, 9),
          // Normalizar campos comunes
          nombre: producto.nombre_producto || producto.nombre,
          precio: producto.precio || producto.precio_minimo || 0,
          stock: producto.stock || producto.stock_total || 0,
          imagen_url: producto.imagen_url || '/images/placeholder-product.jpg',
          descripcion: producto.descripcion || '',
          categoria: producto.categoria || producto.nombre_categoria || 'Sin categoría',
          marca: producto.marca || producto.nombre_marca || 'Sin marca',
          talla: producto.talla || producto.nombre_talla || 'Sin talla'
        });
      } else {
        // Si ya existe, mantener el de menor precio o mejor stock
        const productoExistente = productosMap.get(nombreNormalizado);
        const precioNuevo = Number(producto.precio || producto.precio_minimo || 0);
        const precioExistente = Number(productoExistente.precio || 0);
        
        // Priorizar el producto con stock > 0, luego el de menor precio
        const stockNuevo = Number(producto.stock || producto.stock_total || 0);
        const stockExistente = Number(productoExistente.stock || 0);
        
        if (stockNuevo > 0 && stockExistente === 0) {
          // Reemplazar si el nuevo tiene stock y el existente no
          productosMap.set(nombreNormalizado, {
            ...producto,
            id_producto: producto.id_producto || producto.id || productoExistente.id_producto,
            nombre: producto.nombre_producto || producto.nombre,
            precio: precioNuevo,
            stock: stockNuevo,
            imagen_url: producto.imagen_url || '/images/placeholder-product.jpg'
          });
        } else if (stockNuevo > 0 && stockExistente > 0 && precioNuevo < precioExistente) {
          // Si ambos tienen stock, usar el de menor precio
          productosMap.set(nombreNormalizado, {
            ...producto,
            id_producto: producto.id_producto || producto.id || productoExistente.id_producto,
            nombre: producto.nombre_producto || producto.nombre,
            precio: precioNuevo,
            stock: stockNuevo,
            imagen_url: producto.imagen_url || '/images/placeholder-product.jpg'
          });
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

  // Función para obtener información de stock
  const obtenerInfoStock = (producto) => {
    const stock = Number(producto.stock || 0);
    
    if (stock === 0) {
      return { disponible: false, texto: 'Sin stock', clase: 'sin-stock' };
    }
    
    if (stock <= 5) {
      return { disponible: true, texto: `¡Últimas ${stock} unidades!`, clase: 'stock-bajo' };
    }
    
    return { disponible: true, texto: 'Disponible', clase: 'stock-ok' };
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
        <p>No se encontraron productos para la marca "{marcaNombre}"</p>
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
        }
        .producto-item:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-decoration: none;
          color: inherit;
        }
        .producto-item.sin-stock {
          opacity: 0.7;
          filter: grayscale(0.3);
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
        }
        .producto-precio {
          margin: 10px;
          font-weight: 700;
          font-size: 1.2rem;
          color: #f97316;
          text-align: center;
        }
        .producto-stock {
          margin: 10px;
          text-align: center;
          font-size: 0.9rem;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .stock-ok {
          background-color: #dcfce7;
          color: #166534;
        }
        .stock-bajo {
          background-color: #fef3c7;
          color: #92400e;
        }
        .sin-stock {
          background-color: #fee2e2;
          color: #991b1b;
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
          <p>{productos.length} {productos.length === 1 ? 'producto' : 'productos'} disponible{productos.length === 1 ? '' : 's'}</p>
        </div>

        <div className="grid-productos">
          {productos.map((prod) => {
            const stockInfo = obtenerInfoStock(prod);
            
            return (
              <Link
                key={`producto-${prod.id_producto}`}
                to={`/producto/detalle/${prod.id_producto}`}
                className={`producto-item ${!stockInfo.disponible ? 'sin-stock' : ''}`}
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
                <div className={`producto-stock ${stockInfo.clase}`}>
                  {stockInfo.texto}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ProductosPorMarca;