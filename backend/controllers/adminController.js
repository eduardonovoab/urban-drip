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
// Listar todos los productos con nombre de categoría
export const listarProductos = async (req, res) => {
  try {
    // Modificamos la consulta SQL para hacer un JOIN con la tabla de categorías
    const [productos] = await pool.query(`
      SELECT 
        p.id_producto, 
        p.nombre AS nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        p.estado, 
        p.precio, 
        c.nombre_categoria 
      FROM 
        producto p
      INNER JOIN 
        categoria c ON p.categoria_id_categoria = c.id_categoria
    `);

    // Verifica si productos tienen nombre_categoria antes de enviarlo
    console.log(productos); // Verificar la respuesta de los productos con la categoría
    res.json(productos); // Devolver los productos con su categoría
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};
export const obtenerMarcas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM marca'); // Ajusta la consulta si es necesario
    console.log('Marcas:', rows);  // Verifica que los datos se estén obteniendo correctamente desde la base de datos
    res.json(rows); // Devuelve las marcas como un JSON
  } catch (err) {
    console.error('Error al obtener marcas:', err);
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
// Listar productos con detalles y categoría
export const listarProductosConDetalles = async (req, res) => {
  try {
    // Consulta SQL corregida
    const query = `
      SELECT 
        p.id_producto, 
        p.nombre AS nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        p.estado, 
        pd.precio,    -- Obtener el precio desde la tabla producto_detalle
        c.nombre_categoria,    -- Obtener el nombre de la categoría desde la tabla categoria
        pd.id_detalle_producto, 
        pd.marca_id, 
        pd.talla_id, 
        pd.stock
      FROM 
        producto p
      INNER JOIN 
        categoria c ON p.categoria_id = c.id_categoria  -- Usar 'categoria_id' en lugar de 'categoria_id_categoria'
      INNER JOIN 
        producto_detalle pd ON p.id_producto = pd.producto_id  -- Usar 'producto_id' en lugar de 'producto_id_producto'
      WHERE 
        p.estado = 'activo';
    `;

    const [rows] = await pool.query(query);

    console.log('Productos con categorías:', rows);  // Verificar que los productos tienen la categoría

    res.json(rows);  // Enviar los productos con detalles y categoría
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos con detalles' });
  }
};