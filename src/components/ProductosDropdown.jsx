// ProductosDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ProductosDropdown = ({ categorias }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontWeight: '600',
          cursor: 'pointer',
          borderRadius: '6px',
          border: '1px solid transparent',
          backgroundColor: 'white',
          color: 'black',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#f97316')}
        onMouseLeave={e => (e.currentTarget.style.color = 'black')}
      >
        Productos
        <svg
          style={{
            width: '16px',
            height: '16px',
            transition: 'transform 0.3s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            marginTop: '6px',
            minWidth: '160px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {categorias.length === 0
            ? <li style={{ padding: '8px 12px', color: '#999' }}>Cargando...</li>
            : categorias.map(cat => (
                <li key={cat.id_categoria}>
                  <Link
                    to={`/productos/categoria/${cat.id_categoria}`}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'block',
                      padding: '8px 12px',
                      color: 'black',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f97316', e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white', e.currentTarget.style.color = 'black')}
                  >
                    {cat.nombre_categoria}
                  </Link>
                </li>
              ))}
        </ul>
      )}
    </div>
  );
};

export default ProductosDropdown;
