import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Package, Grid, List, Search, Filter } from 'lucide-react';
import '../Styles/ListarProductos.css';

const ListarProductos = () => {
  const [productos, setProductos] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [productosExpandidos, setProductosExpandidos] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [estadosProducto, setEstadosProducto] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado. Por favor, inicia sesión.');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar productos, categorías y estados en paralelo
        const [productosRes, categoriasRes, estadosRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/productos', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/admin/categorias', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/admin/estados-producto', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        console.log('✅ Datos recibidos:', {
          productos: productosRes.data,
          categorias: categoriasRes.data,
          estados: estadosRes.data
        });

        // Agrupar productos por id_producto
        const productosAgrupados = agruparProductosPorId(productosRes.data);
        setProductos(productosAgrupados);
        setCategorias(categoriasRes.data);
        setEstadosProducto(estadosRes.data);

      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          navigate('/login');
        } else {
          toast.error('Error al cargar productos');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const agruparProductosPorId = (productos) => {
    const productosMap = new Map();
    
    productos.forEach((producto) => {
      const idProducto = producto.id_producto;
      
      if (!productosMap.has(idProducto)) {
        // Crear entrada principal del producto
        productosMap.set(idProducto, {
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre_producto,
          descripcion: producto.descripcion,
          imagen_url: producto.imagen_url,
          nombre_categoria: producto.nombre_categoria,
          estado_id: producto.estado_id,
          nombre_estado: producto.nombre_estado,
          detalles: [] // Array para almacenar las variantes (talla/marca/precio)
        });
      }
      
      // Agregar detalle de variante
      const productoExistente = productosMap.get(idProducto);
      productoExistente.detalles.push({
        id_detalle: producto.id_detalle,
        nombre_marca: producto.nombre_marca,
        nombre_talla: producto.nombre_talla,
        precio: producto.precio,
        stock: producto.stock,
        estado_detalle: producto.estado_detalle || producto.estado
      });
    });
    
    return Array.from(productosMap.values());
  };

  const toggleExpandirProducto = (id) => {
    setProductosExpandidos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleModificar = (id) => {
    navigate(`/admin/editar/${id}`);
  };

  const handleCambiarEstado = async (id, nuevoEstadoId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado.');
      return;
    }

    // Encontrar el nombre del estado
    const estadoSeleccionado = estadosProducto.find(e => e.id_estado === nuevoEstadoId);
    if (!estadoSeleccionado) {
      toast.error('Estado no válido');
      return;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/admin/producto/${id}`,
        { estado_id: nuevoEstadoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProductos((prevProductos) =>
        prevProductos.map((prod) =>
          prod.id_producto === id ? { 
            ...prod, 
            estado_id: nuevoEstadoId,
            nombre_estado: estadoSeleccionado.nombre_estado
          } : prod
        )
      );

      toast.success(`Producto cambiado a "${estadoSeleccionado.nombre_estado}" correctamente`);
    } catch (error) {
      console.error('❌ Error al cambiar estado del producto:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al cambiar estado del producto';
      toast.error(errorMessage);
    }
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const totalProductos = productos.length;
    const productosDisponibles = productos.filter(p => p.estado_id === 1).length;
    const productosAgotados = productos.filter(p => p.estado_id === 2).length;
    const productosDescontinuados = productos.filter(p => p.estado_id === 3).length;
    
    // Calcular stock total y stock bajo
    let stockTotal = 0;
    let stockBajo = 0;
    
    productos.forEach(producto => {
      producto.detalles.forEach(detalle => {
        stockTotal += detalle.stock;
        if (detalle.stock < 10) {
          stockBajo++;
        }
      });
    });

    return { 
      totalProductos, 
      productosDisponibles, 
      productosAgotados, 
      productosDescontinuados, 
      stockTotal, 
      stockBajo 
    };
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = busqueda === '' || 
      producto.nombre_producto.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.detalles.some(detalle => 
        detalle.nombre_marca.toLowerCase().includes(busqueda.toLowerCase())
      );
    
    const coinciadeCategoria = filtroCategoria === '' || 
      producto.nombre_categoria === filtroCategoria;
    
    const coinciadeEstado = filtroEstado === '' || producto.estado_id.toString() === filtroEstado;
    
    return coincideBusqueda && coinciadeCategoria && coinciadeEstado;
  });

  const nombresCategorias = categorias.map(cat => cat.nombre_categoria);
  const estadisticas = calcularEstadisticas();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <p className="text-slate-600 mt-6 font-semibold text-lg">Cargando productos...</p>
          <p className="text-slate-400 text-sm">Preparando tu inventario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div>
            <h1 className="title">Panel de Administración</h1>
            <p className="subtitle">Gestiona tu inventario de productos</p>
          </div>
          <div className="vista-toggle">
            <button
              onClick={() => setVistaGrid(true)}
              className={vistaGrid ? 'active' : ''}
              title="Vista en cuadrícula"
            >
              <Grid className="icon" />
            </button>
            <button
              onClick={() => setVistaGrid(false)}
              className={!vistaGrid ? 'active' : ''}
              title="Vista en lista"
            >
              <List className="icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="estadisticas">
        <div className="stat-card">
          <h3>Total Productos</h3>
          <p className="stat-number">{estadisticas.totalProductos}</p>
        </div>
        <div className="stat-card disponible">
          <h3>Disponibles</h3>
          <p className="stat-number success">{estadisticas.productosDisponibles}</p>
        </div>
        <div className="stat-card agotado">
          <h3>Agotados</h3>
          <p className="stat-number warning">{estadisticas.productosAgotados}</p>
        </div>
        <div className="stat-card descontinuado">
          <h3>Descontinuados</h3>
          <p className="stat-number error">{estadisticas.productosDescontinuados}</p>
        </div>
        <div className="stat-card">
          <h3>Stock Bajo</h3>
          <p className="stat-number warning">{estadisticas.stockBajo}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters">
        <div className="filter-group">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar productos o marcas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <Filter className="filter-icon" />
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {nombresCategorias.map(categoria => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            {estadosProducto.map(estado => (
              <option key={estado.id_estado} value={estado.id_estado}>
                {estado.nombre_estado}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resultados */}
      <div className="results-info">
        <p>Mostrando {productosFiltrados.length} de {productos.length} productos</p>
      </div>

      {/* Grid/Lista de productos */}
      {productosFiltrados.length === 0 ? (
        <div className="no-products">
          <Package className="no-products-icon" />
          <h3>No se encontraron productos</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className={`products-container ${vistaGrid ? 'grid-view' : 'list-view'}`}>
          {productosFiltrados.map((producto) => (
            <div key={producto.id_producto} className="producto-card">
              <div className="producto-imagen">
                <img 
                  src={producto.imagen_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen'}
                  alt={producto.nombre_producto}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                  }}
                />
                <div className={`estado-badge estado-${producto.estado_id}`}>
                  {producto.nombre_estado}
                </div>
              </div>

              <div className="producto-info">
                <h3 className="producto-nombre">{producto.nombre_producto}</h3>
                <p className="producto-categoria">{producto.nombre_categoria}</p>
                <p className="producto-descripcion">{producto.descripcion}</p>
                
                {/* Mostrar rango de precios */}
                {producto.detalles.length > 0 && (
                  <div className="precio-info">
                    {producto.detalles.length === 1 ? (
                      <span className="precio">${producto.detalles[0].precio}</span>
                    ) : (
                      <span className="precio">
                        ${Math.min(...producto.detalles.map(d => d.precio))} - 
                        ${Math.max(...producto.detalles.map(d => d.precio))}
                      </span>
                    )}
                  </div>
                )}

                <div className="producto-acciones">
                  <button 
                    onClick={() => toggleExpandirProducto(producto.id_producto)}
                    className="btn-ver-detalles"
                  >
                    {productosExpandidos[producto.id_producto] ? 'Ocultar detalles' : 'Ver detalles'}
                  </button>
                  
                  <div className="acciones-principales">
                    <button 
                      onClick={() => handleModificar(producto.id_producto)}
                      className="btn-modificar"
                    >
                      Modificar
                    </button>
                  </div>
                </div>
                
                {/* Detalles expandibles */}
                {productosExpandidos[producto.id_producto] && (
                  <div className="detalles-expandidos">
                    <h4>Variantes disponibles:</h4>
                    <div className="variantes-grid">
                      {producto.detalles.map((detalle, index) => (
                        <div key={index} className="variante-item">
                          <div className="variante-info">
                            <span className="marca">{detalle.nombre_marca}</span>
                            <span className="talla">Talla: {detalle.nombre_talla}</span>
                            <span className="precio">${detalle.precio}</span>
                            <span className={`stock ${detalle.stock < 10 ? 'low' : ''}`}>
                              Stock: {detalle.stock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastContainer 
        position="top-center" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default ListarProductos;