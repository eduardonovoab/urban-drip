import React, { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Categorias from '../components/Categorias';
import ProductosDestacados from '../components/ProductosDestacados';
import Marcas from '../components/Marcas';  // Importamos el componente Marcas

const Home = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/productos-detalles')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => {
        console.error('Error cargando productos:', err);
        setProductos([]);
      });
  }, []);

  return (
    <div className="bg-white text-black min-h-screen">
      <Banner />
      <Categorias />
      <ProductosDestacados productos={productos} />
      
      {/* Sección de Marcas */}
      <Marcas />
    </div>
  );
};

export default Home;
