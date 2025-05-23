import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="border-t border-gray-300 bg-white shadow-sm fixed w-full top-0 left-0 z-50">
      <div className="navbar-container flex items-center justify-between max-w-7xl mx-auto p-4">
        {/* Logo */}
        <div className="navbar-logo flex-shrink-0">
          <Link to="/">
            <img
              src="https://i.ibb.co/wrdpCN4J/logo-tienda.png"
              alt="UrbanDrip Logo"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* Menú desktop */}
        <nav className="navbar-menu hidden md:flex space-x-8 items-center">
          <Link to="/" className="text-black font-semibold hover:text-orange-500 transition">Inicio</Link>
          <Link to="/productos" className="text-black font-semibold hover:text-orange-500 transition">Productos</Link>
          <Link to="/contacto" className="text-black font-semibold hover:text-orange-500 transition">Contacto</Link>
          <Link to="/login" className="text-black font-semibold hover:text-orange-500 transition">Ingresar</Link>
          <Link to="/perfil" className="text-black hover:text-orange-500 transition text-2xl ml-4" title="Perfil">
            <i className="fas fa-user-circle"></i>
          </Link>
          <Link to="/cart" className="text-black hover:text-orange-500 transition text-2xl ml-4" title="Carrito">
            <i className="fab fa-opencart"></i>
          </Link>
        </nav>
      </div>

      {/* Menú lateral móvil */}
      {sidebarOpen && (
        <nav className="md:hidden bg-white shadow-lg p-4 absolute top-full left-0 w-full border-t border-gray-300">
          <ul className="flex flex-col space-y-4 text-center">
            {['Inicio', 'Productos', 'Contacto', 'Ingresar', 'Perfil', 'Carrito'].map((item) => (
              <li key={item}>
                <Link
                  to={`/${item.toLowerCase() === 'inicio' ? '' : item.toLowerCase()}`}
                  onClick={() => setSidebarOpen(false)}
                  className="block text-black font-semibold hover:text-orange-600"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
