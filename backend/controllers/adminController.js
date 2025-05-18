import pool from '../config/db.js';

// Obtener producto por ID con detalles
export const getProductoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [producto] = await pool.query('SELECT * FROM producto WHERE id_producto = ?', [id]);
    if (producto.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const [detalles] = await pool.query('SELECT * FROM producto_detalle WHERE producto_id = ?', [id]);
    res.json({ producto: producto[0], detalles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Crear un producto nuevo
export const addProduct = async (req, res) => {
  const { nombre, descripcion, imagen_url, estado, categoria_id, detalles } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO producto (nombre, descripcion, imagen_url, estado, categoria_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, imagen_url, estado, categoria_id]
    );

    const id_producto = result.insertId;

    for (const detalle of detalles) {
      const { marca_id, talla_id, precio, stock } = detalle;
      await conn.query(
        'INSERT INTO producto_detalle (producto_id, marca_id, talla_id, precio, stock) VALUES (?, ?, ?, ?, ?)',
        [id_producto, marca_id, talla_id, precio, stock]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Producto creado correctamente' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// Actualizar producto
export const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen_url, estado, categoria_id, detalles } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE producto SET nombre = ?, descripcion = ?, imagen_url = ?, estado = ?, categoria_id = ? WHERE id_producto = ?',
      [nombre, descripcion, imagen_url, estado, categoria_id, id]
    );

    await conn.query('DELETE FROM producto_detalle WHERE producto_id = ?', [id]);

    for (const detalle of detalles) {
      const { marca_id, talla_id, precio, stock } = detalle;
      await conn.query(
        'INSERT INTO producto_detalle (producto_id, marca_id, talla_id, precio, stock) VALUES (?, ?, ?, ?, ?)',
        [id, marca_id, talla_id, precio, stock]
      );
    }

    await conn.commit();
    res.json({ mensaje: 'Producto actualizado correctamente' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  } finally {
    conn.release();
  }
};

// Eliminar producto
export const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query('DELETE FROM producto_detalle WHERE producto_id = ?', [id]);
    await conn.query('DELETE FROM producto WHERE id_producto = ?', [id]);

    await conn.commit();
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  } finally {
    conn.release();
  }
};

// Listar todos los productos
export const listarProductos = async (req, res) => {
  try {
    const [productos] = await pool.query('SELECT * FROM producto');
    res.json(productos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener todas las marcas
export const obtenerMarcas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM marca');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
};

// Obtener todas las tallas
export const obtenerTallas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM talla');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tallas' });
  }
};

// Obtener todas las categorías
export const obtenerCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categoria');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};
export const listarProductosConDetalles = async (req, res) => {
  try {
    // Consulta SQL que une producto con detalle_producto y marca
    const query = `
      SELECT p.id_producto, p.nombre AS nombre_producto, p.imagen_url, d.precio, m.nombre AS nombre_marca
      FROM producto p
      JOIN producto_detalle d ON p.id_producto = d.producto_id
      JOIN marca m ON d.marca_id = m.id_marca
      WHERE p.estado = 'activo'
    `;

    const [rows] = await pool.query(query);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos con detalles' });
  }
};