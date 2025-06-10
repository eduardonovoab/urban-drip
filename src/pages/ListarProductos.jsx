import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Package, Grid, List } from 'lucide-react';
import '../Styles/ListarProductos.css';

const ListarProductos = () => {
  const [productos, setProductos] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [vistaGrid, setVistaGrid] = useState(true);
  const [productosExpandidos, setProductosExpandidos] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const response = await axios.get('http://localhost:3000/api/admin/producto', {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Agrupar productos por id_producto
          const productosAgrupados = agruparProductosPorId(response.data);
          setProductos(productosAgrupados);
        } catch (error) {
          console.error('Error al cargar productos:', error);
          toast.error('Error al cargar productos');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
      toast.error('No estás autenticado');
    }
  }, []);

  const agruparProductosPorId = (productos) => {
    const productosMap = new Map();
    productos.forEach((producto) => {
      const idProducto = producto.id_producto;
      if (!productosMap.has(idProducto)) {
        productosMap.set(idProducto, {
          ...producto,
          detalles: [producto],  // Inicia con el detalle de la primera talla
        });
      } else {
        const productoExistente = productosMap.get(idProducto);
        productoExistente.detalles.push(producto);  // Agrega los detalles de tallas
      }
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

  const handleCambiarEstado = async (id, nuevoEstado) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado.');
      return;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/admin/producto/${id}`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProductos((prevProductos) =>
        prevProductos.map((prod) =>
          prod.id_producto === id ? { ...prod, estado: nuevoEstado } : prod
        )
      );

      toast.success(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error al cambiar estado del producto:', error);
      toast.error('Error al cambiar estado del producto');
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre_producto.toLowerCase().includes(busqueda.toLowerCase()) ||
                            producto.nombre_marca.toLowerCase().includes(busqueda.toLowerCase());
    const coinciadeCategoria = filtroCategoria === '' || producto.nombre_categoria === filtroCategoria;
    const coinciadeEstado = filtroEstado === '' || producto.estado === filtroEstado;
    
    return coincideBusqueda && coinciadeCategoria && coinciadeEstado;
  });

  const categorias = [...new Set(productos.map(p => p.nombre_categoria))];
  const totalProductos = productos.length;
  const productosActivos = productos.filter(p => p.estado === 'activo').length;
  const stockBajo = productos.filter(p => p.stock < 10).length;

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
          <h1 className="title">Panel de Administración</h1>
          <div className="vista-toggle">
            <button
              onClick={() => setVistaGrid(true)}
              className={vistaGrid ? 'active' : ''}
            >
              <Grid className="icon" />
            </button>
            <button
              onClick={() => setVistaGrid(false)}
              className={!vistaGrid ? 'active' : ''}
            >
              <List className="icon" />
            </button>
          </div>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map(categoria => (
            <option key={categoria} value={categoria}>{categoria}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* Grid de productos */}
      <div className={`grid-container ${vistaGrid ? 'grid' : 'list'}`}>
        {productosFiltrados.map((producto) => (
          <div key={producto.id_producto} className="producto">
            <div className="producto-imagen">
              <img 
                src={producto.imagen_url || 'https://via.placeholder.com/400x400'}
                alt={producto.nombre_producto}
              />
            </div>
            <div className="producto-info">
              <h3>{producto.nombre_producto}</h3>
              <p className="precio">${producto.precio}</p>
              <p className="estado">
                Estado: <span className={producto.estado === 'activo' ? 'activo' : 'inactivo'}>
                  {producto.estado}
                </span>
              </p>
              
              <button 
                onClick={() => toggleExpandirProducto(producto.id_producto)}
                className="btn-ver-tallas"
              >
                {productosExpandidos[producto.id_producto] ? 'Ocultar tallas' : 'Ver tallas'}
              </button>
              
              {productosExpandidos[producto.id_producto] && (
                <div className="tallas-container">
                  <h4>Tallas disponibles:</h4>
                  <ul className="lista-tallas">
                    {producto.detalles && producto.detalles.map((detalle, index) => (
                      <li key={index}>
                        <span>Talla: {detalle.nombre_talla}</span> {/* Aquí estamos usando `talla_id` */}
                        <span>Stock: {detalle.stock}</span> {/* Aquí estamos usando `stock` */}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="acciones-producto">
                <button onClick={() => handleModificar(producto.id_producto)}>Modificar</button>
                <button onClick={() => handleCambiarEstado(
                  producto.id_producto,
                  producto.estado === 'activo' ? 'inactivo' : 'activo'
                )}>
                  {producto.estado === 'activo' ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default ListarProductos;
