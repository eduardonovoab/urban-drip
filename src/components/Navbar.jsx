import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/categorias')
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error('Error al cargar categorías:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-t border-gray-300 bg-white shadow-sm fixed w-full top-0 left-0 z-50">
      <div className="navbar-container flex items-center justify-between max-w-7xl mx-auto p-4">
        <div className="navbar-logo flex-shrink-0">
          <Link to="/">
            <img
              src="https://i.ibb.co/wrdpCN4J/logo-tienda.png"
              alt="UrbanDrip Logo"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <nav className="navbar-menu hidden md:flex gap-8 items-center">
          <Link to="/" className="nav-link">Inicio</Link>

          {/* Contenedor relativo para posicionar dropdown */}
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
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}
              >
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
                        <Link
                          to={`/productos/categoria/${cat.id_categoria}`}
                          className="dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
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
          <Link to="/login" className="nav-link">Ingresar</Link>

          <Link to="/perfil" className="text-black hover:text-orange-500 transition text-2xl ml-4" title="Perfil">
            <i className="fas fa-user-circle"></i>
          </Link>

          <Link to="/cart" className="text-black hover:text-orange-500 transition text-2xl ml-4" title="Carrito">
            <i className="fab fa-opencart"></i>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
