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

export const agregarTallaProducto = async (req, res) => {
  const { id_producto } = req.params;  // ID del producto
  const { talla_id, stock } = req.body; // Talla y stock a agregar

  try {
    // 1. Verificar que el producto exista
    const [producto] = await pool.query('SELECT * FROM producto WHERE id_producto = ?', [id_producto]);

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // 2. Verificar que la talla exista
    const [talla] = await pool.query('SELECT * FROM talla WHERE id_talla = ?', [talla_id]);

    if (!talla) {
      return res.status(404).json({ message: 'Talla no encontrada' });
    }

    // 3. Verificar si esa talla ya está asociada con el producto
    const [detalleExistente] = await pool.query(
      'SELECT * FROM producto_detalle WHERE producto_id = ? AND talla_id = ?',
      [id_producto, talla_id]
    );

    if (detalleExistente.length > 0) {
      return res.status(400).json({ message: 'La talla ya está asociada a este producto' });
    }

    // 4. Insertar la talla y el stock para este producto
    await pool.query(
      'INSERT INTO producto_detalle (producto_id, talla_id, stock) VALUES (?, ?, ?)',
      [id_producto, talla_id, stock]
    );

    res.status(201).json({ message: 'Talla agregada correctamente al producto' });
  } catch (error) {
    console.error('Error al agregar talla:', error);
    res.status(500).json({ message: 'Error al agregar talla al producto' });
  }
};
// Obtener todas las tallas disponibles para un producto
export const getTallasByProducto = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const tallas = await pool.query(`
      SELECT t.id_talla, t.talla, dp.stock 
      FROM detalle_producto dp
      JOIN talla t ON dp.talla_id = t.id_talla
      WHERE dp.producto_id = ?
    `, [id_producto]);
    res.json(tallas[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Agregar una nueva talla con stock a un producto existente
export const  addTallaToProducto = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const { talla_id, stock, precio } = req.body;
    
    // Verificar si ya existe esta talla para el producto
    const existente = await pool.query(
      'SELECT * FROM detalle_producto WHERE producto_id = ? AND talla_id = ?',
      [id_producto, talla_id]
    );
    
    if (existente[0].length > 0) {
      return res.status(400).json({ message: 'Esta talla ya existe para el producto' });
    }
    
    // Insertar nueva talla con stock
    await pool.query(
      'INSERT INTO detalle_producto (producto_id, talla_id, stock, precio) VALUES (?, ?, ?, ?)',
      [id_producto, talla_id, stock, precio]
    );
    
    res.json({ message: 'Talla agregada correctamente' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Actualizar stock de una talla existente
export const updateStockTalla = async (req, res) => {
  try {
    const { id_detalle_producto } = req.params;
    const { stock } = req.body;
    
    await pool.query(
      'UPDATE detalle_producto SET stock = ? WHERE id_detalle_producto = ?',
      [stock, id_detalle_producto]
    );
    
    res.json({ message: 'Stock actualizado correctamente' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};