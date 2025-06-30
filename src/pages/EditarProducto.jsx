import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import '../Styles/EditarProducto.css';

const EditarProducto = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Estado inicial del producto
  const initialProductState = {
    nombre: '',
    descripcion: '',
    imagen_url: '',
    categoria_id: '',
    marca_id: '',
    precio_base: '',
    tallas: [{ 
      id_detalle_producto: null, 
      talla_id: '', 
      stock_actual: 0,
      stock_agregar: 0,
      es_existente: false
    }],
  };

  const [producto, setProducto] = useState(initialProductState);
  const [productoCargado, setProductoCargado] = useState(false);
  const [errores, setErrores] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tallasEliminadas, setTallasEliminadas] = useState([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [datosConfirmacion, setDatosConfirmacion] = useState(null);

  // Función para procesar datos del producto con detalles
  const procesarProductoConDetalles = (productosData) => {
    if (!Array.isArray(productosData) || productosData.length === 0) {
      throw new Error('No se encontraron datos del producto');
    }

    const primerElemento = productosData[0];
    
    console.log('🔍 Procesando datos del producto:', {
      totalRegistros: productosData.length,
      primerElemento: primerElemento,
      todosLosRegistros: productosData
    });

    const productoProcesado = {
      id_producto: primerElemento.id_producto,
      nombre: primerElemento.nombre_producto || '',
      descripcion: primerElemento.descripcion || '',
      imagen_url: primerElemento.imagen_url || '',
      categoria_id: primerElemento.categoria_id_categoria ? String(primerElemento.categoria_id_categoria) : '',
      nombre_categoria: primerElemento.nombre_categoria || '',
      estado_id: primerElemento.estado_id,
      nombre_estado: primerElemento.nombre_estado || '',
      detalles: []
    };

    productosData.forEach((registro, index) => {
      console.log(`📝 Procesando detalle ${index + 1}:`, {
        id_detalle: registro.id_detalle,
        marca: registro.nombre_marca,
        talla: registro.nombre_talla,
        precio: registro.precio,
        stock: registro.stock
      });

      productoProcesado.detalles.push({
        id_detalle_producto: registro.id_detalle,
        marca_id_marca: registro.marca_id_marca,
        nombre_marca: registro.nombre_marca,
        talla_id_talla: registro.talla_id_talla,
        nombre_talla: registro.nombre_talla,
        precio: registro.precio,
        stock: registro.stock,
        estado_detalle: registro.estado_detalle || registro.estado
      });
    });

    console.log('✅ Producto procesado:', productoProcesado);
    return productoProcesado;
  };

  // Cargar datos iniciales
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No estás autenticado. Por favor, inicia sesión.');
      navigate('/login');
      return;
    }

    if (!id) {
      toast.error('ID de producto no válido');
      navigate('/admin/ListarProductos');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('🚀 Iniciando carga de datos para producto ID:', id);

        const [categoriasRes, tallasRes, marcasRes, productoRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/categorias', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/tallas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/marcas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:3000/api/admin/producto/${id}/edicion`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        console.log('📦 Respuestas recibidas:', {
          categorias: categoriasRes.data?.length || 0,
          tallas: tallasRes.data?.length || 0,
          marcas: marcasRes.data?.length || 0,
          producto: productoRes.data
        });

        setCategorias(categoriasRes.data || []);
        setTallas(tallasRes.data || []);
        setMarcas(marcasRes.data || []);

        let productData;
        
        if (Array.isArray(productoRes.data)) {
          if (productoRes.data.length === 0) {
            throw new Error('Producto no encontrado');
          }
          productData = procesarProductoConDetalles(productoRes.data);
        } else if (productoRes.data && typeof productoRes.data === 'object') {
          productData = productoRes.data;
          console.log('📋 Datos del producto (objeto):', productData);
        } else {
          throw new Error('Formato de respuesta no válido');
        }

        if (productData.detalles && productData.detalles.length > 0) {
          const primerDetalle = productData.detalles[0];

          console.log('🎯 Configurando producto con detalles:', {
            nombre: productData.nombre,
            categoria_id: productData.categoria_id,
            primer_detalle: primerDetalle,
            total_detalles: productData.detalles.length
          });

          setProducto({
            nombre: productData.nombre || '',
            descripcion: productData.descripcion || '',
            imagen_url: productData.imagen_url || '',
            categoria_id: productData.categoria_id || '',
            marca_id: primerDetalle.marca_id_marca ? String(primerDetalle.marca_id_marca) : '',
            precio_base: primerDetalle.precio ? String(primerDetalle.precio) : '',
            tallas: productData.detalles.map(detalle => ({
              id_detalle_producto: detalle.id_detalle_producto,
              talla_id: detalle.talla_id_talla ? String(detalle.talla_id_talla) : '',
              stock_actual: parseInt(detalle.stock) || 0,
              stock_agregar: 0,
              es_existente: true,
              nombre_talla: detalle.nombre_talla || 'Sin talla',
              nombre_marca: detalle.nombre_marca || 'Sin marca'
            }))
          });
        } else {
          console.log('⚠️ Producto sin detalles, configurando valores por defecto');
          setProducto({
            nombre: productData.nombre || '',
            descripcion: productData.descripcion || '',
            imagen_url: productData.imagen_url || '',
            categoria_id: productData.categoria_id || '',
            marca_id: '',
            precio_base: '',
            tallas: [{ 
              id_detalle_producto: null, 
              talla_id: '', 
              stock_actual: 0,
              stock_agregar: 0,
              es_existente: false,
              nombre_talla: 'Sin talla' 
            }]
          });
        }

        console.log('✅ Producto configurado correctamente');
        setProductoCargado(true);

      } catch (error) {
        console.error('❌ Error completo:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });

        if (error.response?.status === 404) {
          toast.error('Producto no encontrado');
          navigate('/admin/ListarProductos');
          return;
        }

        const errorMessage = error.message || 'Error al cargar los datos del producto';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, id]);

  // Limpiar errores específicos
  const clearError = useCallback((errorKey) => {
    setErrores(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  // Manejar cambios en campos principales
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({ ...prev, [name]: value }));

    if (errores[name]) {
      clearError(name);
    }
  };

  // Manejar cambios en tallas - MODIFICADO para nueva lógica
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

  // Validar tallas duplicadas
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

  // Agregar talla
  const handleAddTalla = () => {
    setProducto(prev => ({
      ...prev,
      tallas: [
        ...prev.tallas,
        { 
          id_detalle_producto: null, 
          talla_id: '', 
          stock_actual: 0,
          stock_agregar: 0,
          es_existente: false
        }
      ]
    }));
  };

  // Eliminar talla
  const handleRemoveTalla = (index) => {
    if (producto.tallas.length <= 1) {
      toast.warning('Debe haber al menos una talla');
      return;
    }

    const tallaAEliminar = producto.tallas[index];

    if (tallaAEliminar.id_detalle_producto) {
      setTallasEliminadas(prev => [...prev, tallaAEliminar.id_detalle_producto]);
    }

    setProducto(prev => ({
      ...prev,
      tallas: prev.tallas.filter((_, i) => i !== index)
    }));

    // Limpiar errores de la talla eliminada
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      Object.keys(nuevosErrores).forEach(key => {
        if (key.startsWith(`talla_${index}_`)) {
          delete nuevosErrores[key];
        }
      });
      Object.keys(nuevosErrores).forEach(key => {
        if (key.startsWith('talla_')) {
          const parts = key.split('_');
          const tallaIndex = parseInt(parts[1]);
          if (tallaIndex > index) {
            const newKey = `talla_${tallaIndex - 1}_${parts[2]}`;
            nuevosErrores[newKey] = nuevosErrores[key];
            delete nuevosErrores[key];
          }
        }
      });
      return nuevosErrores;
    });
  };

  // Calcular stock total para una talla
  const calcularStockTotal = (talla) => {
    const stockActual = parseInt(talla.stock_actual) || 0;
    const stockAgregar = parseInt(talla.stock_agregar) || 0;
    return stockActual + stockAgregar;
  };

  // Validar URL de imagen
  const validateImageUrl = (url) => {
    if (!url.trim()) return true;
    const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;
    return urlRegex.test(url);
  };

  // Validar formulario completo - MODIFICADO para nueva lógica
  const validarFormulario = () => {
    let valido = true;
    const nuevosErrores = {};

    // Validar campos principales
    if (!producto.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
      valido = false;
    }

    if (!producto.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
      valido = false;
    }

    if (!producto.categoria_id) {
      nuevosErrores.categoria_id = 'Selecciona una categoría';
      valido = false;
    }

    if (!producto.marca_id) {
      nuevosErrores.marca_id = 'Selecciona una marca';
      valido = false;
    }

    if (!producto.precio_base || isNaN(producto.precio_base) || Number(producto.precio_base) <= 0) {
      nuevosErrores.precio_base = 'El precio base es obligatorio y debe ser mayor a 0';
      valido = false;
    }

    if (producto.imagen_url && !validateImageUrl(producto.imagen_url)) {
      nuevosErrores.imagen_url = 'Ingresa una URL válida de imagen';
      valido = false;
    }

    // Validar tallas - NUEVA LÓGICA
    const tallasUsadas = new Set();
    producto.tallas.forEach((talla, index) => {
      if (!talla.talla_id) {
        nuevosErrores[`talla_${index}_talla_id`] = 'Selecciona una talla';
        valido = false;
      } else if (tallasUsadas.has(talla.talla_id)) {
        nuevosErrores[`talla_${index}_talla_id`] = 'Esta talla ya fue agregada';
        valido = false;
      } else {
        tallasUsadas.add(talla.talla_id);
      }

      // Para tallas nuevas, validar que tengan stock
      if (!talla.es_existente) {
        const stockAgregar = Number(talla.stock_agregar);
        if (talla.stock_agregar === '' || isNaN(stockAgregar) || stockAgregar < 0) {
          nuevosErrores[`talla_${index}_stock_agregar`] = 'El stock debe ser un número mayor o igual a 0';
          valido = false;
        }
      } else {
        // Para tallas existentes, validar stock a agregar si se especifica
        if (talla.stock_agregar !== '' && talla.stock_agregar !== 0) {
          const stockAgregar = Number(talla.stock_agregar);
          if (isNaN(stockAgregar) || stockAgregar < 0) {
            nuevosErrores[`talla_${index}_stock_agregar`] = 'El stock a agregar debe ser un número mayor o igual a 0';
            valido = false;
          }
        }
      }
    });

    setErrores(nuevosErrores);
    return valido;
  };

  // Mostrar alerta de confirmación
  const prepararConfirmacion  = () => {
    // Preparar información del resumen para mostrar en la confirmación
    const tallasResumen = producto.tallas.map(talla => {
      const nombreTalla = getNombreTalla(talla.talla_id);
      if (talla.es_existente) {
        const stockTotal = calcularStockTotal(talla);
        const stockAgregar = parseInt(talla.stock_agregar) || 0;
        return `• ${nombreTalla}: ${talla.stock_actual} → ${stockTotal} unidades${stockAgregar > 0 ? ` (+${stockAgregar})` : ''}`;
      } else {
        return `• ${nombreTalla}: ${talla.stock_agregar || 0} unidades (nueva)`;
      }
    }).join('\n');

    const mensaje = `¿Estás seguro que quieres actualizar este producto?

📦 Producto: ${producto.nombre}
🏷️ Categoría: ${getNombreCategoria(producto.categoria_id)}
🔖 Marca: ${getNombreMarca(producto.marca_id)}
💰 Precio: ${producto.precio_base}

📏 Tallas y Stock:
${tallasResumen}

Esta acción actualizará permanentemente la información del producto.`;

    if (window.confirm(mensaje)) {
      procesarActualizacion();
    }
  };

  // Enviar formulario - MODIFICADO para nueva lógica
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

    // Mostrar confirmación antes de proceder
    prepararConfirmacion();
  };

  // Función separada para procesar la actualización
  const procesarActualizacion = async () => {
    setLoading(true);

    try {
      console.log('💾 Iniciando actualización del producto...');

      // PASO 1: Actualizar datos básicos
      const datosBasicos = {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion.trim(),
        imagen_url: producto.imagen_url.trim() || '',
        categoria_id: parseInt(producto.categoria_id)
      };

      console.log('📝 Actualizando datos básicos:', datosBasicos);

      await axios.put(
        `http://localhost:3000/api/admin/producto/${id}/datos-basicos`,
        datosBasicos,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // PASO 2: Eliminar detalles marcados para eliminación
      if (tallasEliminadas.length > 0) {
        console.log('🗑️ Eliminando detalles:', tallasEliminadas);
        await Promise.all(
          tallasEliminadas.map(detalleId =>
            axios.delete(
              `http://localhost:3000/api/admin/producto-detalle/${detalleId}`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            )
          )
        );
      }

      // PASO 3: Procesar detalles existentes y nuevos - NUEVA LÓGICA
      const detallesActualizados = [];
      const detallesNuevos = [];

      producto.tallas.forEach((talla) => {
        if (talla.es_existente) {
          // Talla existente - calcular nuevo stock total
          const stockTotal = calcularStockTotal(talla);
          
          const detalle = {
            id_detalle_producto: talla.id_detalle_producto,
            marca_id: parseInt(producto.marca_id),
            talla_id: parseInt(talla.talla_id),
            precio: parseFloat(producto.precio_base),
            stock: stockTotal, // Stock total (actual + agregado)
          };
          
          detallesActualizados.push(detalle);
          
          console.log(`📊 Talla existente ${talla.nombre_talla}:`, {
            stock_anterior: talla.stock_actual,
            stock_agregar: talla.stock_agregar || 0,
            stock_total: stockTotal
          });
        } else {
          // Talla nueva
          const detalle = {
            producto_id: parseInt(id),
            marca_id: parseInt(producto.marca_id),
            talla_id: parseInt(talla.talla_id),
            precio: parseFloat(producto.precio_base),
            stock: parseInt(talla.stock_agregar) || 0,
          };
          
          detallesNuevos.push(detalle);
          
          console.log(`➕ Talla nueva ${talla.nombre_talla}:`, {
            stock_inicial: detalle.stock
          });
        }
      });

      console.log('🔄 Detalles a actualizar:', detallesActualizados);
      console.log('➕ Detalles nuevos:', detallesNuevos);

      // Actualizar detalles existentes
      if (detallesActualizados.length > 0) {
        await Promise.all(
          detallesActualizados.map(detalle =>
            axios.put(
              `http://localhost:3000/api/admin/producto-detalle/${detalle.id_detalle_producto}`,
              {
                marca_id: detalle.marca_id,
                talla_id: detalle.talla_id,
                precio: detalle.precio,
                stock: detalle.stock
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            )
          )
        );
      }

      // Crear nuevos detalles
      if (detallesNuevos.length > 0) {
        await Promise.all(
          detallesNuevos.map(detalle =>
            axios.post(
              `http://localhost:3000/api/admin/producto-detalle`,
              detalle,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            )
          )
        );
      }

      // PASO 4: Actualizar estados
      const estadoActualizacion = {
        estado_producto_id: 1, // Activo
        descripcion_cb_estado: `Producto actualizado: ${new Date().toLocaleString()}`,
      };

      await axios.post(
        `http://localhost:3000/api/admin/producto/${id}/actualizar-estados`,
        estadoActualizacion,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      console.log('✅ Producto actualizado correctamente');
      toast.success('¡Producto actualizado correctamente!', {
        autoClose: 2000,
        icon: '✅'
      });

      setTimeout(() => {
        navigate('/admin/ListarProductos');
      }, 2500);

    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);

      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        'Error al actualizar el producto';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Obtener tallas disponibles (incluyendo la ya seleccionada)
  const getTallasDisponibles = (currentIndex) => {
    const tallasSeleccionadas = producto.tallas
      .map((talla, index) => index !== currentIndex ? talla.talla_id : null)
      .filter(Boolean);

    const tallasDisponibles = tallas.filter(talla => !tallasSeleccionadas.includes(talla.id_talla.toString()));

    const tallaActual = producto.tallas[currentIndex];
    if (tallaActual?.talla_id && !tallasDisponibles.find(t => t.id_talla.toString() === tallaActual.talla_id)) {
      const tallaSeleccionada = tallas.find(t => t.id_talla.toString() === tallaActual.talla_id);
      if (tallaSeleccionada) {
        tallasDisponibles.push(tallaSeleccionada);
      }
    }

    return tallasDisponibles;
  };

  // Funciones auxiliares para nombres
  const getNombreCategoria = (categoriaId) => {
    if (!categoriaId) return 'Sin categoría';
    const categoria = categorias.find(cat =>
      cat.id_categoria && cat.id_categoria.toString() === categoriaId.toString()
    );
    return categoria ? categoria.nombre_categoria : 'Sin categoría';
  };

  const getNombreMarca = (marcaId) => {
    if (!marcaId) return 'Sin marca';
    const marca = marcas.find(m =>
      m.id_marca && m.id_marca.toString() === marcaId.toString()
    );
    return marca ? marca.nombre_marca : 'Sin marca';
  };

  const getNombreTalla = (tallaId) => {
    if (!tallaId) return 'Sin talla';
    const talla = tallas.find(t =>
      t.id_talla && t.id_talla.toString() === tallaId.toString()
    );
    return talla ? talla.nombre_talla : 'Sin talla';
  };

  if (loading || !productoCargado) {
    return (
      <div className="agregar-producto-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agregar-producto-container">
      <div className="header-section">
        <h2>Editar Producto</h2>
        <p className="subtitle">Modifica la información del producto</p>
      </div>

      <form onSubmit={handleSubmit} className="form-agregar-producto" noValidate>
        {/* Información básica */}
        <div className="form-section">
          <h3>Información Básica</h3>

          <div className="form-group">
            <label>Nombre del producto *</label>
            <input
              type="text"
              name="nombre"
              value={producto.nombre}
              onChange={handleChange}
              placeholder="Ingresa el nombre del producto"
              maxLength="50"
              className={errores.nombre ? 'error' : ''}
            />
            {errores.nombre && <p className="error-text">{errores.nombre}</p>}
          </div>

          <div className="form-group">
            <label>Descripción *</label>
            <textarea
              name="descripcion"
              value={producto.descripcion}
              onChange={handleChange}
              placeholder="Describe las características del producto"
              rows="4"
              maxLength="100"
              className={errores.descripcion ? 'error' : ''}
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
              className={errores.imagen_url ? 'error' : ''}
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
                className={errores.categoria_id ? 'error' : ''}
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
                className={errores.marca_id ? 'error' : ''}
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
            <div className="input-with-icon">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                name="precio_base"
                value={producto.precio_base}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={errores.precio_base ? 'error' : ''}
              />
            </div>
            {errores.precio_base && <p className="error-text">{errores.precio_base}</p>}
          </div>
        </div>

        {/* Sección de tallas - NUEVA LÓGICA */}
        <div className="form-section">
          <div className="tallas-header">
            <h3>Tallas y Stock *</h3>
            <button
              type="button"
              onClick={handleAddTalla}
              className="btn-add-talla"
              disabled={loading}
            >
              <span>+</span> Agregar Talla
            </button>
          </div>

          <div className="tallas-grid">
            {producto.tallas.map((talla, index) => (
              <div key={index} className="talla-container">
                <div className="talla-header">
                  <h4>
                    Talla {index + 1}
                    {talla.es_existente ? (
                      <span className="talla-badge existing">Existente</span>
                    ) : (
                      <span className="talla-badge new">Nueva</span>
                    )}
                  </h4>
                  {producto.tallas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTalla(index)}
                      className="btn-remove-talla"
                      disabled={loading}
                      title="Eliminar talla"
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
                      className={errores[`talla_${index}_talla_id`] ? 'error' : ''}
                    >
                      <option value="">Selecciona una talla</option>
                      {getTallasDisponibles(index).map((tallaOption) => (
                        <option key={tallaOption.id_talla} value={tallaOption.id_talla}>
                          {tallaOption.nombre_talla}
                        </option>
                      ))}
                    </select>
                    {errores[`talla_${index}_talla_id`] && (
                      <p className="error-text">{errores[`talla_${index}_talla_id`]}</p>
                    )}
                  </div>

                  {/* NUEVA LÓGICA DE STOCK */}
                  {talla.es_existente ? (
                    // Talla existente - mostrar stock actual como solo lectura
                    <>
                      <div className="form-group">
                        <label>Stock Actual</label>
                        <input
                          type="number"
                          value={talla.stock_actual}
                          readOnly
                          className="readonly-input"
                          style={{
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            cursor: 'not-allowed'
                          }}
                        />
                        <small className="help-text">Stock actual en el sistema</small>
                      </div>

                      <div className="form-group">
                        <label>Agregar Stock</label>
                        <input
                          type="number"
                          name="stock_agregar"
                          value={talla.stock_agregar || ''}
                          onChange={(e) => handleTallaChange(index, e)}
                          placeholder="0"
                          min="0"
                          className={errores[`talla_${index}_stock_agregar`] ? 'error' : ''}
                        />
                        {errores[`talla_${index}_stock_agregar`] && (
                          <p className="error-text">{errores[`talla_${index}_stock_agregar`]}</p>
                        )}
                        <small className="help-text">Stock a sumar al actual</small>
                      </div>

                      {/* Mostrar stock total calculado */}
                      {(talla.stock_agregar && parseInt(talla.stock_agregar) > 0) && (
                        <div className="stock-total-info">
                          <strong>Stock Total: {calcularStockTotal(talla)} unidades</strong>
                          <small>({talla.stock_actual} actual + {talla.stock_agregar} nuevo)</small>
                        </div>
                      )}
                    </>
                  ) : (
                    // Talla nueva - campo de stock normal
                    <div className="form-group">
                      <label>Stock Inicial *</label>
                      <input
                        type="number"
                        name="stock_agregar"
                        value={talla.stock_agregar || ''}
                        onChange={(e) => handleTallaChange(index, e)}
                        placeholder="0"
                        min="0"
                        className={errores[`talla_${index}_stock_agregar`] ? 'error' : ''}
                      />
                      {errores[`talla_${index}_stock_agregar`] && (
                        <p className="error-text">{errores[`talla_${index}_stock_agregar`]}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/ListarProductos')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Actualizando...
              </>
            ) : (
              'Actualizar Producto'
            )}
          </button>
        </div>
      </form>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Modal de Confirmación Profesional */}
      {mostrarConfirmacion && datosConfirmacion && (
        <div className="custom-confirm-overlay" onClick={cerrarConfirmacion}>
          <div className="custom-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-header">
              <div className="confirm-icon">⚠️</div>
              <h3 className="confirm-title">Confirmar Actualización</h3>
            </div>

            <div className="confirm-content">
              <p className="confirm-question">
                ¿Estás seguro que deseas actualizar este producto?
              </p>

              <div className="producto-resumen">
                <div className="resumen-item">
                  <span className="resumen-label">📦 Producto:</span>
                  <span className="resumen-valor">{datosConfirmacion.nombre}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">🏷️ Categoría:</span>
                  <span className="resumen-valor">{datosConfirmacion.categoria}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">🔖 Marca:</span>
                  <span className="resumen-valor">{datosConfirmacion.marca}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">💰 Precio:</span>
                  <span className="resumen-valor">${datosConfirmacion.precio}</span>
                </div>
              </div>

              <div className="tallas-resumen">
                <h4 className="tallas-titulo">
                  📏 Tallas y Stock ({datosConfirmacion.totalTallas} tallas)
                </h4>
                
                {datosConfirmacion.tallasNuevas > 0 && (
                  <div className="estadistica">
                    <span className="badge-nueva">{datosConfirmacion.tallasNuevas} nueva(s)</span>
                  </div>
                )}
                
                {datosConfirmacion.tallasModificadas > 0 && (
                  <div className="estadistica">
                    <span className="badge-modificada">{datosConfirmacion.tallasModificadas} modificada(s)</span>
                  </div>
                )}

                <div className="tallas-lista">
                  {datosConfirmacion.tallas.map((talla, index) => (
                    <div key={index} className={`talla-item ${talla.tipo}`}>
                      <span className="talla-nombre">{talla.nombre}</span>
                      {talla.tipo === 'existente' ? (
                        <span className="talla-stock">
                          {talla.stockAnterior} → {talla.stockNuevo} unidades
                          {talla.stockAgregado > 0 && (
                            <span className="stock-agregado"> (+{talla.stockAgregado})</span>
                          )}
                        </span>
                      ) : (
                        <span className="talla-stock">
                          {talla.stockInicial} unidades
                          <span className="talla-nueva-badge">nueva</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="advertencia">
                <div className="advertencia-icon">ℹ️</div>
                <span>Esta acción actualizará permanentemente la información del producto en el sistema.</span>
              </div>
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                onClick={cerrarConfirmacion}
                className="btn-confirm-cancel"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarActualizacion}
                className={`btn-confirm-accept ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Actualizando...
                  </>
                ) : (
                  'Sí, Actualizar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarProducto;