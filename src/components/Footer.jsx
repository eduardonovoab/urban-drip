import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} UrbanDrip. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
