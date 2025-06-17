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
    categoria_id: '',
    marca_id: '',
    precio_base: '',
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
      toast.error('❌ No estás autenticado. Redirigiendo al login...', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => navigate('/login'), 2000);
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
        
        console.log('✅ Datos cargados exitosamente');
        
        setCategorias(categoriasRes.data);
        setTallas(tallasRes.data);
        setMarcas(marcasRes.data);

        // Notificación de carga exitosa
        toast.success('📋 Datos cargados correctamente', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          toast.error('🔒 Sesión expirada. Redirigiendo al login...', {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setTimeout(() => navigate('/login'), 2000);
        } else {
          toast.error('❌ Error al cargar categorías, tallas o marcas', {
            position: "top-center",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
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

    const errorKey = `talla_${index}_${name}`;
    if (errores[errorKey]) {
      clearError(errorKey);
    }

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

    toast.info('➕ Nueva talla agregada', {
      position: "bottom-right",
      autoClose: 1500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
    });
  };

  // Eliminar talla
  const handleRemoveTalla = (index) => {
    if (producto.tallas.length <= 1) {
      toast.warning('⚠️ Debe haber al menos una talla', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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

    toast.info('🗑️ Talla eliminada', {
      position: "bottom-right",
      autoClose: 1500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
    });
  };

  // Validación de URL de imagen
  const validateImageUrl = (url) => {
    if (!url.trim()) return true;
    try {
      new URL(url);
      const urlRegex = /^https?:\/\/.*\.(png|jpg|jpeg|gif|svg|webp)(\?.*)?$/i;
      return urlRegex.test(url);
    } catch {
      return false;
    }
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

    // Validar tallas
    const tallasUsadas = new Set();

    producto.tallas.forEach((talla, index) => {
      if (!talla.talla_id) {
        nuevosErrores[`talla_${index}_talla_id`] = 'Selecciona una talla';
        valido = false;
      } else {
        if (tallasUsadas.has(talla.talla_id)) {
          nuevosErrores[`talla_${index}_talla_id`] = 'Esta talla ya fue agregada';
          valido = false;
        } else {
          tallasUsadas.add(talla.talla_id);
        }
      }
      
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
    
    toast.success('🧹 Formulario limpiado correctamente', {
      position: "bottom-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  // ENVIAR FORMULARIO - MEJORADO CON NOTIFICACIONES DETALLADAS
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error('❌ Por favor corrige los errores antes de enviar', {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Scroll al primer error
      const firstErrorElement = document.querySelector('.error-text');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('🔒 No estás autenticado. Redirigiendo al login...', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);

    // Notificación de inicio de guardado
    const loadingToast = toast.loading('💾 Guardando producto...', {
      position: "top-center",
    });

    try {
      const payload = {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion.trim(),
        imagen_url: producto.imagen_url.trim() || '',
        categoria_id: parseInt(producto.categoria_id),
        detalles: producto.tallas.map((talla) => ({
          marca_id: parseInt(producto.marca_id),
          talla_id: parseInt(talla.talla_id),
          precio: parseFloat(producto.precio_base),
          stock: parseInt(talla.stock),
        })),
      };

      console.log('📤 Enviando payload:', payload);

      const response = await axios.post(
        'http://localhost:3000/api/admin/producto',
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Respuesta del servidor:', response.data);

      // Actualizar el toast de loading a éxito
      toast.update(loadingToast, {
        render: '✅ ¡Producto creado exitosamente!',
        type: 'success',
        isLoading: false,
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Mostrar información del producto creado
      toast.success(`🎉 "${producto.nombre}" agregado con ${producto.tallas.length} variante(s)`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Limpiar formulario
      resetForm();
      
      // Notificación de redirección
      setTimeout(() => {
        toast.info('📄 Redirigiendo a la lista de productos...', {
          position: "bottom-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
        });
      }, 1000);

      // Redirigir a la lista de productos
      setTimeout(() => {
        navigate('/admin/ListarProductos'); // Cambiado para coincidir con tu ruta
      }, 3000);

    } catch (error) {
      console.error('❌ Error al agregar el producto:', error);
      
      // Actualizar el toast de loading a error
      toast.update(loadingToast, {
        render: '❌ Error al guardar el producto',
        type: 'error',
        isLoading: false,
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        toast.error('🔒 Sesión expirada. Redirigiendo al login...', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      let errorMessage = 'Error desconocido al agregar el producto';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Error de red: ${error.message}`;
      }
      
      // Mostrar error específico
      toast.error(`🚨 ${errorMessage}`, {
        position: "top-center",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

    } finally {
      setLoading(false);
    }
  };

  // Obtener tallas disponibles
  const getTallasDisponibles = (currentIndex) => {
    const tallasSeleccionadas = producto.tallas
      .map((talla, index) => index !== currentIndex ? talla.talla_id : null)
      .filter(Boolean);
    
    return tallas.filter(talla => !tallasSeleccionadas.includes(talla.id_talla.toString()));
  };

  if (loading) {
    return (
      <div className="agregar-producto-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando datos necesarios...</p>
        </div>
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
              maxLength="50"
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
              maxLength="100"
            />
            {errores.descripcion && <p className="error-text">{errores.descripcion}</p>}
            <small className="char-counter">
              {producto.descripcion.length}/100 caracteres
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
                    {marca.nombre_marca}
                  </option>
                ))}
              </select>
              {errores.marca_id && <p className="error-text">{errores.marca_id}</p>}
            </div>
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
                          {tallaOption.nombre_talla}
                        </option>
                      ))}
                      {talla.talla_id && !getTallasDisponibles(index).find(t => t.id_talla.toString() === talla.talla_id) && (
                        <option value={talla.talla_id}>
                          {tallas.find(t => t.id_talla.toString() === talla.talla_id)?.nombre_talla || 'Talla seleccionada'}
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
      
      {/* TOASTCONTAINER MEJORADO */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="custom-toast-container"
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        progressClassName="custom-progress-bar"
        limit={5} // Máximo 5 toasts visibles al mismo tiempo
      />
    </div>
  );
};

export default AgregarProducto;