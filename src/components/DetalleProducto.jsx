import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/DetalleProducto.css'; 

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [tallasDisponibles, setTallasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTallas, setMostrarTallas] = useState(false);
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');

  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:3000/api/producto-detalle/${id}`)
      .then(res => res.json())
      .then(data => {
        setProducto(data);
        setLoading(false);

        return fetch(`http://localhost:3000/api/producto-detalles/producto/${data.id_producto}`);
      })
      .then(res => res.json())
      .then(dataTallas => {
        // Filtrar tallas que tengan stock disponible
        const tallasConStock = dataTallas.filter(talla => talla.stock > 0);
        setTallasDisponibles(tallasConStock);
      })
      .catch(err => {
        console.error('Error al cargar detalle del producto o tallas:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-center mt-10">Cargando detalle del producto...</p>;
  if (!producto) return <p className="text-center mt-10">Producto no encontrado.</p>;

  const cambiarTalla = (detalleId, talla) => {
    setTallaSeleccionada(talla);
    setMostrarTallas(false);
  };

  return (
    <section className="detalle-producto-container">
      <Link to={`/productos/categoria/${producto.categoria_id}`} className="back-link">
        &larr; Volver a {producto.nombre_categoria || 'Categoría'}
      </Link>

      <h2 className="producto-title">{producto.nombre_producto}</h2>

      <div className="producto-image-container">
        <img
          src={producto.imagen_url}
          alt={producto.nombre_producto}
          className="producto-img"
        />
      </div>

      <p className="producto-precio">
        ${Number(producto.precio).toLocaleString('es-CL')}
      </p>

      <div className="talla-selector-container">
        <button
          onClick={() => setMostrarTallas(!mostrarTallas)}
          className="talla-button"
        >
          Talla: {tallaSeleccionada || producto.nombre_talla || 'No disponible'}
        </button>

        {mostrarTallas && (
          <ul className="talla-list">
            {tallasDisponibles.map(detalle => (
              <li
                key={detalle.id_detalle_producto}
                className={`talla-item ${detalle.talla === tallaSeleccionada ? 'active' : ''}`}
                onClick={() => cambiarTalla(detalle.id_detalle_producto, detalle.talla)}
              >
                {detalle.talla} — Stock: {detalle.stock ?? '0'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="stock-info">
        Stock disponible: {producto.stock ?? 'No disponible'}
      </p>

      <p className="producto-description">{producto.descripcion}</p>
    </section>
  );
};

export default DetalleProducto;
