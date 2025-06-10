import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import '../Styles/DetalleProducto.css';

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCart();

  const [producto, setProducto] = useState(null);
  const [tallasDisponibles, setTallasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTallas, setMostrarTallas] = useState(false);
  const [tallaSeleccionada, setTallaSeleccionada] = useState({ id: '', nombre: '', stock: 0 });
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);

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
        const tallasConStock = dataTallas.filter(talla => talla.stock > 0);
        setTallasDisponibles(tallasConStock);
      })
      .catch(err => {
        console.error('Error al cargar detalle del producto o tallas:', err);
        setLoading(false);
      });
  }, [id]);

  const handleAgregarAlCarrito = async () => {
    if (!tallaSeleccionada.id) {
      toast.error('Por favor, selecciona una talla antes de agregar al carrito.');
      return;
    }

    setAgregandoCarrito(true);

    try {
      const success = await agregarAlCarrito(tallaSeleccionada.id, 1);
      
      if (success) {
        toast.success('Producto agregado al carrito');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.error('Error inesperado al agregar al carrito');
    } finally {
      setAgregandoCarrito(false);
    }
  };

  const handleSeleccionarTalla = (detalle) => {
    setTallaSeleccionada({
      id: detalle.id_detalle_producto,
      nombre: detalle.talla,
      stock: detalle.stock
    });
    setMostrarTallas(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando detalle del producto...</p>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="error-container">
        <p>Producto no encontrado.</p>
      </div>
    );
  }

  return (
    <section className="detalle-producto-container">
      <Link to={`/productos/categoria/${producto.categoria_id}`} className="back-link">
        &larr; Volver a {producto.nombre_categoria || 'Categoría'}
      </Link>

      <div className="producto-content">
        <div className="producto-image-container">
          <img src={producto.imagen_url} alt={producto.nombre_producto} className="producto-img" />
        </div>

        <div className="producto-info">
          <h1 className="producto-title">{producto.nombre_producto}</h1>
          <div className="producto-precio">${Number(producto.precio).toLocaleString('es-CL')}</div>

          <div className="talla-selector-container">
            <label className="talla-label">Selecciona tu talla:</label>
            <button
              onClick={() => setMostrarTallas(!mostrarTallas)}
              className={`talla-button ${tallaSeleccionada.nombre ? 'selected' : ''} ${mostrarTallas ? 'open' : ''}`}
            >
              <span>
                {tallaSeleccionada.nombre ? `Talla: ${tallaSeleccionada.nombre}` : 'Seleccionar talla'}
              </span>
            </button>

            {mostrarTallas && (
              <ul className="talla-list">
                {tallasDisponibles.map(detalle => (
                  <li
                    key={detalle.id_detalle_producto}
                    className={`talla-item ${detalle.id_detalle_producto === tallaSeleccionada.id ? 'active' : ''}`}
                    onClick={() => handleSeleccionarTalla(detalle)}
                  >
                    <span>Talla {detalle.talla}</span>
                    <span className={`stock-badge ${detalle.stock <= 3 ? 'very-low' : detalle.stock <= 10 ? 'low' : ''}`}>
                      {detalle.stock} disponibles
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {tallaSeleccionada.nombre && (
            <div className="stock-info selected">
              Stock disponible para talla {tallaSeleccionada.nombre}: {tallaSeleccionada.stock} unidades
            </div>
          )}

          <button 
            onClick={handleAgregarAlCarrito} 
            className="btn-agregar"
            disabled={agregandoCarrito || !tallaSeleccionada.id}
          >
            {agregandoCarrito ? 'Agregando...' : 'Agregar al carrito'}
          </button>

          {producto.descripcion && (
            <div className="producto-description">
              <strong>Descripción:</strong><br />
              {producto.descripcion}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DetalleProducto;