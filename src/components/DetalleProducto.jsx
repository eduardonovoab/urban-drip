import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/DetalleProducto.css'; // Mantén el estilo que ya tienes

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [tallasDisponibles, setTallasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTallas, setMostrarTallas] = useState(false);
  const [tallaSeleccionada, setTallaSeleccionada] = useState({ id: '', nombre: '' });
  const [rol, setRol] = useState('');

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (usuario) {
      setRol(usuario.rol);  // Guardamos el rol de usuario
    }

    setLoading(true);

    // Obtener detalle del producto
    fetch(`http://localhost:3000/api/producto-detalle/${id}`)
      .then(res => res.json())
      .then(data => {
        setProducto(data);
        setLoading(false);

        // Obtener las tallas disponibles para el producto
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
    // Validación de que se seleccionó una talla
    if (!tallaSeleccionada.id) {
      toast.error('Por favor, selecciona una talla antes de agregar al carrito.');
      return;
    }

    if (rol !== 'cliente') {
      toast.error('Solo los usuarios con rol cliente pueden agregar productos al carrito');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Error: Usuario no autenticado');
      return;
    }

    const requestBody = {
      detalle_producto_id: tallaSeleccionada.id, // Usamos el id_detalle_producto como el identificador
      cantidad: 1, // Asegúrate de manejar la cantidad según lo necesites
    };

    try {
      const response = await fetch('http://localhost:3000/api/cliente/carrito', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Error al agregar al carrito');
      }
    } catch (error) {
      toast.error('Error al agregar al carrito');
      console.error('Error al agregar al carrito:', error);
    }
  };

  const handleSeleccionarTalla = (detalle) => {
    setTallaSeleccionada({
      id: detalle.id_detalle_producto,
      nombre: detalle.talla
    });
    setMostrarTallas(false); // Cerrar el dropdown después de seleccionar
  };

  if (loading) return <p className="text-center mt-10">Cargando detalle del producto...</p>;
  if (!producto) return <p className="text-center mt-10">Producto no encontrado.</p>;

  return (
    <section className="detalle-producto-container">
      <Link to={`/productos/categoria/${producto.categoria_id}`} className="back-link">
        &larr; Volver a {producto.nombre_categoria || 'Categoría'}
      </Link>

      <h2 className="producto-title">{producto.nombre_producto}</h2>

      <div className="producto-image-container">
        <img src={producto.imagen_url} alt={producto.nombre_producto} className="producto-img" />
      </div>

      <p className="producto-precio">${Number(producto.precio).toLocaleString('es-CL')}</p>

      <div className="talla-selector-container">
        <button
          onClick={() => setMostrarTallas(!mostrarTallas)}
          className="talla-button"
        >
          {tallaSeleccionada.nombre ? `Talla seleccionada: ${tallaSeleccionada.nombre}` : 'Seleccionar talla'}
        </button>

        {mostrarTallas && (
          <ul className="talla-list">
            {tallasDisponibles.map(detalle => (
              <li
                key={detalle.id_detalle_producto}
                className={`talla-item ${detalle.id_detalle_producto === tallaSeleccionada.id ? 'active' : ''}`}
                onClick={() => handleSeleccionarTalla(detalle)}
              >
                {detalle.talla} — Stock: {detalle.stock ?? '0'}
              </li>
            ))}
          </ul>
        )}
      </div>

      {rol === 'cliente' ? (
        <button onClick={handleAgregarAlCarrito} className="btn-agregar">
          Agregar al carrito
        </button>
      ) : (
        <p>Debes ser cliente para agregar al carrito.</p>
      )}

      <p className="stock-info">Stock disponible: {producto.stock ?? 'No disponible'}</p>
      <p className="producto-description">{producto.descripcion}</p>
    </section>
  );
};

export default DetalleProducto;