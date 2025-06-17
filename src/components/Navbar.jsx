// components/Navbar.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { toast } from 'react-toastify';
import '../styles/NavBar.css'; // Estandarizado a minúsculas

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { 
    carrito, 
    carritoLoading, 
    initialized, 
    userChecked, // 🔥 NUEVO estado
    fetchCarrito, 
    eliminarDelCarrito, 
    calcularTotal, 
    cantidadTotal, 
    limpiarCarrito 
  } = useCarrito();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [categoriasLoading, setCategoriasLoading] = useState(true);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const dropdownRef = useRef(null);
  const carritoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar categorías desde la API correcta
    const cargarCategorias = async () => {
      try {
        setCategoriasLoading(true);
        
        // URL corregida para obtener categorías
        const response = await fetch('http://localhost:3000/api/productos/categorias');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Categorías cargadas:', data);
        
        // Verificar la estructura de la respuesta
        if (Array.isArray(data)) {
          setCategorias(data);
        } else if (data.categorias && Array.isArray(data.categorias)) {
          setCategorias(data.categorias);
        } else {
          console.warn('⚠️ Estructura de categorías inesperada:', data);
          setCategorias([]);
        }
        
      } catch (err) {
        console.error('❌ Error al cargar categorías:', err);
        toast.error('Error al cargar las categorías');
        setCategorias([]);
      } finally {
        setCategoriasLoading(false);
      }
    };

    cargarCategorias();
  }, []);

  // 🔥 CORREGIDO: useEffect para manejar carrito
  useEffect(() => {
    console.log('🔄 Navbar useEffect - user:', user, 'initialized:', initialized, 'userChecked:', userChecked);
    
    // Solo actuar cuando el contexto de carrito ya haya verificado el usuario
    if (userChecked) {
      if (user && !initialized) {
        console.log('✅ Usuario detectado y carrito no inicializado, cargando...');
        fetchCarrito(true);
      } else if (!user) {
        console.log('❌ No hay usuario, carrito ya debería estar limpio');
        // No hacer nada, el contexto ya maneja esto
      }
    }
  }, [user, initialized, userChecked, fetchCarrito]);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (carritoRef.current && !carritoRef.current.contains(event.target)) {
        setCarritoVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleCarrito = () => {
    setCarritoVisible(!carritoVisible);
  };

  const goToCart = () => {
    navigate('/carrito'); 
    setCarritoVisible(false);
  };

  const handleEliminarProducto = async (detalle_producto_id) => {
    try {
      await eliminarDelCarrito(detalle_producto_id);
      toast.success('Producto eliminado del carrito');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleCategoriaClick = (categoriaId) => {
    setDropdownOpen(false);
    navigate(`/productos/categoria/${categoriaId}`);
  };

  // Función para manejar el click en el perfil según el rol
  const handlePerfilClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Navegar según el rol del usuario
    if (user.rol === 'admin') {
      navigate('/admin');
    } else if (user.rol === 'cliente') {
      navigate('/cliente');
    } else {
      // Fallback para otros roles o undefined
      navigate('/perfil');
    }
  };

  // 🔥 MEJORADA: Lógica para mostrar el badge del carrito
  const mostrarBadgeCarrito = () => {
    if (!user || user.rol !== 'cliente') return false;
    
    if (!userChecked) {
      return false; // Aún verificando usuario
    }
    
    if (carritoLoading && !initialized) {
      return '...'; // Cargando
    }
    
    if (initialized && carrito.length > 0) {
      return carrito.length; // Mostrar cantidad
    }
    
    return false; // No mostrar badge
  };

  const badgeCarrito = mostrarBadgeCarrito();

  return (
    <header className="navbar-container">
      <div className="navbar-logo">
        <Link to="/">
          <img src="https://i.ibb.co/wrdpCN4J/logo-tienda.png" alt="UrbanDrip Logo" className="h-10 w-auto" />
        </Link>
      </div>

      <nav className="navbar-menu">
        <Link to="/" className="nav-link">Inicio</Link>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="dropdown-button"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            type="button"
            title="Productos"
          >
            Productos
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <ul>
                {categoriasLoading ? (
                  <li className="dropdown-item">
                    <span>Cargando categorías...</span>
                  </li>
                ) : categorias.length === 0 ? (
                  <li className="dropdown-item">
                    <span>No hay categorías disponibles</span>
                  </li>
                ) : (
                  categorias.map(cat => (
                    <li key={cat.id_categoria || cat.id}>
                      <button 
                        onClick={() => handleCategoriaClick(cat.id_categoria || cat.id)}
                        className="dropdown-item dropdown-link"
                      >
                        {cat.nombre_categoria || cat.nombre}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Link actualizado para contacto */}
        <Link to="/contacto" className="nav-link">Contacto</Link>

        {user ? (
          <div className="user-section">
            <span className="welcome-text">Bienvenido, {user.nombre}</span>
            <button onClick={logout} className="nav-link logout-btn">Cerrar sesión</button>
          </div>
        ) : (
          <button onClick={handleLoginClick} className="nav-link">Ingresar</button> 
        )}

        {/* Icono de perfil actualizado con navegación según rol */}
        <button 
          onClick={handlePerfilClick} 
          className="profile-icon" 
          title={user ? `Ir a ${user.rol === 'admin' ? 'Panel Admin' : 'Mi Perfil'}` : 'Ingresar'}
        >
          <i className="fas fa-user-circle"></i>
        </button>

        {/* 🔥 CORREGIDO: Carrito solo para clientes autenticados */}
        {user?.rol === 'cliente' && (
          <div className="cart-container-nav" ref={carritoRef}>
            <div onClick={toggleCarrito} className="cart-icon">
              <i className="fas fa-shopping-cart"></i>
              {badgeCarrito && (
                <span className="cart-badge">{badgeCarrito}</span>
              )}
            </div>

            {/* Carrito flotante mejorado */}
            {carritoVisible && (
              <div className="cart-dropdown">
                <div className="cart-header">
                  <h3 className="cart-title">
                    <i className="fas fa-shopping-bag"></i>
                    Mi Carrito
                  </h3>
                  <button className="cart-close" onClick={toggleCarrito}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="cart-content">
                  {!userChecked ? (
                    <div className="cart-loading">
                      <div className="loading-spinner-small"></div>
                      <p>Verificando usuario...</p>
                    </div>
                  ) : !initialized ? (
                    <div className="cart-loading">
                      <div className="loading-spinner-small"></div>
                      <p>Cargando carrito...</p>
                    </div>
                  ) : carrito.length === 0 ? (
                    <div className="cart-empty">
                      <div className="empty-icon">🛍️</div>
                      <p>Tu carrito está vacío</p>
                      <small>¡Agrega algunos productos increíbles!</small>
                    </div>
                  ) : (
                    <>
                      <div className="cart-items-mini">
                        {carrito.slice(0, 3).map((item) => (
                          <div key={item.id_detalle_producto} className="cart-item-mini">
                            <div className="item-image">
                              <img 
                                src={item.imagen_url || '/placeholder-image.jpg'} 
                                alt={item.nombre_producto || item.nombre}
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                              />
                            </div>
                            <div className="item-details">
                              <h4 className="item-name">{item.nombre_producto || item.nombre}</h4>
                              <div className="item-specs">
                                <span className="item-size">Talla: {item.nombre_talla || item.talla}</span>
                                <span className="item-quantity">Cant: {item.cantidad}</span>
                              </div>
                              <div className="item-price">${(item.precio || 0).toLocaleString('es-CL')}</div>
                            </div>
                            <button 
                              className="item-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarProducto(item.id_detalle_producto);
                              }}
                              title="Eliminar producto"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        ))}
                        
                        {carrito.length > 3 && (
                          <div className="more-items">
                            <small>+ {carrito.length - 3} producto{carrito.length - 3 > 1 ? 's' : ''} más</small>
                          </div>
                        )}
                      </div>

                      <div className="cart-summary-mini">
                        <div className="summary-line">
                          <span>Subtotal ({cantidadTotal()} producto{cantidadTotal() > 1 ? 's' : ''})</span>
                          <strong>${calcularTotal().toLocaleString('es-CL')}</strong>
                        </div>
                        <div className="summary-shipping">
                          <span>Envío</span>
                          <span className="free-text">¡Gratis!</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="cart-actions">
                  <button 
                    className="btn-view-cart" 
                    onClick={goToCart}
                    disabled={!userChecked || !initialized || carrito.length === 0}
                  >
                    <i className="fas fa-shopping-cart"></i>
                    Ver Carrito
                  </button>
                  <button 
                    className="btn-checkout" 
                    onClick={goToCart}
                    disabled={!userChecked || !initialized || carrito.length === 0}
                  >
                    <i className="fas fa-credit-card"></i>
                    Finalizar Compra
                  </button>
                </div>

                {/* 🔥 NUEVO: Información de debug en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="debug-info" style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '11px',
                    borderTop: '1px solid #ddd'
                  }}>
                    <div><strong>Debug:</strong></div>
                    <div>userChecked: {userChecked ? '✅' : '❌'}</div>
                    <div>initialized: {initialized ? '✅' : '❌'}</div>
                    <div>carritoLoading: {carritoLoading ? '⏳' : '✅'}</div>
                    <div>items: {carrito.length}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;