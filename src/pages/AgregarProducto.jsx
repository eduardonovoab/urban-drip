import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import 'react-toastify/dist/ReactToastify.css';
import '../Styles/AgregarProducto.css';

const AgregarProducto = () => {

  const navigate = useNavigate();
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    imagen_url: '',
    estado: 'activo',
    categoria_id: '',
    marca_id: '',
    talla_id: '',
    precio: '',
    stock: '',
  });

  const [errores, setErrores] = useState({});

  const [categorias, setCategorias] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriasRes, tallasRes, marcasRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/categorias', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get('http://localhost:3000/api/admin/tallas', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get('http://localhost:3000/api/admin/marcas', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);
        setCategorias(categoriasRes.data);
        setTallas(tallasRes.data);
        setMarcas(marcasRes.data);
      } catch (error) {
        toast.error('Error al cargar categorías, tallas o marcas');
      }
    };
    fetchData();
  }, []);

  // Validar un campo individualmente
  const validarCampo = (name, value) => {
    let mensaje = '';

    if (!value || value.toString().trim() === '') {
      mensaje = 'Este campo es obligatorio';
    } else {
      if (name === 'precio' || name === 'stock') {
        if (isNaN(value) || Number(value) < 0) {
          mensaje = 'Debe ser un número positivo';
        }
      }
      if (name === 'imagen_url') {
        // Validación básica de URL (puede mejorarse)
        const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;
        if (value && !urlRegex.test(value)) {
          mensaje = 'Ingresa una URL válida de imagen';
        }
      }
    }

    setErrores((prev) => ({ ...prev, [name]: mensaje }));
    return mensaje === '';
  };

  // Maneja cambio y valida
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto({ ...producto, [name]: value });
    validarCampo(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos
    let valido = true;
    const nuevosErrores = {};
    for (const campo in producto) {
      const esValido = validarCampo(campo, producto[campo]);
      if (!esValido) {
        valido = false;
        nuevosErrores[campo] = errores[campo] || 'Campo inválido';
      }
    }
    setErrores(nuevosErrores);

    if (!valido) {
      toast.error('Por favor corrige los errores antes de enviar');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3000/api/admin/producto',
        {
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          imagen_url: producto.imagen_url,
          estado: producto.estado,
          categoria_id: producto.categoria_id,
          detalles: [
            {
              marca_id: producto.marca_id,
              talla_id: producto.talla_id,
              precio: producto.precio,
              stock: producto.stock,
            },
          ],
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Producto agregado correctamente');
      setProducto({
        nombre: '',
        descripcion: '',
        imagen_url: '',
        estado: 'activo',
        categoria_id: '',
        marca_id: '',
        talla_id: '',
        precio: '',
        stock: '',
      });
      setErrores({});
      navigate('/admin/listarproductos');
    } catch (error) {
      toast.error('Error al agregar el producto');
    }
  };

  return (
    <div className="agregar-producto-container">
      <h2>Agregar Producto</h2>
      <form onSubmit={handleSubmit} className="form-agregar-producto" noValidate>
        <div className="form-group">
          <label>Nombre del producto</label>
          <input
            type="text"
            name="nombre"
            value={producto.nombre}
            onChange={handleChange}
            placeholder="Nombre del producto"
          />
          {errores.nombre && <p className="error-text">{errores.nombre}</p>}
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={producto.descripcion}
            onChange={handleChange}
            placeholder="Descripción"
          />
          {errores.descripcion && <p className="error-text">{errores.descripcion}</p>}
        </div>

        <div className="form-group">
          <label>URL de imagen</label>
          <input
            type="text"
            name="imagen_url"
            value={producto.imagen_url}
            onChange={handleChange}
            placeholder="URL de imagen"
          />
          {errores.imagen_url && <p className="error-text">{errores.imagen_url}</p>}
          {producto.imagen_url && !errores.imagen_url && (
            <img
              src={producto.imagen_url}
              alt="Vista previa"
              className="imagen-preview"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}
        </div>

        <div className="form-group">
          <label>Precio</label>
          <input
            type="number"
            name="precio"
            value={producto.precio}
            onChange={handleChange}
            placeholder="Precio"
            min="0"
            step="0.01"
          />
          {errores.precio && <p className="error-text">{errores.precio}</p>}
        </div>

        <div className="form-group">
          <label>Stock</label>
          <input
            type="number"
            name="stock"
            value={producto.stock}
            onChange={handleChange}
            placeholder="Stock"
            min="0"
          />
          {errores.stock && <p className="error-text">{errores.stock}</p>}
        </div>

        <div className="form-group">
          <label>Categoría</label>
          <select
            name="categoria_id"
            value={producto.categoria_id}
            onChange={handleChange}
          >
            <option value="">Selecciona categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>
          {errores.categoria_id && <p className="error-text">{errores.categoria_id}</p>}
        </div>

        <div className="form-group">
          <label>Talla</label>
          <select
            name="talla_id"
            value={producto.talla_id}
            onChange={handleChange}
          >
            <option value="">Selecciona talla</option>
            {tallas.map((talla) => (
              <option key={talla.id_talla} value={talla.id_talla}>
                {talla.talla}
              </option>
            ))}
          </select>
          {errores.talla_id && <p className="error-text">{errores.talla_id}</p>}
        </div>

        <div className="form-group">
          <label>Marca</label>
          <select
            name="marca_id"
            value={producto.marca_id}
            onChange={handleChange}
          >
            <option value="">Selecciona marca</option>
            {marcas.map((marca) => (
              <option key={marca.id_marca} value={marca.id_marca}>
                {marca.nombre}
              </option>
            ))}
          </select>
          {errores.marca_id && <p className="error-text">{errores.marca_id}</p>}
        </div>

        <button type="submit" className="btn-guardar">
          Guardar Producto
        </button>
      </form>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default AgregarProducto;
