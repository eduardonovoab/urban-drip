import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; 
import 'react-toastify/dist/ReactToastify.css';
import '../Styles/AgregarProducto.css';

const AgregarProducto = () => {
  const navigate = useNavigate();
  
  // Estado inicial del producto
  const initialProductState = {
    nombre: '',
    descripcion: '',
    imagen_url: '',
    estado: 'activo',
    categoria_id: '',
    precio_base: '',
    marca_id: '',
    tallas: [{ talla_id: '', stock: '' }],
  };

  const [producto, setProducto] = useState(initialProductState);
  const [errores, setErrores] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verificar autenticación y cargar datos iniciales
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado. Por favor, inicia sesión.');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriasRes, tallasRes, marcasRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/categorias', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/tallas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/marcas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        
        setCategorias(categoriasRes.data);
        setTallas(tallasRes.data);
        setMarcas(marcasRes.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar categorías, tallas o marcas');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Limpiar errores específicos
  const clearError = useCallback((errorKey) => {
    setErrores(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  // Maneja cambios en campos principales del producto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo
    if (errores[name]) {
      clearError(name);
    }
  };

  // Maneja cambios en las tallas
  const handleTallaChange = (index, e) => {
    const { name, value } = e.target;
    setProducto(prev => {
      const newTallas = [...prev.tallas];
      newTallas[index] = {
        ...newTallas[index],
        [name]: value,
      };
      return {
        ...prev,
        tallas: newTallas,
      };
    });

    // Limpiar error del campo específico
    const errorKey = `talla_${index}_${name}`;
    if (errores[errorKey]) {
      clearError(errorKey);
    }

    // Si se cambió la talla, verificar duplicados en tiempo real
    if (name === 'talla_id') {
      validateDuplicateTallas(index, value);
    }
  };

  // Validar tallas duplicadas en tiempo real
  const validateDuplicateTallas = useCallback((currentIndex, selectedTallaId) => {
    if (!selectedTallaId) return;

    const isDuplicate = producto.tallas.some((talla, index) => 
      index !== currentIndex && talla.talla_id === selectedTallaId
    );

    if (isDuplicate) {
      setErrores(prev => ({
        ...prev,
        [`talla_${currentIndex}_talla_id`]: 'Esta talla ya fue agregada'
      }));
    } else {
      clearError(`talla_${currentIndex}_talla_id`);
    }
  }, [producto.tallas, clearError]);

  // Agregar nueva talla
  const handleAddTalla = () => {
    setProducto(prev => ({
      ...prev,
      tallas: [
        ...prev.tallas,
        { talla_id: '', stock: '' }
      ]
    }));
  };

  // Eliminar talla
  const handleRemoveTalla = (index) => {
    if (producto.tallas.length <= 1) {
      toast.warning('Debe haber al menos una talla');
      return;
    }
    
    setProducto(prev => ({
      ...prev,
      tallas: prev.tallas.filter((_, i) => i !== index)
    }));

    // Limpiar errores relacionados con la talla eliminada
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      Object.keys(nuevosErrores).forEach(key => {
        if (key.startsWith(`talla_${index}_`)) {
          delete nuevosErrores[key];
        }
      });
      return nuevosErrores;
    });
  };

  // Validación de URL de imagen
  const validateImageUrl = (url) => {
    if (!url.trim()) return true; // URL opcional
    const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;
    return urlRegex.test(url);
  };

  // Validación completa del formulario
  const validarFormulario = () => {
    let valido = true;
    const nuevosErrores = {};

    // Validar campos principales
    const validaciones = [
      {
        condition: !producto.nombre.trim(),
        field: 'nombre',
        message: 'El nombre es obligatorio'
      },
      {
        condition: !producto.descripcion.trim(),
        field: 'descripcion',
        message: 'La descripción es obligatoria'
      },
      {
        condition: !producto.categoria_id,
        field: 'categoria_id',
        message: 'Selecciona una categoría'
      },
      {
        condition: !producto.marca_id,
        field: 'marca_id',
        message: 'Selecciona una marca'
      },
      {
        condition: !producto.precio_base || isNaN(producto.precio_base) || Number(producto.precio_base) <= 0,
        field: 'precio_base',
        message: 'El precio base es obligatorio y debe ser mayor a 0'
      },
      {
        condition: producto.imagen_url && !validateImageUrl(producto.imagen_url),
        field: 'imagen_url',
        message: 'Ingresa una URL válida de imagen'
      }
    ];

    validaciones.forEach(({ condition, field, message }) => {
      if (condition) {
        nuevosErrores[field] = message;
        valido = false;
      }
    });

    // Validar tallas con detección de duplicados mejorada
    const tallasUsadas = new Set();
    const tallasVacias = [];

    producto.tallas.forEach((talla, index) => {
      // Validar que se haya seleccionado una talla
      if (!talla.talla_id) {
        nuevosErrores[`talla_${index}_talla_id`] = 'Selecciona una talla';
        tallasVacias.push(index);
        valido = false;
      } else {
        // Verificar tallas duplicadas
        if (tallasUsadas.has(talla.talla_id)) {
          nuevosErrores[`talla_${index}_talla_id`] = 'Esta talla ya fue agregada';
          valido = false;
        } else {
          tallasUsadas.add(talla.talla_id);
        }
      }
      
      // Validar stock
      const stockValue = Number(talla.stock);
      if (!talla.stock || isNaN(stockValue) || stockValue < 0) {
        nuevosErrores[`talla_${index}_stock`] = 'El stock debe ser un número mayor o igual a 0';
        valido = false;
      }
    });

    setErrores(nuevosErrores);
    return valido;
  };

  // Resetear formulario
  const resetForm = () => {
    setProducto(initialProductState);
    setErrores({});
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error('Por favor corrige los errores antes de enviar');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado. Por favor, inicia sesión.');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion.trim(),
        imagen_url: producto.imagen_url.trim(),
        estado: producto.estado,
        categoria_id: parseInt(producto.categoria_id),
        detalles: producto.tallas.map((talla) => ({
          marca_id: parseInt(producto.marca_id),
          talla_id: parseInt(talla.talla_id),
          precio: parseFloat(producto.precio_base),
          stock: parseInt(talla.stock),
        })),
      };

      await axios.post(
        'http://localhost:3000/api/admin/producto',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Producto agregado correctamente');
      resetForm();
      
      setTimeout(() => {
        navigate('/admin/listarproductos');
      }, 2000);

    } catch (error) {
      console.error('Error al agregar el producto:', error);
      const errorMessage = error.response?.data?.message || 'Error al agregar el producto';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Obtener tallas disponibles (excluyendo las ya seleccionadas)
  const getTallasDisponibles = (currentIndex) => {
    const tallasSeleccionadas = producto.tallas
      .map((talla, index) => index !== currentIndex ? talla.talla_id : null)
      .filter(Boolean);
    
    return tallas.filter(talla => !tallasSeleccionadas.includes(talla.id_talla.toString()));
  };

  if (loading) {
    return (
      <div className="agregar-producto-container">
        <div className="loading-spinner">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="agregar-producto-container">
      <h2>Agregar Producto</h2>
      <form onSubmit={handleSubmit} className="form-agregar-producto" noValidate>
        {/* Información básica del producto */}
        <div className="form-section">
          <h3>Información Básica</h3>
          
          <div className="form-group">
            <label>Nombre del producto *</label>
            <input
              type="text"
              name="nombre"
              value={producto.nombre}
              onChange={handleChange}
              placeholder="Nombre del producto"
              maxLength="100"
            />
            {errores.nombre && <p className="error-text">{errores.nombre}</p>}
          </div>

          <div className="form-group">
            <label>Descripción *</label>
            <textarea
              name="descripcion"
              value={producto.descripcion}
              onChange={handleChange}
              placeholder="Descripción del producto"
              rows="4"
              maxLength="500"
            />
            {errores.descripcion && <p className="error-text">{errores.descripcion}</p>}
            <small className="char-counter">
              {producto.descripcion.length}/500 caracteres
            </small>
          </div>

          <div className="form-group">
            <label>URL de imagen</label>
            <input
              type="url"
              name="imagen_url"
              value={producto.imagen_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {errores.imagen_url && <p className="error-text">{errores.imagen_url}</p>}
            {producto.imagen_url && !errores.imagen_url && (
              <div className="imagen-preview-container">
                <img
                  src={producto.imagen_url}
                  alt="Vista previa"
                  className="imagen-preview"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    setErrores(prev => ({
                      ...prev,
                      imagen_url: 'No se pudo cargar la imagen desde esta URL'
                    }));
                  }}
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    clearError('imagen_url');
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estado</label>
              <select name="estado" value={producto.estado} onChange={handleChange}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Categoría *</label>
              <select
                name="categoria_id"
                value={producto.categoria_id}
                onChange={handleChange}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre_categoria}
                  </option>
                ))}
              </select>
              {errores.categoria_id && <p className="error-text">{errores.categoria_id}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Marca *</label>
              <select
                name="marca_id"
                value={producto.marca_id}
                onChange={handleChange}
              >
                <option value="">Selecciona una marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id_marca} value={marca.id_marca}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
              {errores.marca_id && <p className="error-text">{errores.marca_id}</p>}
            </div>

            <div className="form-group">
              <label>Precio Base *</label>
              <input
                type="number"
                name="precio_base"
                value={producto.precio_base}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errores.precio_base && <p className="error-text">{errores.precio_base}</p>}
            </div>
          </div>
        </div>

        {/* Sección de tallas */}
        <div className="form-section">
          <div className="tallas-header">
            <h3>Tallas y Stock *</h3>
            <button 
              type="button" 
              onClick={handleAddTalla}
              className="btn-add-talla"
              disabled={loading}
            >
              + Agregar Talla
            </button>
          </div>
          
          <div className="tallas-grid">
            {producto.tallas.map((talla, index) => (
              <div key={index} className="talla-container">
                <div className="talla-header">
                  <h4>Talla {index + 1}</h4>
                  {producto.tallas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTalla(index)}
                      className="btn-remove-talla"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="talla-fields">
                  <div className="form-group">
                    <label>Talla *</label>
                    <select
                      name="talla_id"
                      value={talla.talla_id}
                      onChange={(e) => handleTallaChange(index, e)}
                    >
                      <option value="">Selecciona una talla</option>
                      {getTallasDisponibles(index).map((tallaOption) => (
                        <option key={tallaOption.id_talla} value={tallaOption.id_talla}>
                          {tallaOption.talla}
                        </option>
                      ))}
                      {/* Mostrar la talla actual si ya está seleccionada */}
                      {talla.talla_id && !getTallasDisponibles(index).find(t => t.id_talla.toString() === talla.talla_id) && (
                        <option value={talla.talla_id}>
                          {tallas.find(t => t.id_talla.toString() === talla.talla_id)?.talla || 'Talla seleccionada'}
                        </option>
                      )}
                    </select>
                    {errores[`talla_${index}_talla_id`] && (
                      <p className="error-text">{errores[`talla_${index}_talla_id`]}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      value={talla.stock}
                      onChange={(e) => handleTallaChange(index, e)}
                      placeholder="0"
                      min="0"
                    />
                    {errores[`talla_${index}_stock`] && (
                      <p className="error-text">{errores[`talla_${index}_stock`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={resetForm}
            className="btn-secondary"
            disabled={loading}
          >
            Limpiar Formulario
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
      
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

export default AgregarProducto;