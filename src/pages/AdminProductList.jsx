import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminProductList = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProductos = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/productos', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProductos(res.data);
    } catch (error) {
      console.error('Error al obtener productos', error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await axios.delete(`http://localhost:3000/api/admin/producto/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Producto eliminado');
      fetchProductos(); // refrescar la lista
    } catch (error) {
      alert('Error al eliminar producto: ' + error.response?.data?.error);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  if (loading) return <p className="text-center">Cargando productos...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Lista de Productos</h2>
      {productos.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Estado</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td className="p-2 border">{producto.id}</td>
                <td className="p-2 border">{producto.nombre}</td>
                <td className="p-2 border">{producto.estado}</td>
                <td className="p-2 border flex gap-2 justify-center">
                  <Link to={`/admin/editar/${producto.id}`}>
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded">Editar</button>
                  </Link>
                  <button
                    onClick={() => eliminarProducto(producto.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminProductList;
