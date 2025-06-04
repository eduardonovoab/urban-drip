import pool from '../config/db.js';

// Obtener todos los productos activos con detalles
export const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pd.id_detalle_producto, p.nombre, p.descripcion, p.imagen_url, m.nombre AS marca, t.talla, pd.precio, pd.stock
      FROM producto_detalle pd
      JOIN producto p ON pd.producto_id = p.id_producto
      JOIN marca m ON pd.marca_id = m.id_marca
      JOIN talla t ON pd.talla_id = t.id_talla
      WHERE p.estado = 'activo'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
};
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

    // 🔧 CONSULTA CORREGIDA: Agregando JOIN con tabla TALLA
    const [productos] = await pool.query(
      `SELECT 
        cp.cantidad, 
        p.nombre, 
        pd.precio, 
        p.imagen_url, 
        pd.id_detalle_producto,
        t.talla
       FROM carrito_producto cp
       JOIN producto_detalle pd ON cp.detalle_producto_id = pd.id_detalle_producto
       JOIN producto p ON pd.producto_id = p.id_producto
       JOIN talla t ON pd.talla_id = t.id_talla
       WHERE cp.carrito_id = ?`,
      [id_carrito]
    );

    res.json({ productos });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener carrito', error: err.message });
  }
};
// Controlador en el backend para agregar producto al carrito
export const agregarAlCarrito = async (req, res) => {
  const { detalle_producto_id, cantidad } = req.body;  // Ya no recibes talla aquí
  const id_usuario = req.user.id_usuario;

  try {
    // Verificar que el detalle_producto exista y tenga stock suficiente
    const [producto] = await pool.query(
      'SELECT stock FROM producto_detalle WHERE id_detalle_producto = ?',
      [detalle_producto_id]
    );

    if (!producto.length) {
      return res.status(400).json({ message: 'Producto detalle no encontrado' });
    }

    if (producto[0].stock < cantidad) {
      return res.status(400).json({ message: 'No hay suficiente stock disponible' });
    }

    // Buscar carrito activo del usuario
    const [carritos] = await pool.query(
      'SELECT * FROM carrito WHERE id_usuario = ? AND estado = "activo"',
      [id_usuario]
    );

    let id_carrito;
    if (carritos.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO carrito (id_usuario, estado) VALUES (?, "activo")',
        [id_usuario]
      );
      id_carrito = result.insertId;
    } else {
      id_carrito = carritos[0].id_carrito;
    }

    // Verificar si el producto ya está en el carrito (mismo detalle_producto_id)
    const [productoEnCarrito] = await pool.query(
      'SELECT * FROM carrito_producto WHERE carrito_id = ? AND detalle_producto_id = ?',
      [id_carrito, detalle_producto_id]
    );

    if (productoEnCarrito.length > 0) {
      // Actualizar cantidad si ya existe
      await pool.query(
        'UPDATE carrito_producto SET cantidad = cantidad + ? WHERE carrito_id = ? AND detalle_producto_id = ?',
        [cantidad, id_carrito, detalle_producto_id]
      );
    } else {
      // Insertar nuevo producto en carrito
      await pool.query(
        'INSERT INTO carrito_producto (carrito_id, detalle_producto_id, cantidad) VALUES (?, ?, ?)',
        [id_carrito, detalle_producto_id, cantidad]
      );
    }

    // Descontar stock en producto_detalle
    await pool.query(
      'UPDATE producto_detalle SET stock = stock - ? WHERE id_detalle_producto = ?',
      [cantidad, detalle_producto_id]
    );

    res.json({ message: 'Producto agregado al carrito' });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};


export const eliminarProductoDelCarrito = async (req, res) => {
  const { id } = req.params; // id_detalle_producto que se quiere eliminar
  const id_usuario = req.user.id_usuario;

  try {
    // Obtener carrito activo
    const [carritos] = await pool.query(
      'SELECT * FROM carrito WHERE id_usuario = ? AND estado = "activo"',
      [id_usuario]
    );
    if (carritos.length === 0) return res.status(400).json({ message: 'No tienes carrito activo' });

    const id_carrito = carritos[0].id_carrito;

    // Obtener el producto en el carrito
    const [productoCarrito] = await pool.query(
      'SELECT cantidad FROM carrito_producto WHERE carrito_id = ? AND detalle_producto_id = ?',
      [id_carrito, id]
    );

    if (productoCarrito.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en carrito' });
    }

    const cantidadActual = productoCarrito[0].cantidad;

    if (cantidadActual > 1) {
      // Si hay más de 1 unidad, descontar 1 unidad del carrito y restaurar stock 1
      await pool.query(
        'UPDATE carrito_producto SET cantidad = cantidad - 1 WHERE carrito_id = ? AND detalle_producto_id = ?',
        [id_carrito, id]
      );
      await pool.query(
        'UPDATE producto_detalle SET stock = stock + 1 WHERE id_detalle_producto = ?',
        [id]
      );
      return res.json({ message: 'Una unidad del producto fue eliminada del carrito' });
    } else {
      // Si solo queda 1, eliminar el producto del carrito y restaurar stock completo (1)
      await pool.query(
        'DELETE FROM carrito_producto WHERE carrito_id = ? AND detalle_producto_id = ?',
        [id_carrito, id]
      );
      await pool.query(
        'UPDATE producto_detalle SET stock = stock + 1 WHERE id_detalle_producto = ?',
        [id]
      );
      return res.json({ message: 'Producto eliminado del carrito' });
    }
  } catch (error) {
    console.error('Error al eliminar producto del carrito:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
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
// Obtener historial de pedidos
export const getHistorialPedidos = async (req, res) => {
  const id_usuario = req.user.id_usuario;
  
  console.log('🔍 Obteniendo historial para usuario ID:', id_usuario);
  
  try {
    const [pedidos] = await pool.query('SELECT * FROM pedido WHERE id_usuario = ?', [id_usuario]);
    
    console.log('📊 Pedidos encontrados:', pedidos.length);
    
    // ✅ CORRECCIÓN: En lugar de 404, enviar 200 con array vacío
    if (pedidos.length === 0) {
      console.log('ℹ️ No hay pedidos para este usuario, enviando array vacío');
      return res.status(200).json([]); // ← CAMBIO AQUÍ
    }
    
    console.log('✅ Enviando pedidos:', pedidos);
    res.json(pedidos);
  } catch (error) {
    console.error('❌ Error en getHistorialPedidos:', error);
    res.status(500).json({ message: 'Error al obtener historial de pedidos', error: error.message });
  }
};

// Obtener datos del usuario
export const getDatosUsuario = async (req, res) => {
  const id_usuario = req.user.id_usuario;

  try {
    const [usuario] = await pool.query('SELECT * FROM usuario WHERE id_usuario = ?', [id_usuario]);
    if (usuario.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(usuario[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los datos del usuario', error: error.message });
  }
};

// Modificar los datos del usuario
export const modificarDatosUsuario = async (req, res) => {
  const id_usuario = req.user.id_usuario;
  const { nombre, apellido, correo, contrasena, direccion, ciudad, region_id, comuna_id } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, contrasena = ?, direccion = ?, ciudad = ?, region_id = ?, comuna_id = ? WHERE id_usuario = ?',
      [nombre, apellido, correo, contrasena, direccion, ciudad, region_id, comuna_id, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o no se realizaron cambios' });
    }

    res.json({ message: 'Datos modificados correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al modificar los datos', error: error.message });
  }
};