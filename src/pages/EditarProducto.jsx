import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    imagen_url: '',
    estado: 'activo',
  });
  const [detalles, setDetalles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/admin/producto/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProducto(res.data.producto);
        setDetalles(res.data.detalles);
      } catch (err) {
        alert('Error al cargar producto');
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  const handleProductoChange = (e) => {
    setProducto({ ...producto, [e.target.name]: e.target.value });
  };

  const handleDetalleChange = (index, e) => {
    const nuevos = [...detalles];
    nuevos[index][e.target.name] = e.target.value;
    setDetalles(nuevos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/admin/producto/${id}`, {
        ...producto,
        detalles
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      alert('Producto actualizado');
      navigate('/admin/productos');
    } catch (err) {
      alert('Error al actualizar');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Editar Producto</h2>

      <input name="nombre" value={producto.nombre} onChange={handleProductoChange} placeholder="Nombre" className="w-full p-2 border mb-2" />
      <textarea name="descripcion" value={producto.descripcion} onChange={handleProductoChange} placeholder="Descripción" className="w-full p-2 border mb-2" />
      <input name="imagen_url" value={producto.imagen_url} onChange={handleProductoChange} placeholder="Imagen URL" className="w-full p-2 border mb-2" />
      
      <h3 className="font-semibold mb-2">Detalles</h3>
      {detalles.map((d, i) => (
        <div key={i} className="mb-2 border p-2 rounded">
          <input name="marca_id" value={d.marca_id} onChange={(e) => handleDetalleChange(i, e)} className="w-full mb-1 p-1 border" />
          <input name="talla_id" value={d.talla_id} onChange={(e) => handleDetalleChange(i, e)} className="w-full mb-1 p-1 border" />
          <input name="precio" value={d.precio} onChange={(e) => handleDetalleChange(i, e)} className="w-full mb-1 p-1 border" />
          <input name="stock" value={d.stock} onChange={(e) => handleDetalleChange(i, e)} className="w-full p-1 border" />
        </div>
      ))}
      <button className="bg-blue-600 text-white px-4 py-2 mt-4 rounded">Actualizar</button>
    </form>
  );
};

export default EditarProducto;
