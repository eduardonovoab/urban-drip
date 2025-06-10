import React, { createContext, useState, useContext } from 'react';

// Crea el contexto del carrito
const CarritoContext = createContext();

// Crea un proveedor del carrito para envolver tu aplicación
export const CarritoProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]);

  // Función para agregar al carrito
  const agregarAlCarrito = (producto) => {
    setCarrito((prevCarrito) => [...prevCarrito, producto]);
  };

  // Función para eliminar del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito((prevCarrito) => prevCarrito.filter(item => item.id !== id));
  };

  return (
    <CarritoContext.Provider value={{ carrito, agregarAlCarrito, eliminarDelCarrito }}>
      {children}
    </CarritoContext.Provider>
  );
};

// Hook para usar el carrito en otros componentes
export const useCarrito = () => useContext(CarritoContext);
