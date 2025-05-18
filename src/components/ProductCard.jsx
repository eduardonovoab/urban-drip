import React from 'react';

const ProductCard = ({ producto }) => {
  const { nombre, precio, imagen } = producto;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 w-64 cursor-pointer">
      <div className="overflow-hidden h-64">
        <img
          src={imagen}
          alt={nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 text-center">
        <h3 className="text-lg font-semibold mb-2">{nombre}</h3>
        <p className="text-orange-500 font-bold text-xl">${precio.toLocaleString('es-CL')}</p>
      </div>
    </div>
  );
};

export default ProductCard;
