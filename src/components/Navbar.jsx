import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Importar el contexto del carrito
import { toast } from 'react-toastify';
import '../styles/NavBar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { carrito, carritoLoading, initialized, fetchCarrito, eliminarDelCarrito, calcularTotal, cantidadTotal, limpiarCarrito } = useCart();  // Usar el contexto del carrito

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const dropdownRef = useRef(null);
  const carritoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar categorías
    fetch('http://localhost:3000/api/categorias')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setCategorias(data))
      .catch(err => {
        console.error('Error al cargar categorías:', err);
        toast.error('Error al cargar las categorías');
      });

    // Cargar carrito solo si el usuario está logueado
    if (user && !initialized) {
      fetchCarrito(true); // Solo mostrar loading en la carga inicial
    } else if (!user) {
      // Limpiar carrito si no hay usuario
      limpiarCarrito();
    }
  }, [user, initialized, fetchCarrito, limpiarCarrito]);

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
    navigate('/cart');
    setCarritoVisible(false);
  };

  const handleEliminarProducto = async (detalle_producto_id) => {
    await eliminarDelCarrito(detalle_producto_id);
  };

  const handleLoginClick = () => {
    // Redirige al login al hacer clic en "Ingresar"
    navigate('/login');
  };

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
                {categorias.length === 0 ? (
                  <li className="dropdown-item">Cargando...</li>
                ) : (
                  categorias.map(cat => (
                    <li key={cat.id_categoria}>
                      <Link to={`/productos/categoria/${cat.id_categoria}`} className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        {cat.nombre_categoria}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <Link to="/contacto" className="nav-link">Contacto</Link>

        {user ? (
          <div className="user-section">
            <span className="welcome-text">Bienvenido, {user.nombre}</span>
            <button onClick={logout} className="nav-link logout-btn">Cerrar sesión</button>
          </div>
        ) : (
          <button onClick={handleLoginClick} className="nav-link">Ingresar</button> 
        )}

        <Link to="/perfil" className="profile-icon" title="Perfil">
          <i className="fas fa-user-circle"></i>
        </Link>

        {user?.rol === 'cliente' && (
          <div className="cart-container-nav" ref={carritoRef}>
            <div onClick={toggleCarrito} className="cart-icon">
              <i className="fas fa-shopping-cart"></i>
              {carrito.length > 0 && (
                <span className="cart-badge">{initialized ? carrito.length : '...'}</span>
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
                  {!initialized ? (
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
                                alt={item.nombre}
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                              />
                            </div>
                            <div className="item-details">
                              <h4 className="item-name">{item.nombre}</h4>
                              <div className="item-specs">
                                <span className="item-size">Talla: {item.talla}</span>
                                <span className="item-quantity">Cant: {item.cantidad}</span>
                              </div>
                              <div className="item-price">${item.precio.toLocaleString('es-CL')}</div>
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
                    disabled={!initialized || carrito.length === 0}
                  >
                    <i className="fas fa-shopping-cart"></i>
                    Ver Carrito
                  </button>
                  <button 
                    className="btn-checkout" 
                    onClick={goToCart}
                    disabled={!initialized || carrito.length === 0}
                  >
                    <i className="fas fa-credit-card"></i>
                    Finalizar Compra
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
