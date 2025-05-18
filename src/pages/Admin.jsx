import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = () => {
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    imagen_url: '',
    estado: 'activo',
    categoria_nombre: '', // para selección en frontend
  });

  const [detalles, setDetalles] = useState([
    { marca_nombre: '', talla_nombre: '', precio: '', stock: '' }
  ]);

  const [marcas, setMarcas] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [marcasRes, tallasRes, categoriasRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/marcas', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('http://localhost:3000/api/admin/tallas', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('http://localhost:3000/api/admin/categorias', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      ]);
      setMarcas(marcasRes.data);
      setTallas(tallasRes.data);
      setCategorias(categoriasRes.data);
    };
    fetchData();
  }, []);

  const handleProductoChange = e => {
    setProducto({ ...producto, [e.target.name]: e.target.value });
  };

  const handleDetalleChange = (index, e) => {
    const newDetalles = [...detalles];
    newDetalles[index][e.target.name] = e.target.value;
    setDetalles(newDetalles);
  };

  const imagenPreview = producto.imagen_url ? (
    <img src={producto.imagen_url} alt="Vista previa" className="mb-4 max-h-64 object-contain" />
  ) : null;

  const handleSubmit = async e => {
    e.preventDefault();

    // Convertir nombres a IDs
    const marcaIdPorNombre = nombre => {
      const m = marcas.find(m => m.nombre === nombre);
      return m ? m.id_marca : null;
    };
    const tallaIdPorNombre = nombre => {
      const t = tallas.find(t => t.talla === nombre);
      return t ? t.id_talla : null;
    };
    const categoriaIdPorNombre = nombre => {
      const c = categorias.find(c => c.nombre_categoria === nombre);
      return c ? c.id_categoria : null;
    };

    // Validar categoría válida
    const categoriaId = categoriaIdPorNombre(producto.categoria_nombre);
    if (!categoriaId) {
      alert('Selecciona una categoría válida');
      return;
    }

    // Mapear detalles a IDs
    const detallesConIds = detalles.map(d => ({
      marca_id: marcaIdPorNombre(d.marca_nombre),
      talla_id: tallaIdPorNombre(d.talla_nombre),
      precio: d.precio,
      stock: d.stock,
    }));

    try {
      await axios.post('http://localhost:3000/api/admin/producto', {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        imagen_url: producto.imagen_url,
        estado: producto.estado,
        categoria_id: categoriaId,
        detalles: detallesConIds,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Producto agregado correctamente');
      // Resetear si quieres:
      setProducto({
        nombre: '',
        descripcion: '',
        imagen_url: '',
        estado: 'activo',
        categoria_nombre: '',
      });
      setDetalles([{ marca_nombre: '', talla_nombre: '', precio: '', stock: '' }]);
    } catch (err) {
      alert('Error al agregar producto: ' + err.response?.data?.error || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Agregar Producto</h2>

      <input name="nombre" placeholder="Nombre" value={producto.nombre} onChange={handleProductoChange} className="block w-full p-2 mb-2 border" required />
      <textarea name="descripcion" placeholder="Descripción" value={producto.descripcion} onChange={handleProductoChange} className="block w-full p-2 mb-2 border" required />
      
      <input name="imagen_url" placeholder="URL de imagen" value={producto.imagen_url} onChange={handleProductoChange} className="block w-full p-2 mb-2 border" />
      {imagenPreview}

      <select
        name="categoria_nombre"
        value={producto.categoria_nombre}
        onChange={handleProductoChange}
        required
        className="block w-full p-2 mb-2 border"
      >
        <option value="">Selecciona Categoría</option>
        {categorias.map(c => (
          <option key={c.id_categoria} value={c.nombre_categoria}>{c.nombre_categoria}</option>
        ))}
      </select>

      <h3 className="text-lg font-semibold mb-2">Detalles</h3>

      {detalles.map((detalle, index) => (
        <div key={index} className="mb-4 p-2 border rounded">
          <select
            name="marca_nombre"
            value={detalle.marca_nombre}
            onChange={e => handleDetalleChange(index, e)}
            required
            className="block w-full p-1 mb-1 border"
          >
            <option value="">Selecciona Marca</option>
            {marcas.map(m => (
              <option key={m.id_marca} value={m.nombre}>{m.nombre}</option>
            ))}
          </select>

          <select
            name="talla_nombre"
            value={detalle.talla_nombre}
            onChange={e => handleDetalleChange(index, e)}
            required
            className="block w-full p-1 mb-1 border"
          >
            <option value="">Selecciona Talla</option>
            {tallas.map(t => (
              <option key={t.id_talla} value={t.talla}>{t.talla}</option>
            ))}
          </select>

          <input
            name="precio"
            placeholder="Precio"
            type="number"
            min="0"
            value={detalle.precio}
            onChange={e => handleDetalleChange(index, e)}
            className="block w-full p-1 mb-1 border"
            required
          />
          <input
            name="stock"
            placeholder="Stock"
            type="number"
            min="0"
            value={detalle.stock}
            onChange={e => handleDetalleChange(index, e)}
            className="block w-full p-1 border"
            required
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setDetalles([...detalles, { marca_nombre: '', talla_nombre: '', precio: '', stock: '' }])}
        className="bg-gray-400 text-white px-3 py-1 mb-4 rounded"
      >
        Agregar Detalle
      </button>

      <button className="bg-green-600 text-white px-4 py-2 rounded">Guardar Producto</button>
    </form>
  );
};

export default Admin;
