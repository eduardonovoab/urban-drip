import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AgregarTallaProducto = () => {
  const { id_producto } = useParams();
  const navigate = useNavigate();

  // Estados para las tallas disponibles y las tallas del producto
  const [tallasDisponibles, setTallasDisponibles] = useState([]);
  const [tallasProducto, setTallasProducto] = useState([]);
  const [producto, setProducto] = useState(null);

  // Estados para el formulario
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Estados para edición
  const [editando, setEditando] = useState(null);
  const [nuevoStock, setNuevoStock] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);

        const headers = {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        };

        // Cargar datos usando Promise.all como en AgregarProducto
        const [tallasRes, productoRes, tallasProductoRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/tallas', { headers }),
          axios.get(`http://localhost:3000/api/admin/producto/${id_producto}`, { headers }),
          axios.get(`http://localhost:3000/api/productos/${id_producto}/tallas`, { headers })
        ]);

        setTallasDisponibles(tallasRes.data);
        setProducto(productoRes.data);
        setTallasProducto(tallasProductoRes.data);

      } catch (error) {
        console.error('Error al cargar los datos:', error);
        toast.error('Error al cargar la información');
      } finally {
        setLoadingData(false);
      }
    };

    if (id_producto) {
      cargarDatos();
    }
  }, [id_producto]);

  // Obtener tallas no asignadas al producto
  const tallasNoAsignadas = tallasDisponibles.filter(talla => 
    !tallasProducto.some(tp => tp.talla_id === talla.id)
  );

  // Agregar nueva talla al producto
  const handleAgregarTalla = async (e) => {
    e.preventDefault();

    if (!tallaSeleccionada || !stock) {
      toast.error('Por favor selecciona una talla e ingresa el stock');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:3000/api/admin/producto/${id_producto}/talla`,
        {
          talla_id: tallaSeleccionada,
          stock: parseInt(stock),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Talla agregada correctamente');

      // Actualizar la lista de tallas del producto
      const nuevaTalla = {
        id: response.data.id,
        talla_id: parseInt(tallaSeleccionada),
        stock: parseInt(stock),
        talla: tallasDisponibles.find(t => t.id === parseInt(tallaSeleccionada)),
      };
      setTallasProducto([...tallasProducto, nuevaTalla]);

      // Resetear formulario
      setTallaSeleccionada('');
      setStock('');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agregar la talla');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar stock de una talla
  const handleActualizarStock = async (id_talla_producto) => {
    if (!nuevoStock || nuevoStock < 0) {
      toast.error('Ingresa un stock válido');
      return;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/admin/producto/${id_producto}/talla/${id_talla_producto}`,
        {
          stock: parseInt(nuevoStock),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Stock actualizado correctamente');

      // Actualizar el estado local
      setTallasProducto(tallasProducto.map(tp => 
        tp.id === id_talla_producto 
          ? { ...tp, stock: parseInt(nuevoStock) }
          : tp
      ));

      // Salir del modo edición
      setEditando(null);
      setNuevoStock('');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el stock');
      console.error('Error:', error);
    }
  };

  // Eliminar talla del producto
  const handleEliminarTalla = async (id_talla_producto, nombreTalla) => {
    if (!window.confirm(`¿Estás seguro de eliminar la talla ${nombreTalla}?`)) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:3000/api/admin/producto/${id_producto}/talla/${id_talla_producto}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Talla eliminada correctamente');
      setTallasProducto(tallasProducto.filter(tp => tp.id !== id_talla_producto));

    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar la talla');
      console.error('Error:', error);
    }
  };

  // Iniciar edición de stock
  const iniciarEdicion = (talla) => {
    setEditando(talla.id);
    setNuevoStock(talla.stock.toString());
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditando(null);
    setNuevoStock('');
  };

  if (loadingData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de Tallas y Stock
          </h1>
          {producto && (
            <p className="text-gray-600 mt-2">
              Producto: <span className="font-semibold">{producto.nombre}</span>
            </p>
          )}
        </div>

        {/* Formulario para agregar nueva talla */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Agregar Nueva Talla
          </h2>
          
          {tallasNoAsignadas.length > 0 ? (
            <form onSubmit={handleAgregarTalla} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Talla
                  </label>
                  <select
                    value={tallaSeleccionada}
                    onChange={(e) => setTallaSeleccionada(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar Talla</option>
                    {tallasNoAsignadas.map((talla) => (
                      <option key={talla.id} value={talla.id}>
                        {talla.talla}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Agregando...' : 'Agregar Talla'}
              </button>
            </form>
          ) : (
            <p className="text-gray-600 italic">
              Todas las tallas disponibles ya han sido asignadas a este producto.
            </p>
          )}
        </div>

        {/* Lista de tallas del producto */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Tallas del Producto ({tallasProducto.length})
          </h2>
          
          {tallasProducto.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Talla
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tallasProducto.map((tallaProducto) => (
                    <tr key={tallaProducto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {tallaProducto.talla?.talla || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editando === tallaProducto.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={nuevoStock}
                              onChange={(e) => setNuevoStock(e.target.value)}
                              className="w-20 p-2 border border-gray-300 rounded text-sm"
                              min="0"
                            />
                            <button
                              onClick={() => handleActualizarStock(tallaProducto.id)}
                              className="text-green-600 hover:text-green-900 text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {tallaProducto.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tallaProducto.stock > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tallaProducto.stock > 0 ? 'Disponible' : 'Agotado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {editando !== tallaProducto.id && (
                            <button
                              onClick={() => iniciarEdicion(tallaProducto)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                          )}
                          <button
                            onClick={() => handleEliminarTalla(
                              tallaProducto.id, 
                              tallaProducto.talla?.talla
                            )}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No hay tallas asignadas a este producto.</p>
              <p className="text-sm">Agrega la primera talla usando el formulario de arriba.</p>
            </div>
          )}
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <button
            onClick={() => navigate('/admin/ListarProductos')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver a Productos
          </button>
          
          {tallasProducto.length > 0 && (
            <div className="text-sm text-gray-600">
              Stock total: {tallasProducto.reduce((total, tp) => total + tp.stock, 0)} unidades
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgregarTallaProducto;