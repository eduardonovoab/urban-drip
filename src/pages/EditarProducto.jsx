import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import '../styles/EditarProducto.css';

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    imagen_url: '',
    estado: 'activo',
    categoria_id: '',
    detalles: [{ marca_id: '', talla_id: '', precio: '', stock: '' }],
  });
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado. Por favor, inicia sesión.');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Cargar categorías, marcas y tallas
        const [categoriasRes, marcasRes, tallasRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/categorias', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/marcas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/tallas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCategorias(categoriasRes.data);
        setMarcas(marcasRes.data);
        setTallas(tallasRes.data);

        // Cargar producto específico
        const response = await axios.get(`http://localhost:3000/api/admin/producto/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const prod = response.data;

        // Validar estructura de detalles
        if (!Array.isArray(prod.detalles) || prod.detalles.length === 0) {
          prod.detalles = [{ marca_id: '', talla_id: '', precio: '', stock: '' }];
        }

        setProducto({
          nombre: prod.nombre || '',
          descripcion: prod.descripcion || '',
          imagen_url: prod.imagen_url || '',
          estado: prod.estado || 'activo',
          categoria_id: prod.categoria_id || '',
          detalles: prod.detalles.map((detalle) => ({
            marca_id: detalle.marca_id || '',
            talla_id: detalle.talla_id || '',
            precio: detalle.precio || '',
            stock: detalle.stock || '',
          })),
        });
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar los datos del producto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    setProducto((prev) => {
      const newDetalles = [...prev.detalles];
      newDetalles[index] = {
        ...newDetalles[index],
        [name]: value,
      };
      return {
        ...prev,
        detalles: newDetalles,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado. Por favor, inicia sesión.');
      navigate('/login');
      return;
    }

    // Validaciones
    if (!producto.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }
    if (!producto.descripcion.trim()) {
      toast.error('La descripción del producto es obligatoria');
      return;
    }
    if (!producto.categoria_id) {
      toast.error('Debes seleccionar una categoría');
      return;
    }

    for (let i = 0; i < producto.detalles.length; i++) {
      const detalle = producto.detalles[i];
      if (!detalle.marca_id || !detalle.talla_id || !detalle.precio || !detalle.stock) {
        toast.error(`Completa todos los campos del detalle ${i + 1}`);
        return;
      }
      if (parseFloat(detalle.precio) <= 0) {
        toast.error(`El precio del detalle ${i + 1} debe ser mayor a 0`);
        return;
      }
      if (parseInt(detalle.stock) < 0) {
        toast.error(`El stock del detalle ${i + 1} no puede ser negativo`);
        return;
      }
    }

    try {
      await axios.put(
        `http://localhost:3000/api/admin/producto/${id}`,
        {
          nombre: producto.nombre.trim(),
          descripcion: producto.descripcion.trim(),
          imagen_url: producto.imagen_url.trim(),
          estado: producto.estado,
          categoria_id: parseInt(producto.categoria_id),
          detalles: producto.detalles.map((detalle) => ({
            marca_id: parseInt(detalle.marca_id),
            talla_id: parseInt(detalle.talla_id),
            precio: parseFloat(detalle.precio),
            stock: parseInt(detalle.stock),
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Producto actualizado con éxito');
      setTimeout(() => {
        navigate('/admin/ListarProductos');
      }, 2000);
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el producto';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="editar-producto-container" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Cargando datos del producto...</p>
      </div>
    );
  }

  return (
    <div className="editar-producto-container">
      <h2>Editar Producto</h2>
      <form onSubmit={handleSubmit} className="formulario-editar-producto">
        <div className="input-container">
          <label>Nombre del Producto *</label>
          <input
            type="text"
            name="nombre"
            value={producto.nombre}
            onChange={handleChange}
            placeholder="Nombre del Producto"
            required
          />
        </div>

        <div className="input-container">
          <label>Descripción *</label>
          <textarea
            name="descripcion"
            value={producto.descripcion}
            onChange={handleChange}
            placeholder="Descripción"
            required
          />
        </div>

        <div className="input-container">
          <label>URL de Imagen</label>
          <input
            type="text"
            name="imagen_url"
            value={producto.imagen_url}
            onChange={handleChange}
            placeholder="URL de Imagen"
          />
        </div>

        <div className="input-container">
          <label>Estado</label>
          <select name="estado" value={producto.estado} onChange={handleChange} required>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div className="input-container">
          <label>Categoría *</label>
          <select
            name="categoria_id"
            value={producto.categoria_id}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="detalles-section">
          <h3>Detalles del Producto</h3>
          {producto.detalles.map((detalle, index) => (
            <div key={index} className="detalles-container">
              <h4>Detalle {index + 1}</h4>

              <div className="input-container">
                <label>Marca *</label>
                <select
                  name="marca_id"
                  value={detalle.marca_id}
                  onChange={(e) => handleDetalleChange(index, e)}
                  required
                >
                  <option value="">Selecciona una marca</option>
                  {marcas.map((marca) => (
                    <option key={marca.id_marca} value={marca.id_marca}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-container">
                <label>Talla *</label>
                <select
                  name="talla_id"
                  value={detalle.talla_id}
                  onChange={(e) => handleDetalleChange(index, e)}
                  required
                >
                  <option value="">Selecciona una talla</option>
                  {tallas.map((talla) => (
                    <option key={talla.id_talla} value={talla.id_talla}>
                      {talla.talla}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-container">
                <label>Precio *</label>
                <input
                  type="number"
                  name="precio"
                  value={detalle.precio}
                  onChange={(e) => handleDetalleChange(index, e)}
                  placeholder="Precio"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="input-container">
                <label>Stock *</label>
                <input
                  type="number"
                  name="stock"
                  value={detalle.stock}
                  onChange={(e) => handleDetalleChange(index, e)}
                  placeholder="Stock"
                  min="0"
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="btn-submit">
          Actualizar Producto
        </button>
      </form>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default EditarProducto;
