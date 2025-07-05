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
    estado_id: '1', // Por defecto Disponible
    tallas: [{ 
      id_detalle_producto: null, 
      talla_id: '', 
      stock_actual: 0,
      stock_agregar: 0,
      es_existente: false
    }],
  };

  const [producto, setProducto] = useState(initialProductState);
  const [productoOriginal, setProductoOriginal] = useState(null);
  const [estadoManual, setEstadoManual] = useState('1'); // Estado seleccionado manualmente
  const [productoCargado, setProductoCargado] = useState(false);
  const [errores, setErrores] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [estadosProducto, setEstadosProducto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tallasEliminadas, setTallasEliminadas] = useState([]);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [tipoConfirmacion, setTipoConfirmacion] = useState('');
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  // Función para procesar datos del producto
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
      estado_id: primerElemento.estado_id ? String(primerElemento.estado_id) : '1',
      nombre_estado: primerElemento.nombre_estado || '',
      detalles: []
    };

    productosData.forEach((registro, index) => {
      if (registro.id_detalle) {
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
          estado_detalle: registro.estado_detalle || 'activo'
        });
      }
    });

    console.log('✅ Producto procesado:', productoProcesado);
    return productoProcesado;
  };

  // FUNCIÓN CLAVE: Calcular stock total del producto
  const calcularStockTotalProducto = useCallback(() => {
    return producto.tallas.reduce((total, talla) => {
      if (talla.es_existente) {
        const stockActual = parseInt(talla.stock_actual) || 0;
        const stockAgregar = parseInt(talla.stock_agregar) || 0;
        return total + stockActual + stockAgregar;
      } else {
        return total + (parseInt(talla.stock_agregar) || 0);
      }
    }, 0);
  }, [producto.tallas]);

  // FUNCIÓN CLAVE: Determinar estado automático basado en stock
  const determinarEstadoAutomatico = useCallback((stockTotal) => {
    // Si el estado manual es "Inhabilitado", mantenerlo
    if (estadoManual === '3') {
      return '3';
    }
    
    // Lógica automática para Disponible/Agotado
    if (stockTotal === 0) {
      return '2'; // Agotado
    } else {
      return '1'; // Disponible
    }
  }, [estadoManual]);

  // FUNCIÓN CLAVE: Actualizar estado del producto cuando cambia el stock
  const actualizarEstadoPorStock = useCallback(() => {
    const stockTotal = calcularStockTotalProducto();
    const nuevoEstado = determinarEstadoAutomatico(stockTotal);
    
    console.log('🔄 Actualizando estado por stock:', {
      stockTotal,
      estadoManual,
      estadoActual: producto.estado_id,
      nuevoEstado
    });

    // Solo actualizar si el estado cambió
    if (producto.estado_id !== nuevoEstado) {
      setProducto(prev => ({
        ...prev,
        estado_id: nuevoEstado
      }));

      // Mostrar notificación del cambio automático
      if (nuevoEstado === '2') {
        toast.info('Estado cambiado automáticamente a "Agotado" por falta de stock');
      } else if (nuevoEstado === '1' && producto.estado_id === '2') {
        toast.info('Estado cambiado automáticamente a "Disponible" por tener stock');
      }
    }
  }, [calcularStockTotalProducto, determinarEstadoAutomatico, producto.estado_id, estadoManual]);

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

        const [categoriasRes, tallasRes, marcasRes, estadosRes, productoRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/categorias', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/tallas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/marcas', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:3000/api/admin/estados-producto', {
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
          estados: estadosRes.data?.length || 0,
          producto: productoRes.data
        });

        setCategorias(categoriasRes.data || []);
        setTallas(tallasRes.data || []);
        setMarcas(marcasRes.data || []);
        setEstadosProducto(estadosRes.data || []);

        let productData;
        
        if (Array.isArray(productoRes.data)) {
          if (productoRes.data.length === 0) {
            throw new Error('Producto no encontrado');
          }
          productData = procesarProductoConDetalles(productoRes.data);
        } else if (productoRes.data && typeof productoRes.data === 'object') {
          productData = {
            id_producto: productoRes.data.id_producto,
            nombre: productoRes.data.nombre_producto || '',
            descripcion: productoRes.data.descripcion || '',
            imagen_url: productoRes.data.imagen_url || '',
            categoria_id: productoRes.data.categoria_id_categoria ? String(productoRes.data.categoria_id_categoria) : '',
            estado_id: productoRes.data.estado_id ? String(productoRes.data.estado_id) : '1',
            detalles: productoRes.data.detalles || []
          };
        } else {
          throw new Error('Formato de respuesta no válido');
        }

        // Configurar estado manual inicial
        setEstadoManual(productData.estado_id || '1');

        let productoConfigurado;

        if (productData.detalles && productData.detalles.length > 0) {
          const primerDetalle = productData.detalles[0];

          console.log('🎯 Configurando producto con detalles:', {
            nombre: productData.nombre,
            categoria_id: productData.categoria_id,
            estado_id: productData.estado_id,
            primer_detalle: primerDetalle,
            total_detalles: productData.detalles.length
          });

          productoConfigurado = {
            nombre: productData.nombre || '',
            descripcion: productData.descripcion || '',
            imagen_url: productData.imagen_url || '',
            categoria_id: productData.categoria_id || '',
            estado_id: productData.estado_id || '1',
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
          };
        } else {
          console.log('⚠️ Producto sin detalles, configurando valores por defecto');
          productoConfigurado = {
            nombre: productData.nombre || '',
            descripcion: productData.descripcion || '',
            imagen_url: productData.imagen_url || '',
            categoria_id: productData.categoria_id || '',
            estado_id: productData.estado_id || '1',
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
          };
        }

        setProducto(productoConfigurado);
        setProductoOriginal(JSON.parse(JSON.stringify(productoConfigurado))); // Guardar copia profunda

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

  // EFECTO CLAVE: Actualizar estado automáticamente cuando cambia el stock
  useEffect(() => {
    if (productoCargado) {
      actualizarEstadoPorStock();
    }
  }, [producto.tallas, actualizarEstadoPorStock, productoCargado]);

  // Limpiar errores específicos
  const clearError = useCallback((errorKey) => {
    setErrores(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  }, []);

  // Función para verificar si hubo cambios
  const huboCambios = () => {
    if (!productoOriginal) return false;
    
    // Comparar datos básicos
    if (
      producto.nombre !== productoOriginal.nombre ||
      producto.descripcion !== productoOriginal.descripcion ||
      producto.imagen_url !== productoOriginal.imagen_url ||
      producto.categoria_id !== productoOriginal.categoria_id ||
      producto.marca_id !== productoOriginal.marca_id ||
      producto.precio_base !== productoOriginal.precio_base ||
      producto.estado_id !== productoOriginal.estado_id
    ) {
      return true;
    }

    // Comparar tallas
    if (producto.tallas.length !== productoOriginal.tallas.length) {
      return true;
    }

    // Comparar cada talla
    for (let i = 0; i < producto.tallas.length; i++) {
      const tallaActual = producto.tallas[i];
      const tallaOriginal = productoOriginal.tallas[i];
      
      if (
        tallaActual.talla_id !== tallaOriginal.talla_id ||
        tallaActual.stock_agregar !== tallaOriginal.stock_agregar
      ) {
        return true;
      }
    }

    // Verificar si hay tallas eliminadas
    if (tallasEliminadas.length > 0) {
      return true;
    }

    return false;
  };

  // Manejar cambios en campos principales
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => ({ ...prev, [name]: value }));

    if (errores[name]) {
      clearError(name);
    }
  };

  // Manejar clic en cancelar
  const handleCancelar = () => {
    if (huboCambios()) {
      setTipoConfirmacion('cancelar');
      setMostrarModalConfirmacion(true);
    } else {
      navigate('/admin/ListarProductos');
    }
  };

  // Manejar confirmación de cancelar
  const confirmarCancelar = () => {
    setMostrarModalConfirmacion(false);
    toast.info('Los cambios han sido descartados');
    navigate('/admin/ListarProductos');
  };

  // FUNCIÓN CLAVE: Manejar cambio de estado manual (solo Disponible ↔ Inhabilitado)
  const handleEstadoChange = (e) => {
    const nuevoEstado = e.target.value;
    
    console.log('🔄 Preparando cambio de estado manual:', {
      estadoActual: producto.estado_id,
      nuevoEstado,
      estadoManualActual: estadoManual
    });

    // Solo actualizar el estado manual y del producto en el estado local
    setEstadoManual(nuevoEstado);
    setProducto(prev => ({ ...prev, estado_id: nuevoEstado }));
    
    if (errores.estado_id) {
      clearError('estado_id');
    }

    // Mostrar mensaje informativo de que el cambio está pendiente
    const estadoNombre = getNombreEstado(nuevoEstado);
    toast.info(`Estado preparado para cambio a "${estadoNombre}". Confirma los cambios para aplicar.`);
  };

  // Manejar cambios en tallas
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

  // Validar formulario completo
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

    if (!producto.estado_id) {
      nuevosErrores.estado_id = 'Selecciona un estado';
      valido = false;
    }

    if (producto.imagen_url && !validateImageUrl(producto.imagen_url)) {
      nuevosErrores.imagen_url = 'Ingresa una URL válida de imagen';
      valido = false;
    }

    // Validar tallas
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

    // Mostrar modal de confirmación
    setTipoConfirmacion('guardar');
    setMostrarModalConfirmacion(true);
  };

  // Confirmar guardado de cambios
  const confirmarGuardado = async () => {
    setMostrarModalConfirmacion(false);
    await procesarActualizacion();
  };

  // Función para procesar la actualización
  const procesarActualizacion = async () => {
    setLoading(true);

    try {
      console.log('💾 Iniciando actualización del producto...');

      // PASO 1: Actualizar datos básicos (incluyendo estado)
      const datosBasicos = {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion.trim(),
        imagen_url: producto.imagen_url.trim() || '',
        categoria_id: parseInt(producto.categoria_id),
        estado_id: parseInt(producto.estado_id)
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

      // PASO 3: Procesar detalles existentes y nuevos
      const detallesActualizados = [];
      const detallesNuevos = [];

      producto.tallas.forEach((talla) => {
        if (talla.es_existente) {
          const stockTotal = calcularStockTotal(talla);
          
          const detalle = {
            marca_id: parseInt(producto.marca_id),
            talla_id: parseInt(talla.talla_id),
            precio: parseFloat(producto.precio_base),
            stock: stockTotal,
          };
          
          detallesActualizados.push({
            id: talla.id_detalle_producto,
            data: detalle
          });
          
          console.log(`📊 Talla existente ${talla.nombre_talla}:`, {
            stock_anterior: talla.stock_actual,
            stock_agregar: talla.stock_agregar || 0,
            stock_total: stockTotal
          });
        } else {
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
          detallesActualizados.map(item =>
            axios.put(
              `http://localhost:3000/api/admin/producto-detalle/${item.id}`,
              item.data,
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

      console.log('✅ Producto actualizado correctamente');
      
      // Mostrar modal de éxito
      setMostrarModalExito(true);
      
      // Cerrar el modal de éxito después de 3 segundos y redirigir
      setTimeout(() => {
        setMostrarModalExito(false);
        navigate('/admin/ListarProductos');
      }, 3000);

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

  // Obtener tallas disponibles
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

  const getNombreEstado = (estadoId) => {
    if (!estadoId) return 'Sin estado';
    const estado = estadosProducto.find(e =>
      e.id_estado && e.id_estado.toString() === estadoId.toString()
    );
    return estado ? estado.nombre_estado : 'Sin estado';
  };

  // Obtener clase CSS para el estado
  const getEstadoClass = (estadoId) => {
    switch (estadoId) {
      case '1': return 'estado-disponible';
      case '2': return 'estado-agotado';  
      case '3': return 'estado-inhabilitado';
      default: return '';
    }
  };

  // FUNCIÓN CLAVE: Determinar si un estado está disponible para selección manual
  const isEstadoDisponible = (estadoId) => {
    const stockTotal = calcularStockTotalProducto();
    
    // Estado Agotado (2) nunca está disponible para selección manual
    if (estadoId === '2') {
      return false;
    }

    // Estado Disponible (1) solo si hay stock
    if (estadoId === '1') {
      return stockTotal > 0;
    }

    // Estado Inhabilitado (3) siempre disponible
    if (estadoId === '3') {
      return true;
    }

    return false;
  };

  // Componente Modal de Confirmación
  const ModalConfirmacion = () => {
    if (!mostrarModalConfirmacion) return null;

    const esGuardar = tipoConfirmacion === 'guardar';
    const titulo = esGuardar ? '¿Actualizar producto?' : '¿Cancelar edición?';
    const mensaje = esGuardar 
      ? '¿Estás seguro de que deseas guardar los cambios realizados en este producto?'
      : '¿Estás seguro de que deseas cancelar? Se perderán todos los cambios no guardados.';
    const textoConfirmar = esGuardar ? 'Sí, actualizar' : 'Sí, cancelar';
    const textoRechazar = esGuardar ? 'No, continuar editando' : 'No, seguir editando';
    const handleConfirmar = esGuardar ? confirmarGuardado : confirmarCancelar;

    return (
      <>
        <div className="modal-backdrop" onClick={() => setMostrarModalConfirmacion(false)}></div>
        <div className="modal-confirmacion">
          <div className="modal-header">
            <h3>{titulo}</h3>
          </div>
          <div className="modal-body">
            <p>{mensaje}</p>
            {esGuardar && (
              <div className="resumen-cambios">
                <h4>Resumen de cambios:</h4>
                <ul>
                  <li>Producto: {producto.nombre}</li>
                  <li>Estado: {getNombreEstado(producto.estado_id)}</li>
                  <li>Stock total: {calcularStockTotalProducto()} unidades</li>
                  {tallasEliminadas.length > 0 && (
                    <li>Tallas a eliminar: {tallasEliminadas.length}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              className="btn-modal-confirmar"
              onClick={handleConfirmar}
              disabled={loading}
            >
              {loading ? 'Procesando...' : textoConfirmar}
            </button>
            <button 
              className="btn-modal-cancelar"
              onClick={() => setMostrarModalConfirmacion(false)}
              disabled={loading}
            >
              {textoRechazar}
            </button>
          </div>
        </div>
      </>
    );
  };

  // Componente Modal de Éxito
  const ModalExito = () => {
    if (!mostrarModalExito) return null;

    return (
      <>
        <div className="modal-backdrop-exito"></div>
        <div className="modal-exito">
          <div className="modal-exito-content">
            <div className="modal-exito-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 12.5L10.5 16L17 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="modal-exito-titulo">¡Producto actualizado con éxito!</h3>
            <p className="modal-exito-mensaje">
              Los cambios han sido guardados correctamente.
            </p>
            <div className="modal-exito-loading">
              <div className="loading-bar"></div>
            </div>
          </div>
        </div>
      </>
    );
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
      {/* Modal de Confirmación */}
      <ModalConfirmacion />
      
      {/* Modal de Éxito */}
      <ModalExito />

      <div className="header-section">
        <h2>Editar Producto</h2>
        <p className="subtitle">Modifica la información del producto</p>
        
        {/* Indicador de estado actual con lógica mejorada */}
        <div className={`estado-actual ${getEstadoClass(producto.estado_id)}`}>
          <span className="estado-icono">
            {producto.estado_id === '1' ? '✅' : producto.estado_id === '2' ? '⚠️' : '❌'}
          </span>
          <span className="estado-texto">
            Estado actual: {getNombreEstado(producto.estado_id)}
            {producto.estado_id === '2' && ' (Automático)'}
            {estadoManual === '3' && producto.estado_id === '3' && ' (Manual)'}
          </span>
          <span className="stock-total">
            (Stock total: {calcularStockTotalProducto()} unidades)
          </span>
        </div>

        {/* Información sobre lógica de estados */}
        <div className="estado-info">
          <small>
            <strong>Lógica de estados:</strong> 
            El estado "Agotado" se asigna automáticamente cuando no hay stock. 
            Solo puedes cambiar manualmente entre "Disponible" e "Inhabilitado".
            {producto.estado_id !== estadoManual && (
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                {' '}⚠️ Tienes cambios de estado pendientes de confirmar.
              </span>
            )}
          </small>
        </div>
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

          <div className="form-row">
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

            {/* Campo de estado mejorado con restricciones */}
            <div className="form-group">
              <label>Estado del Producto *</label>
              <select
                name="estado_id"
                value={producto.estado_id}
                onChange={handleEstadoChange}
                className={`estado-select ${getEstadoClass(producto.estado_id)} ${errores.estado_id ? 'error' : ''}`}
              >
                <option value="">Selecciona un estado</option>
                {estadosProducto.map((estado) => {
                  const isDisabled = !isEstadoDisponible(estado.id_estado.toString());
                  return (
                    <option 
                      key={estado.id_estado} 
                      value={estado.id_estado}
                      disabled={isDisabled}
                      style={isDisabled ? { color: '#ccc' } : {}}
                    >
                      {estado.nombre_estado}
                      {estado.id_estado === 2 && ' (Automático)'}
                      {estado.id_estado === 1 && calcularStockTotalProducto() === 0 && ' (Sin stock)'}
                    </option>
                  );
                })}
              </select>
              {errores.estado_id && <p className="error-text">{errores.estado_id}</p>}
              <small className="help-text">
                {producto.estado_id === '1' && '✅ Producto visible y disponible para venta'}
                {producto.estado_id === '2' && '⚠️ Estado automático: producto visible pero sin stock'}
                {producto.estado_id === '3' && '❌ Producto oculto al público'}
              </small>
            </div>
          </div>
        </div>

        {/* Sección de tallas */}
        <div className="form-section">
          <div className="tallas-header">
            <h3>Tallas y Stock *</h3>
            <div className="tallas-info">
              <span className="stock-total">Stock Total: {calcularStockTotalProducto()} unidades</span>
              <button
                type="button"
                onClick={handleAddTalla}
                className="btn-add-talla"
                disabled={loading}
              >
                <span>+</span> Agregar Talla
              </button>
            </div>
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

                  {/* Lógica de stock */}
                  {talla.es_existente ? (
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
            onClick={handleCancelar}
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
    </div>
  );
};

export default EditarProducto;