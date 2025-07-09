import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, Share2, Truck, Shield, RotateCcw, Star, AlertTriangle, Crown, Eye } from 'lucide-react';
import { useCarrito } from '../context/CarritoContext';
import { toast } from 'react-toastify';
import '../styles/DetalleProducto.css';

const DetalleProducto = () => {
  const { id } = useParams();
  const { 
    agregarAlCarrito, 
    carrito, 
    estaEnCarrito, 
    getCantidadProducto,
    isAdmin,
    userRole,
    usuario,
    userChecked,
    verificarAdminDesdeToken
  } = useCarrito();
  
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState('');
  const [selectedDetalle, setSelectedDetalle] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`http://localhost:3000/api/productos/${id}`);
        const productoData = response.data;
        
        console.log('📦 Producto obtenido:', productoData);
        
        setProducto(productoData);
        
        // Auto-seleccionar la primera talla disponible con stock
        if (productoData.detalles && productoData.detalles.length > 0) {
          const primerTallaDisponible = productoData.detalles.find(d => d.stock > 0);
          if (primerTallaDisponible) {
            setSelectedTalla(primerTallaDisponible.talla_id_talla);
            setSelectedDetalle(primerTallaDisponible);
          } else {
            // Si no hay stock, seleccionar la primera talla para mostrar info
            setSelectedTalla(productoData.detalles[0].talla_id_talla);
            setSelectedDetalle(productoData.detalles[0]);
          }
        }
      } catch (err) {
        console.error('Error al obtener el producto:', err);
        setError(err.response?.data?.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProducto();
    }
  }, [id]);

  // Función para determinar el estado del producto
  const getEstadoProducto = () => {
    if (!producto || !producto.detalles || producto.detalles.length === 0) {
      return { tipo: 'sin-info', nombre: 'Sin información' };
    }

    const stockTotal = producto.detalles.reduce((total, detalle) => total + (detalle.stock || 0), 0);
    
    if (stockTotal === 0) {
      return { tipo: 'agotado', nombre: 'Agotado' };
    }
    
    if (stockTotal <= 5) {
      return { tipo: 'stock-bajo', nombre: 'Stock limitado' };
    }
    
    return { tipo: 'disponible', nombre: 'Disponible' };
  };

  const handleTallaChange = (talla) => {
    setSelectedTalla(talla);
    const detalle = producto.detalles.find(d => d.talla_id_talla === talla);
    setSelectedDetalle(detalle);
    setQuantity(1); // Reset quantity when changing size
  };

  // 🔥 NUEVA: Función mejorada para agregar al carrito con verificación de admin ROBUSTA
  const handleAddToCart = async () => {
    console.log('🛒 handleAddToCart ejecutado');
    console.log('🔍 Estado admin - isAdmin:', isAdmin, 'userRole:', userRole, 'userChecked:', userChecked);

    // 🔥 VERIFICACIÓN INMEDIATA desde el token
    const esAdminToken = verificarAdminDesdeToken();
    console.log('🔍 Verificación directa desde token en component - Es admin:', esAdminToken);

    // 🔥 VERIFICACIÓN ROBUSTA: Multiple verificaciones de admin
    const esAdmin = esAdminToken || 
                    isAdmin || 
                    userRole?.toLowerCase() === 'admin' || 
                    userRole?.toLowerCase() === 'administrador' ||
                    usuario?.rol?.toLowerCase() === 'admin' ||
                    usuario?.rol?.toLowerCase() === 'administrador';

    if (esAdmin) {
      toast.error('No puedes agregar al carrito siendo admin', {
        autoClose: 4000
      });
      console.warn('🚫 Bloqueado en handleAddToCart: Usuario es admin');
      return;
    }

    // 🔥 VERIFICACIÓN ADICIONAL: Si el usuario no ha sido verificado completamente
    if (!userChecked) {
      console.log('⏳ Usuario no verificado, esperando...');
      toast.info('Verificando permisos de usuario...', {
        autoClose: 2000
      });
      return;
    }

    if (!selectedDetalle) {
      toast.error('Por favor selecciona una talla');
      return;
    }

    if (selectedDetalle.stock === 0) {
      toast.error('Esta talla está agotada');
      return;
    }

    setAgregandoCarrito(true);
    
    try {
      console.log('✅ Procediendo con agregarAlCarrito...');
      const result = await agregarAlCarrito(selectedDetalle.id_detalle_producto, quantity);
      
      console.log('📦 Resultado agregarAlCarrito:', result);
      
      // Verificar si fue bloqueado por ser admin
      if (result.isAdminBlocked) {
        console.log('🚫 Operación bloqueada: Usuario administrador');
        // No mostrar error adicional, ya se mostró en agregarAlCarrito
        return;
      }

      // Si hay un error pero no es por admin, mostrarlo
      if (!result.success && !result.isAdminBlocked) {
        toast.error(result.message || 'Error al agregar el producto al carrito');
      }

    } catch (error) {
      console.error('❌ Error en handleAddToCart:', error);
      toast.error('Error al agregar el producto al carrito');
    } finally {
      setAgregandoCarrito(false);
    }
  };

  const getTallasUnicas = () => {
    if (!producto?.detalles) return [];
    const tallasMap = new Map();
    
    producto.detalles.forEach(detalle => {
      const talla = detalle.talla_id_talla;
      if (!tallasMap.has(talla) || tallasMap.get(talla).stock < detalle.stock) {
        tallasMap.set(talla, detalle);
      }
    });
    
    return Array.from(tallasMap.values()).sort((a, b) => {
      const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const indexA = order.indexOf(a.talla_id_talla);
      const indexB = order.indexOf(b.talla_id_talla);
      
      // Si no están en el orden predefinido, usar orden alfabético
      if (indexA === -1 && indexB === -1) {
        return a.talla_id_talla.localeCompare(b.talla_id_talla);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  };

  const estadoProducto = getEstadoProducto();
  const isProductInCart = selectedDetalle ? estaEnCarrito(selectedDetalle.id_detalle_producto) : false;
  const cantidadEnCarrito = selectedDetalle ? getCantidadProducto(selectedDetalle.id_detalle_producto) : 0;
  const stockTotal = producto?.detalles?.reduce((total, detalle) => total + (detalle.stock || 0), 0) || 0;

  // 🔥 VERIFICACIÓN ADICIONAL: Determinar si es admin usando múltiples métodos
  const esAdminActual = verificarAdminDesdeToken() || 
                       isAdmin || 
                       userRole?.toLowerCase() === 'admin' || 
                       userRole?.toLowerCase() === 'administrador';

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-text">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="error-button"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="not-found-container">
        <div className="not-found-content">
          <p className="not-found-text">Producto no encontrado</p>
        </div>
      </div>
    );
  }

  const tallasDisponibles = getTallasUnicas();

  return (
    <div className={`detalle-producto-page ${estadoProducto.tipo === 'agotado' ? 'producto-agotado' : ''} ${esAdminActual ? 'vista-admin' : ''}`}>
      {/* 🔥 NUEVA: Alerta para administradores */}
      {esAdminActual && (
        <div className="alerta-admin">
          <Crown className="alerta-icon admin-icon" />
          <div className="alerta-content">
            <h4>Vista de Administrador</h4>
            <p>Estás viendo este producto como administrador. No puedes agregar productos al carrito.</p>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">
            Inicio
          </Link> 
          <span className="breadcrumb-separator"> / </span>
          <Link to="/productos" className="breadcrumb-link">
            Productos
          </Link>
          {producto.categoria && (
            <>
              <span className="breadcrumb-separator"> / </span>
              <Link 
                to={`/productos/categoria/${producto.categoria.id_categoria}`} 
                className="breadcrumb-link"
              >
                {producto.categoria.nombre_categoria}
              </Link>
            </>
          )}
          <span className="breadcrumb-separator"> / </span>
          <span className="breadcrumb-current">{producto.nombre_producto}</span>
        </nav>
      </div>

      <div className="detalle-producto-content">
        {/* Alerta de producto agotado */}
        {estadoProducto.tipo === 'agotado' && (
          <div className="alerta-agotado">
            <AlertTriangle className="alerta-icon" />
            <div className="alerta-content">
              <h4>Producto temporalmente agotado</h4>
              <p>Este producto no tiene stock disponible actualmente. Puedes ver los detalles y agregarlo a favoritos para recibir notificaciones cuando esté disponible.</p>
            </div>
          </div>
        )}

        <div className="producto-grid">
          
          {/* Imagen del producto */}
          <div className="producto-imagen-section">
            <div className="producto-imagen-container">
              <img
                src={producto.imagen_url}
                alt={producto.nombre_producto}
                className={`producto-imagen ${estadoProducto.tipo === 'agotado' ? 'imagen-agotada' : ''}`}
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
              
              {/* Badge de estado del producto */}
              {estadoProducto.tipo === 'agotado' && (
                <div className="badge-estado agotado">
                  <span>AGOTADO</span>
                </div>
              )}
              
              {estadoProducto.tipo === 'stock-bajo' && (
                <div className="badge-estado stock-bajo">
                  <span>¡ÚLTIMAS UNIDADES!</span>
                </div>
              )}

              {/* 🔥 NUEVO: Badge de vista admin */}
              {esAdminActual && (
                <div className="badge-estado admin-badge">
                  <Crown className="badge-icon" />
                  <span>VISTA ADMIN</span>
                </div>
              )}
            </div>
          </div>

          {/* Información del producto */}
          <div className="producto-info-section">
            
            {/* Header */}
            <div className="producto-header">
              <h1 className="producto-titulo">
                {producto.nombre_producto}
                {esAdminActual && <Crown className="admin-crown-title" />}
              </h1>
              
              {/* Estado y precio */}
              <div className="estado-precio-container">
                <div className={`estado-producto ${estadoProducto.tipo}`}>
                  <span className="estado-texto">{estadoProducto.nombre}</span>
                  {stockTotal > 0 && (
                    <span className="stock-total">({stockTotal} unidades disponibles)</span>
                  )}
                </div>
                
                {selectedDetalle && (
                  <div className="producto-precio-container">
                    <span className={`producto-precio ${estadoProducto.tipo === 'agotado' ? 'precio-agotado' : ''}`}>
                      ${selectedDetalle.precio.toLocaleString('es-CL')}
                    </span>
                    {selectedDetalle.stock < 5 && selectedDetalle.stock > 0 && (
                      <span className="stock-bajo-alerta">
                        ¡Solo quedan {selectedDetalle.stock}!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="producto-rating">
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="star-icon" />
                  ))}
                </div>
                <span className="rating-text">(124 reseñas)</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="producto-descripcion">
              <p>{producto.descripcion}</p>
            </div>

            {/* Selector de talla */}
            <div className="talla-selector-section">
              <div className="talla-header">
                <label className="talla-label">
                  Talla: {selectedTalla && <span className="talla-selected">({selectedTalla})</span>}
                </label>
                <button className="guia-tallas-btn">
                  Guía de tallas
                </button>
              </div>
              
              <div className="tallas-grid">
                {tallasDisponibles.map((detalle) => {
                  const estaAgotada = detalle.stock === 0;
                  const esStockBajo = detalle.stock > 0 && detalle.stock <= 3;
                  
                  return (
                    <button
                      key={detalle.talla_id_talla}
                      onClick={() => !estaAgotada && handleTallaChange(detalle.talla_id_talla)}
                      disabled={estaAgotada}
                      className={`talla-btn ${
                        selectedTalla === detalle.talla_id_talla ? 'talla-btn-selected' : ''
                      } ${estaAgotada ? 'talla-btn-agotada' : ''} ${
                        esStockBajo ? 'talla-btn-stock-bajo' : ''
                      }`}
                      title={estaAgotada ? 'Talla agotada' : esStockBajo ? `Solo ${detalle.stock} disponibles` : `${detalle.stock} disponibles`}
                    >
                      {detalle.talla_id_talla}
                      {estaAgotada && <div className="talla-agotada-line"></div>}
                      {esStockBajo && !estaAgotada && (
                        <div className="talla-stock-bajo-indicator">!</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDetalle && (
                <div className="stock-info-container">
                  <p className={`stock-info ${selectedDetalle.stock === 0 ? 'stock-agotado' : selectedDetalle.stock <= 5 ? 'stock-bajo' : 'stock-ok'}`}>
                    {selectedDetalle.stock === 0 ? (
                      <>
                        <AlertTriangle className="stock-icon" />
                        Esta talla está agotada
                      </>
                    ) : selectedDetalle.stock <= 5 ? (
                      <>
                        <AlertTriangle className="stock-icon" />
                        ¡Solo quedan <span className="stock-number">{selectedDetalle.stock}</span> en esta talla!
                      </>
                    ) : (
                      <>
                        Stock disponible: <span className="stock-number">{selectedDetalle.stock} unidades</span>
                      </>
                    )}
                  </p>
                  {isProductInCart && !esAdminActual && (
                    <p className="carrito-info">
                      Ya tienes <span className="cantidad-carrito">{cantidadEnCarrito}</span> en tu carrito
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cantidad - Solo mostrar si hay stock y NO es admin */}
            {selectedDetalle && selectedDetalle.stock > 0 && !esAdminActual && (
              <div className="cantidad-section">
                <label className="cantidad-label">Cantidad</label>
                <div className="cantidad-controls">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="cantidad-btn"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="cantidad-display">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedDetalle.stock, quantity + 1))}
                    className="cantidad-btn"
                    disabled={quantity >= selectedDetalle.stock}
                  >
                    +
                  </button>
                </div>
                <small className="cantidad-max">
                  Máximo disponible: {selectedDetalle.stock}
                </small>
              </div>
            )}

            {/* 🔥 MEJORADA: Botones de acción con lógica para administradores */}
            <div className="acciones-section">
              {esAdminActual ? (
                // 🔥 NUEVA: Vista especial para administradores
                <div className="acciones-admin">
                  <div className="admin-info-box">
                    <Crown className="admin-info-icon" />
                    <div className="admin-info-content">
                      <h4>Vista de Administrador</h4>
                      <p>Como administrador, puedes visualizar todos los detalles del producto, pero no puedes agregar al carrito.</p>
                    </div>
                  </div>
                  
                  <div className="admin-actions">
                   
                   
                   
                   
                    
                    <div className="secondary-actions">
                      <button
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`secondary-btn ${isFavorite ? 'favorite-active' : ''}`}
                      >
                        <Heart className={`action-icon ${isFavorite ? 'heart-filled' : ''}`} />
                        <span>Favoritos</span>
                      </button>
                      
                      <button className="secondary-btn">
                        <Share2 className="action-icon" />
                        <span>Compartir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : estadoProducto.tipo === 'agotado' ? (
                // Botones para producto agotado (clientes)
                <div className="acciones-agotado">
                  <button className="btn-notificar">
                    <Heart className="action-icon" />
                    Notificarme cuando esté disponible
                  </button>
                  <div className="secondary-actions">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`secondary-btn ${isFavorite ? 'favorite-active' : ''}`}
                    >
                      <Heart className={`action-icon ${isFavorite ? 'heart-filled' : ''}`} />
                      <span>Favoritos</span>
                    </button>
                    
                    <button className="secondary-btn">
                      <Share2 className="action-icon" />
                      <span>Compartir</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Botones para producto disponible (clientes)
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedDetalle || selectedDetalle.stock === 0 || agregandoCarrito}
                    className={`add-to-cart-btn ${
                      !selectedDetalle || selectedDetalle.stock === 0 ? 'add-to-cart-btn-disabled' : ''
                    } ${estadoProducto.tipo === 'stock-bajo' ? 'btn-urgente' : ''}`}
                  >
                    {agregandoCarrito ? (
                      <>
                        <div className="loading-spinner-btn"></div>
                        Agregando...
                      </>
                    ) : !selectedDetalle || selectedDetalle.stock === 0 ? (
                      'Talla no disponible'
                    ) : estadoProducto.tipo === 'stock-bajo' ? (
                      '¡Agregar ahora - Stock limitado!'
                    ) : (
                      'Agregar al carrito'
                    )}
                  </button>

                  <div className="secondary-actions">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={`secondary-btn ${isFavorite ? 'favorite-active' : ''}`}
                    >
                      <Heart className={`action-icon ${isFavorite ? 'heart-filled' : ''}`} />
                      <span>Favoritos</span>
                    </button>
                    
                    <button className="secondary-btn">
                      <Share2 className="action-icon" />
                      <span>Compartir</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Información adicional */}
            <div className="info-adicional">
              {!esAdminActual && (
                <>
                  <div className="info-item">
                    <Truck className="info-icon" />
                    <span>
                      {estadoProducto.tipo === 'agotado' 
                        ? 'Envío gratis cuando esté disponible' 
                        : 'Envío gratis en pedidos superiores a $50.000'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <RotateCcw className="info-icon" />
                    <span>Devoluciones gratuitas hasta 30 días</span>
                  </div>
                  <div className="info-item">
                    <Shield className="info-icon" />
                    <span>Compra 100% segura</span>
                  </div>
                  
                  {estadoProducto.tipo === 'agotado' && (
                    <div className="info-item info-agotado">
                      <AlertTriangle className="info-icon" />
                      <span>Te notificaremos por email cuando esté disponible</span>
                    </div>
                  )}
                </>
              )}

              {/* 🔥 NUEVA: Información especial para administradores */}
              {esAdminActual && (
                <div className="info-item info-admin">
                  <Crown className="info-icon" />
                  <span>Vista de administrador - No puedes agregar al carrito</span>
                </div>
              )}
            </div>

            {/* Marca y categoría */}
            {(selectedDetalle?.marca_id_marca || producto.categoria) && (
              <div className="detalles-producto">
                {selectedDetalle?.marca_id_marca && (
                  <p><span className="detalle-label">Marca:</span> {selectedDetalle.marca_id_marca}</p>
                )}
                {producto.categoria && (
                  <p><span className="detalle-label">Categoría:</span> {producto.categoria.nombre_categoria}</p>
                )}
                <p><span className="detalle-label">Estado:</span> {estadoProducto.nombre}</p>
                {esAdminActual && (
                  <p><span className="detalle-label">Rol:</span> Administrador</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleProducto;