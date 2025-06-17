// components/CarritoIcon.js
import React, { useState } from 'react';
import { useCarrito } from '../contexts/CarritoContext';
import Carrito from './Carrito';
import './CarritoIcon.css';

const CarritoIcon = () => {
  const { getCantidadTotal, carrito } = useCarrito();
  const [isCarritoOpen, setIsCarritoOpen] = useState(false);

  const cantidadTotal = getCantidadTotal();

  const handleOpenCarrito = () => {
    setIsCarritoOpen(true);
  };

  const handleCloseCarrito = () => {
    setIsCarritoOpen(false);
  };

  return (
    <>
      <div className="carrito-icon-container" onClick={handleOpenCarrito}>
        <div className="carrito-icon">
          🛒
          {cantidadTotal > 0 && (
            <span className="carrito-badge">{cantidadTotal}</span>
          )}
        </div>
        {carrito.total > 0 && (
          <span className="carrito-total">
            ${carrito.total.toLocaleString()}
          </span>
        )}
      </div>

      <Carrito 
        isOpen={isCarritoOpen} 
        onClose={handleCloseCarrito} 
      />
    </>
  );
};

export default CarritoIcon;