import pool from '../config/db.js';  // Conexión a la base de datos (ajustar a tu configuración)

// Obtener detalles del producto por ID
export const getDetalleProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const [producto] = await pool.query('SELECT * FROM producto WHERE id_producto = ?', [id]);
    
    if (producto.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const [detalles] = await pool.query('SELECT * FROM producto_detalle WHERE producto_id = ?', [id]);

    res.json({ producto: producto[0], detalles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener detalle del producto' });
  }
};

// Obtener las tallas disponibles de un producto por ID
export const getTallasDisponibles = async (req, res) => {
  const { id } = req.params;

  try {
    const [tallas] = await pool.query(
      `SELECT pd.*, t.talla 
              FROM producto_detalle pd 
              INNER JOIN talla t ON pd.talla_id = t.id_talla
       WHERE pd.producto_id = ?`, 
      [id]
    );

    if (tallas.length === 0) {
      return res.status(404).json({ error: 'No hay tallas disponibles para este producto' });
    }

    res.json(tallas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las tallas' });
  }
};
