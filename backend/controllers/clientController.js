import pool from '../config/db.js';

// Obtener todos los productos activos con detalles
export const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pd.id_detalle_producto, p.nombre, p.descripcion, p.imagen_url, m.nombre AS marca, t.talla, pd.precio, pd.stock
       FROM producto_detalle pd
       JOIN producto p ON pd.producto_id = p.id_producto
       JOIN marca m ON pd.marca_id = m.id_marca
       JOIN talla t ON pd.talla_id = t.id_talla
       WHERE p.estado = 'activo'`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
};

// Obtener carrito del usuario
export const getCarrito = async (req, res) => {
  const id_usuario = req.user.id_usuario;  // asumiendo id_usuario en token

  try {
    // Buscar carrito activo
    const [carritos] = await pool.query(
      'SELECT * FROM carrito WHERE id_usuario = ? AND estado = "activo"',
      [id_usuario]
    );

    if (carritos.length === 0) return res.json({ productos: [] });

    const id_carrito = carritos[0].id_carrito;

    // Obtener productos en carrito
    const [productos] = await pool.query(
      `SELECT cp.cantidad, p.nombre, pd.precio, p.imagen_url
       FROM carrito_producto cp
       JOIN producto_detalle pd ON cp.detalle_producto_id = pd.id_detalle_producto
       JOIN producto p ON pd.producto_id = p.id_producto
       WHERE cp.carrito_id = ?`,
      [id_carrito]
    );

    res.json({ productos });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener carrito', error: err.message });
  }
};

// Agregar producto al carrito
export const agregarAlCarrito = async (req, res) => {
  const { detalle_producto_id, cantidad } = req.body;
  const id_usuario = req.user.id_usuario;

  try {
    const [carritos] = await pool.query(
      'SELECT * FROM carrito WHERE id_usuario = ? AND estado = "activo"',
      [id_usuario]
    );

    let id_carrito;
    if (carritos.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO carrito (id_usuario, estado, id_usuario2) VALUES (?, ?, ?)',
        [id_usuario, 'activo', id_usuario]
      );
      id_carrito = result.insertId;
    } else {
      id_carrito = carritos[0].id_carrito;
    }

    // Agregar producto al carrito
    await pool.query(
      'INSERT INTO carrito_producto (carrito_id, detalle_producto_id, cantidad) VALUES (?, ?, ?)',
      [id_carrito, detalle_producto_id, cantidad]
    );

    res.json({ message: 'Producto agregado al carrito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar al carrito', error: err.message });
  }
};

// Realizar pedido desde carrito
export const realizarPedido = async (req, res) => {
  const id_usuario = req.user.id_usuario;
  const { metodo_pago } = req.body;

  try {
    const [carritos] = await pool.query(
      'SELECT * FROM carrito WHERE id_usuario = ? AND estado = "activo"',
      [id_usuario]
    );

    if (carritos.length === 0) return res.status(400).json({ message: 'Carrito no encontrado' });

    const id_carrito = carritos[0].id_carrito;

    const [items] = await pool.query(
      'SELECT * FROM carrito_producto WHERE carrito_id = ?',
      [id_carrito]
    );

    if (items.length === 0) return res.status(400).json({ message: 'El carrito está vacío' });

    let total = 0;
    for (const item of items) {
      const [detalle] = await pool.query(
        'SELECT precio FROM producto_detalle WHERE id_detalle_producto = ?',
        [item.detalle_producto_id]
      );
      total += detalle[0].precio * item.cantidad;
    }

    const [pedido] = await pool.query(
      'INSERT INTO pedido (id_usuario, fecha_pedido, total, estado, id_usuario2) VALUES (?, NOW(), ?, ?, ?)',
      [id_usuario, total, 'pendiente', id_usuario]
    );

    const id_pedido = pedido.insertId;

    for (const item of items) {
      const [detalle] = await pool.query(
        'SELECT precio FROM producto_detalle WHERE id_detalle_producto = ?',
        [item.detalle_producto_id]
      );
      await pool.query(
        'INSERT INTO detalle_pedido (pedido_id, detalle_producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [id_pedido, item.detalle_producto_id, item.cantidad, detalle[0].precio]
      );
    }

    await pool.query(
      'INSERT INTO venta (pedido_id, fecha_venta, metodo_pago) VALUES (?, NOW(), ?)',
      [id_pedido, metodo_pago]
    );

    // Vaciar carrito
    await pool.query('DELETE FROM carrito_producto WHERE carrito_id = ?', [id_carrito]);
    await pool.query('UPDATE carrito SET estado = "cerrado" WHERE id_carrito = ?', [id_carrito]);

    res.json({ message: 'Pedido realizado con éxito' });
  } catch (err) {
    res.status(500).json({ message: 'Error al realizar el pedido', error: err.message });
  }
};
