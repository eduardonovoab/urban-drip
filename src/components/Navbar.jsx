import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/NavBar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const [carritoLoading, setCarritoLoading] = useState(false);
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
    if (user) {
      fetchCarrito();
    }
  }, [user]);

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

  const fetchCarrito = async () => {
    setCarritoLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No hay token disponible');
        setCarrito([]);
        return;
      }

      const response = await fetch('http://localhost:3000/api/cliente/carrito', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Endpoint del carrito no encontrado - probablemente no implementado aún');
          setCarrito([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta no es JSON válido');
      }

      const data = await response.json();
      setCarrito(data.productos || []);
      
    } catch (err) {
      console.error('Error al cargar el carrito:', err);
      
      if (err.message.includes('404') || err.message.includes('not found')) {
        console.warn('El endpoint del carrito aún no está implementado');
      } else {
        toast.error('Error al cargar el carrito');
      }
      
      setCarrito([]);
    } finally {
      setCarritoLoading(false);
    }
  };

  const toggleCarrito = () => {
    setCarritoVisible(!carritoVisible);
  };

  const goToCart = () => {
    navigate('/cart');
    setCarritoVisible(false);
  };

  const eliminarProductoCarrito = async (detalle_producto_id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/cliente/carrito/${detalle_producto_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Producto eliminado del carrito');
        fetchCarrito(); // Recargar carrito
      } else {
        toast.error('Error al eliminar el producto');
      }
    } catch (error) {
      toast.error('Error al eliminar el producto');
      console.error('Error:', error);
    }
  };

  // Calcular total del carrito
  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
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
          <Link to="/login" className="nav-link">Ingresar</Link>
        )}

        <Link to="/perfil" className="profile-icon" title="Perfil">
          <i className="fas fa-user-circle"></i>
        </Link>

        {user?.rol === 'cliente' && (
          <div className="cart-container-nav" ref={carritoRef}>
            <div onClick={toggleCarrito} className="cart-icon">
              <i className="fas fa-shopping-cart"></i>
              {carrito.length > 0 && (
                <span className="cart-badge">{carritoLoading ? '...' : carrito.length}</span>
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
                  {carritoLoading ? (
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
                                eliminarProductoCarrito(item.id_detalle_producto);
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
                          <span>Subtotal ({carrito.length} producto{carrito.length > 1 ? 's' : ''})</span>
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
                    disabled={carritoLoading || carrito.length === 0}
                  >
                    <i className="fas fa-shopping-cart"></i>
                    Ver Carrito
                  </button>
                  <button 
                    className="btn-checkout" 
                    onClick={goToCart}
                    disabled={carritoLoading || carrito.length === 0}
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