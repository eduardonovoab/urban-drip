import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminProducts = () => {
    const [productos, setProductos] = useState([]);

    const fetchProductos = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/admin/productos', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setProductos(res.data);
        } catch (err) {
            console.error('Error al cargar productos', err);
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
            fetchProductos();
        } catch (err) {
            alert('Error al eliminar producto');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Gestión de Productos</h2>
            {productos.length === 0 ? (
                <p>No hay productos registrados.</p>
            ) : (
                <table className="w-full border">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1">ID</th>
                            <th className="border px-2 py-1">Nombre</th>
                            <th className="border px-2 py-1">Descripción</th>
                            <th className="border px-2 py-1">Estado</th>
                            <th className="border px-2 py-1">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((prod) => (
                            <tr key={prod.id}>
                                <td className="border px-2 py-1">{prod.id}</td>
                                <td className="border px-2 py-1">{prod.nombre}</td>
                                <td className="border px-2 py-1">{prod.descripcion}</td>
                                <td className="border px-2 py-1">{prod.estado}</td>
                                <td className="border px-2 py-1">
                                    {/* Puedes agregar botón de editar aquí */}
                                    <button
                                        onClick={() => navigate(`/admin/producto/editar/${prod.id}`)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        onClick={() => eliminarProducto(prod.id)}
                                        className="bg-red-600 text-white px-3 py-1 rounded"
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

export default AdminProducts;
