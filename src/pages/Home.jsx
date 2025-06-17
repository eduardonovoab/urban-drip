import React, { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Categorias from '../components/Categorias';
import ProductosDestacados from '../components/ProductosDestacados';
import Marcas from '../components/Marcas';

const Home = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Cargando productos desde:', 'http://localhost:3000/api/productos/productos-detalles');
        
        const response = await fetch('http://localhost:3000/api/productos/productos-detalles');
        
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // Verificar la estructura de los datos
        if (data && data.productos && Array.isArray(data.productos)) {
          setProductos(data.productos);
          console.log(`✅ ${data.productos.length} productos cargados correctamente`);
        } else if (Array.isArray(data)) {
          // Si la respuesta es directamente un array
          setProductos(data);
          console.log(`✅ ${data.length} productos cargados correctamente`);
        } else {
          console.warn('⚠️ Estructura de datos inesperada:', data);
          setProductos([]);
        }
        
      } catch (err) {
        console.error('❌ Error cargando productos:', err);
        setError(err.message);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  if (loading) {
    return (
      <div className="bg-white text-black min-h-screen">
        <Banner />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white text-black min-h-screen">
        <Banner />
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-red-800 font-semibold mb-2">Error al cargar productos</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-screen">
      <Banner />
      <Categorias />
      
      {/* Solo mostrar ProductosDestacados si hay productos */}
      {productos.length > 0 ? (
        <ProductosDestacados productos={productos} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No hay productos destacados disponibles</p>
        </div>
      )}
      
      {/* Sección de Marcas */}
      <Marcas />
    </div>
  );
};

export default Home;