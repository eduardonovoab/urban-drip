// components/DetalleProducto.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Agregado Link aquí
import axios from 'axios';
import { Heart, Share2, Truck, Shield, RotateCcw, Star } from 'lucide-react';
import { useCarrito } from '../context/CarritoContext';
import { toast } from 'react-toastify';
import '../styles/DetalleProducto.css';

const DetalleProducto = () => {
  const { id } = useParams();
  const { agregarAlCarrito, carrito, estaEnCarrito, getCantidadProducto } = useCarrito();
  
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
        setProducto(response.data);
        
        // Auto-seleccionar la primera talla disponible
        if (response.data.detalles && response.data.detalles.length > 0) {
          const primerTallaDisponible = response.data.detalles.find(d => d.stock > 0);
          if (primerTallaDisponible) {
            setSelectedTalla(primerTallaDisponible.talla_id_talla);
            setSelectedDetalle(primerTallaDisponible);
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

  const handleTallaChange = (talla) => {
    setSelectedTalla(talla);
    const detalle = producto.detalles.find(d => d.talla_id_talla === talla);
    setSelectedDetalle(detalle);
    setQuantity(1); // Reset quantity when changing size
  };

  const handleAddToCart = async () => {
    if (!selectedDetalle) {
      toast.error('Por favor selecciona una talla');
      return;
    }

    setAgregandoCarrito(true);
    
    try {
      // Tu backend espera: { detalle_producto_id, cantidad }
      const result = await agregarAlCarrito(selectedDetalle.id_detalle_producto, quantity);
      
      // Tu backend devuelve: { success: true/false, message: "..." }
      // El toast ya se maneja dentro de agregarAlCarrito
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
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
      return order.indexOf(a.talla_id_talla) - order.indexOf(b.talla_id_talla);
    });
  };

  // Verificar si el producto está en el carrito
  const isProductInCart = selectedDetalle ? estaEnCarrito(selectedDetalle.id_detalle_producto) : false;
  const cantidadEnCarrito = selectedDetalle ? getCantidadProducto(selectedDetalle.id_detalle_producto) : 0;

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
    <div className="detalle-producto-page">
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
        <div className="producto-grid">
          
          {/* Imagen del producto */}
          <div className="producto-imagen-section">
            <div className="producto-imagen-container">
              <img
                src={producto.imagen_url}
                alt={producto.nombre_producto}
                className="producto-imagen"
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
          </div>

          {/* Información del producto */}
          <div className="producto-info-section">
            
            {/* Header */}
            <div className="producto-header">
              <h1 className="producto-titulo">
                {producto.nombre_producto}
              </h1>
              
              {selectedDetalle && (
                <div className="producto-precio-container">
                  <span className="producto-precio">
                    ${selectedDetalle.precio.toLocaleString('es-CL')}
                  </span>
                  {selectedDetalle.stock < 5 && selectedDetalle.stock > 0 && (
                    <span className="stock-bajo-alerta">
                      ¡Solo quedan {selectedDetalle.stock}!
                    </span>
                  )}
                </div>
              )}

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
                {tallasDisponibles.map((detalle) => (
                  <button
                    key={detalle.talla_id_talla}
                    onClick={() => handleTallaChange(detalle.talla_id_talla)}
                    disabled={detalle.stock === 0}
                    className={`talla-btn ${
                      selectedTalla === detalle.talla_id_talla ? 'talla-btn-selected' : ''
                    } ${detalle.stock === 0 ? 'talla-btn-disabled' : ''}`}
                  >
                    {detalle.talla_id_talla}
                    {detalle.stock === 0 && <div className="talla-agotada-line"></div>}
                  </button>
                ))}
              </div>

              {selectedDetalle && (
                <div className="stock-info-container">
                  <p className="stock-info">
                    Stock disponible: <span className="stock-number">{selectedDetalle.stock} unidades</span>
                  </p>
                  {isProductInCart && (
                    <p className="carrito-info">
                      Ya tienes <span className="cantidad-carrito">{cantidadEnCarrito}</span> en tu carrito
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cantidad */}
            {selectedDetalle && selectedDetalle.stock > 0 && (
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

            {/* Botones de acción */}
            <div className="acciones-section">
              <button
                onClick={handleAddToCart}
                disabled={!selectedDetalle || selectedDetalle.stock === 0 || agregandoCarrito}
                className={`add-to-cart-btn ${
                  !selectedDetalle || selectedDetalle.stock === 0 ? 'add-to-cart-btn-disabled' : ''
                }`}
              >
                {agregandoCarrito ? (
                  <>
                    <div className="loading-spinner-btn"></div>
                    Agregando...
                  </>
                ) : !selectedDetalle || selectedDetalle.stock === 0 ? (
                  'No disponible'
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
            </div>

            {/* Información adicional */}
            <div className="info-adicional">
              <div className="info-item">
                <Truck className="info-icon" />
                <span>Envío gratis en pedidos superiores a $50.000</span>
              </div>
              <div className="info-item">
                <RotateCcw className="info-icon" />
                <span>Devoluciones gratuitas hasta 30 días</span>
              </div>
              <div className="info-item">
                <Shield className="info-icon" />
                <span>Compra 100% segura</span>
              </div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleProducto;