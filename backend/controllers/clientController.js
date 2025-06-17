// controllers/ClientController.js - CORREGIDO: CARRITO PERSISTENTE + COMUNA
import pool from '../config/db.js';

// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================

// Obtener todos los productos activos con detalles
export const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pd.id_detalle_producto, 
        p.nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        m.nombre_marca, 
        t.nombre_talla, 
        pd.precio, 
        pd.stock,
        c.nombre_categoria
      FROM producto_detalle pd
      JOIN producto p ON pd.producto_id_producto = p.id_producto
      JOIN marca m ON pd.marca_id_marca = m.id_marca
      JOIN talla t ON pd.talla_id_talla = t.id_talla
      JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
};

// ============================================
// FUNCIONES DE ESTADOS DE PEDIDO
// ============================================

// Obtener todos los estados de pedido
const getEstadosPedido = async () => {
  const [estados] = await pool.execute('SELECT * FROM estado_pedido');
  return estados;
};

// Obtener ID de estado por nombre
const getEstadoIdByName = async (nombreEstado) => {
  const [estado] = await pool.execute(
    'SELECT id_estado FROM estado_pedido WHERE nombre_estado = ?',
    [nombreEstado]
  );
  return estado.length > 0 ? estado[0].id_estado : null;
};

// Crear registro de cambio de estado
const crearCambioEstado = async (connection, pedidoId, estadoId, descripcion = '') => {
  await connection.execute(`
    INSERT INTO detalle_estado (fecha_cb_estado, descripcion_cb_estado, pedido_id_pedido, estado_pedido_id_estado)
    VALUES (NOW(), ?, ?, ?)
  `, [descripcion, pedidoId, estadoId]);
};

// Obtener estado actual de un pedido
const getEstadoActualPedido = async (pedidoId) => {
  const [estado] = await pool.execute(`
    SELECT ep.nombre_estado, ep.id_estado, de.fecha_cb_estado
    FROM detalle_estado de
    JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
    WHERE de.pedido_id_pedido = ?
    ORDER BY de.fecha_cb_estado DESC, de.id_detalle_estado DESC
    LIMIT 1
  `, [pedidoId]);
  
  return estado.length > 0 ? estado[0] : null;
};

// 🔥 FUNCIÓN PARA OBTENER USER ID - COMPATIBLE CON DIFERENTES ESTRUCTURAS DE JWT
const getUserId = (req) => {
  console.log('🔍 Verificando estructura del usuario en request:');
  console.log('req.user completo:', req.user);
  
  // Diferentes posibles estructuras del JWT
  if (req.user?.id_usuario) {
    console.log('✅ Usando req.user.id_usuario:', req.user.id_usuario);
    return req.user.id_usuario;
  } else if (req.user?.id) {
    console.log('✅ Usando req.user.id:', req.user.id);
    return req.user.id;
  } else if (req.user?.userId) {
    console.log('✅ Usando req.user.userId:', req.user.userId);
    return req.user.userId;
  } else if (req.user?.user_id) {
    console.log('✅ Usando req.user.user_id:', req.user.user_id);
    return req.user.user_id;
  } else {
    console.error('❌ No se encontró ID de usuario en ningún formato conocido');
    console.log('Propiedades disponibles en req.user:', Object.keys(req.user || {}));
    return null;
  }
};

// ============================================
// FUNCIONES DE CARRITO - CORREGIDAS
// ============================================

// 🔥 OBTENER CARRITO - CORREGIDO PARA PERSISTIR
export const obtenerCarrito = async (req, res) => {
  try {
    console.log('=== OBTENIENDO CARRITO ===');
    
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }
    
    console.log('👤 Usuario ID:', userId);
    
    // Buscar pedido en estado "Carrito"
    console.log('🔍 Buscando carrito existente...');
    
    const [carritoExistente] = await pool.execute(`
      SELECT DISTINCT p.id_pedido, p.total, p.fecha_pedido
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE p.usuario_id_usuario = ? AND ep.nombre_estado = 'Carrito'
      AND de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      ORDER BY p.id_pedido DESC
      LIMIT 1
    `, [userId]);

    console.log('🛒 Carritos encontrados:', carritoExistente.length);

    let carritoId;
    
    if (carritoExistente.length === 0) {
      console.log('🆕 Creando nuevo carrito...');
      
      // Crear nuevo carrito
      const [nuevoPedido] = await pool.execute(`
        INSERT INTO pedido (fecha_pedido, total, usuario_id_usuario)
        VALUES (NOW(), 0.00, ?)
      `, [userId]);
      
      carritoId = nuevoPedido.insertId;
      console.log('📦 Nuevo pedido creado con ID:', carritoId);
      
      // Obtener ID del estado "Carrito"
      const estadoCarritoId = await getEstadoIdByName('Carrito');
      console.log('🏷️ Estado Carrito ID:', estadoCarritoId);
      
      if (estadoCarritoId) {
        // Crear registro de estado
        await crearCambioEstado(pool, carritoId, estadoCarritoId, 'Carrito creado');
        console.log('✅ Estado de carrito creado');
      } else {
        console.error('❌ No se encontró el estado "Carrito" en la base de datos');
      }
      
    } else {
      carritoId = carritoExistente[0].id_pedido;
      console.log('♻️ Usando carrito existente ID:', carritoId);
    }

    // Obtener items del carrito con información completa
    console.log('📋 Obteniendo items del carrito...');
    
    const [itemsCarrito] = await pool.execute(`
      SELECT 
        dp.id_detalle,
        dp.cantidad,
        pd.id_detalle_producto,
        pd.precio,
        pd.stock,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        m.nombre_marca,
        t.nombre_talla,
        c.nombre_categoria,
        (dp.cantidad * pd.precio) as subtotal
      FROM detalle_pedido dp
      JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      JOIN producto p ON pd.producto_id_producto = p.id_producto
      JOIN marca m ON pd.marca_id_marca = m.id_marca
      JOIN talla t ON pd.talla_id_talla = t.id_talla
      JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      WHERE dp.pedido_id_pedido = ?
    `, [carritoId]);

    console.log(`🛍️ Items en carrito: ${itemsCarrito.length}`);

    const total = itemsCarrito.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    // Actualizar total en la base de datos si hay diferencia
    if (itemsCarrito.length > 0) {
      await pool.execute(`
        UPDATE pedido SET total = ? WHERE id_pedido = ?
      `, [total, carritoId]);
    }

    console.log('💰 Total calculado:', total);
    console.log('✅ Carrito obtenido exitosamente');

    res.json({
      success: true,
      carrito: {
        id_pedido: carritoId,
        items: itemsCarrito,
        total: total
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Agregar producto al carrito - CORREGIDO
export const agregarAlCarrito = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('=== AGREGANDO AL CARRITO ===');
    
    const userId = getUserId(req);
    const { detalle_producto_id, cantidad = 1 } = req.body;

    console.log('👤 Usuario ID:', userId);
    console.log('🛍️ Producto ID:', detalle_producto_id);
    console.log('📦 Cantidad:', cantidad);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    // Validar entrada
    if (!detalle_producto_id || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos'
      });
    }

    // Verificar stock disponible
    const [stockCheck] = await connection.execute(`
      SELECT stock, precio FROM producto_detalle WHERE id_detalle_producto = ?
    `, [detalle_producto_id]);

    if (stockCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (stockCheck[0].stock < cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    console.log('✅ Stock verificado:', stockCheck[0].stock);

    // Obtener o crear carrito
    const [carritoExistente] = await connection.execute(`
      SELECT DISTINCT p.id_pedido
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE p.usuario_id_usuario = ? AND ep.nombre_estado = 'Carrito'
      AND de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      ORDER BY p.id_pedido DESC
      LIMIT 1
    `, [userId]);

    let carritoId;
    
    if (carritoExistente.length === 0) {
      console.log('🆕 Creando carrito para agregar producto...');
      
      // Crear nuevo carrito
      const [nuevoPedido] = await connection.execute(`
        INSERT INTO pedido (fecha_pedido, total, usuario_id_usuario)
        VALUES (NOW(), 0.00, ?)
      `, [userId]);
      
      carritoId = nuevoPedido.insertId;
      
      const estadoCarritoId = await getEstadoIdByName('Carrito');
      if (estadoCarritoId) {
        await crearCambioEstado(connection, carritoId, estadoCarritoId, 'Carrito creado');
      }
      
      console.log('📦 Nuevo carrito creado:', carritoId);
    } else {
      carritoId = carritoExistente[0].id_pedido;
      console.log('♻️ Usando carrito existente:', carritoId);
    }

    // Verificar si el producto ya está en el carrito
    const [itemExistente] = await connection.execute(`
      SELECT id_detalle, cantidad FROM detalle_pedido 
      WHERE pedido_id_pedido = ? AND producto_detalle_id_detalle_producto = ?
    `, [carritoId, detalle_producto_id]);

    if (itemExistente.length > 0) {
      // Actualizar cantidad existente
      const nuevaCantidad = itemExistente[0].cantidad + cantidad;
      
      if (stockCheck[0].stock < nuevaCantidad) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente para la cantidad total'
        });
      }

      await connection.execute(`
        UPDATE detalle_pedido SET cantidad = ? 
        WHERE id_detalle = ?
      `, [nuevaCantidad, itemExistente[0].id_detalle]);
      
      console.log(`🔄 Cantidad actualizada: ${itemExistente[0].cantidad} → ${nuevaCantidad}`);
    } else {
      // Agregar nuevo item
      await connection.execute(`
        INSERT INTO detalle_pedido (cantidad, producto_detalle_id_detalle_producto, pedido_id_pedido)
        VALUES (?, ?, ?)
      `, [cantidad, detalle_producto_id, carritoId]);
      
      console.log('➕ Nuevo item agregado al carrito');
    }

    // Actualizar total del pedido
    await connection.execute(`
      UPDATE pedido 
      SET total = (
        SELECT COALESCE(SUM(dp.cantidad * pd.precio), 0)
        FROM detalle_pedido dp
        JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
        WHERE dp.pedido_id_pedido = ?
      )
      WHERE id_pedido = ?
    `, [carritoId, carritoId]);

    await connection.commit();

    console.log('✅ Producto agregado al carrito exitosamente');

    res.json({
      success: true,
      message: 'Producto agregado al carrito exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al agregar al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Actualizar cantidad de producto en carrito - CORREGIDO
export const actualizarCantidadCarrito = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = getUserId(req);
    const { detalle_id, cantidad } = req.body;

    console.log('=== ACTUALIZANDO CANTIDAD EN CARRITO ===');
    console.log('👤 Usuario ID:', userId);
    console.log('🆔 Detalle ID:', detalle_id);
    console.log('📦 Nueva cantidad:', cantidad);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    if (!detalle_id || cantidad < 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos'
      });
    }

    // Verificar que el item pertenece al usuario y está en carrito
    const [itemCheck] = await connection.execute(`
      SELECT dp.id_detalle, pd.stock, p.id_pedido
      FROM detalle_pedido dp
      JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      WHERE dp.id_detalle = ? AND p.usuario_id_usuario = ?
      AND EXISTS (
        SELECT 1 FROM detalle_estado de
        JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
        WHERE de.pedido_id_pedido = p.id_pedido AND ep.nombre_estado = 'Carrito'
        AND de.id_detalle_estado = (
          SELECT MAX(de2.id_detalle_estado)
          FROM detalle_estado de2
          WHERE de2.pedido_id_pedido = p.id_pedido
        )
      )
    `, [detalle_id, userId]);

    if (itemCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }

    if (cantidad === 0) {
      // Eliminar item del carrito
      await connection.execute(`
        DELETE FROM detalle_pedido WHERE id_detalle = ?
      `, [detalle_id]);
      
      console.log('🗑️ Item eliminado del carrito');
    } else {
      // Verificar stock
      if (itemCheck[0].stock < cantidad) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente'
        });
      }

      // Actualizar cantidad
      await connection.execute(`
        UPDATE detalle_pedido SET cantidad = ? WHERE id_detalle = ?
      `, [cantidad, detalle_id]);
      
      console.log(`🔄 Cantidad actualizada a: ${cantidad}`);
    }

    // Actualizar total del pedido
    const carritoId = itemCheck[0].id_pedido;
    await connection.execute(`
      UPDATE pedido 
      SET total = (
        SELECT COALESCE(SUM(dp.cantidad * pd.precio), 0)
        FROM detalle_pedido dp
        JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
        WHERE dp.pedido_id_pedido = ?
      )
      WHERE id_pedido = ?
    `, [carritoId, carritoId]);

    await connection.commit();

    console.log('✅ Carrito actualizado exitosamente');

    res.json({
      success: true,
      message: 'Carrito actualizado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al actualizar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Eliminar producto del carrito - CORREGIDO
export const eliminarDelCarrito = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = getUserId(req);
    const { detalle_producto_id } = req.params;

    console.log('=== ELIMINANDO DEL CARRITO ===');
    console.log('👤 Usuario ID:', userId);
    console.log('🛍️ Producto ID:', detalle_producto_id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    // Verificar que el item pertenece al usuario y obtener el pedido
    const [itemCheck] = await connection.execute(`
      SELECT dp.id_detalle, p.id_pedido
      FROM detalle_pedido dp
      JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      WHERE dp.producto_detalle_id_detalle_producto = ? AND p.usuario_id_usuario = ?
      AND EXISTS (
        SELECT 1 FROM detalle_estado de
        JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
        WHERE de.pedido_id_pedido = p.id_pedido AND ep.nombre_estado = 'Carrito'
        AND de.id_detalle_estado = (
          SELECT MAX(de2.id_detalle_estado)
          FROM detalle_estado de2
          WHERE de2.pedido_id_pedido = p.id_pedido
        )
      )
    `, [detalle_producto_id, userId]);

    if (itemCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }

    // Eliminar item
    await connection.execute(`
      DELETE FROM detalle_pedido WHERE id_detalle = ?
    `, [itemCheck[0].id_detalle]);

    console.log('🗑️ Item eliminado del carrito');

    // Actualizar total del pedido
    const carritoId = itemCheck[0].id_pedido;
    await connection.execute(`
      UPDATE pedido 
      SET total = (
        SELECT COALESCE(SUM(dp.cantidad * pd.precio), 0)
        FROM detalle_pedido dp
        JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
        WHERE dp.pedido_id_pedido = ?
      )
      WHERE id_pedido = ?
    `, [carritoId, carritoId]);

    await connection.commit();

    console.log('✅ Producto eliminado del carrito exitosamente');

    res.json({
      success: true,
      message: 'Producto eliminado del carrito'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al eliminar del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Limpiar carrito completo - CORREGIDO
export const limpiarCarrito = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = getUserId(req);

    console.log('=== LIMPIANDO CARRITO ===');
    console.log('👤 Usuario ID:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    // Obtener carrito del usuario
    const [carrito] = await connection.execute(`
      SELECT DISTINCT p.id_pedido
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE p.usuario_id_usuario = ? AND ep.nombre_estado = 'Carrito'
      AND de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      ORDER BY p.id_pedido DESC
      LIMIT 1
    `, [userId]);

    if (carrito.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay carrito activo'
      });
    }

    console.log('🛒 Carrito encontrado:', carrito[0].id_pedido);

    // Eliminar todos los items del carrito
    const [deleteResult] = await connection.execute(`
      DELETE FROM detalle_pedido WHERE pedido_id_pedido = ?
    `, [carrito[0].id_pedido]);

    console.log(`🗑️ ${deleteResult.affectedRows} items eliminados del carrito`);

    // Actualizar total a 0
    await connection.execute(`
      UPDATE pedido SET total = 0.00 WHERE id_pedido = ?
    `, [carrito[0].id_pedido]);

    await connection.commit();

    console.log('✅ Carrito limpiado exitosamente');

    res.json({
      success: true,
      message: 'Carrito limpiado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al limpiar carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// FUNCIONES DE PEDIDOS Y COMPRAS - CORREGIDAS
// ============================================

// Finalizar compra (convertir carrito en pedido) - CORREGIDO
export const finalizarCompra = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = getUserId(req);
    const { metodo_pago } = req.body;

    console.log('=== FINALIZANDO COMPRA ===');
    console.log('👤 Usuario ID:', userId);
    console.log('💳 Método de pago:', metodo_pago);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    // Obtener carrito
    const [carrito] = await connection.execute(`
      SELECT DISTINCT p.id_pedido, p.total
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE p.usuario_id_usuario = ? AND ep.nombre_estado = 'Carrito'
      AND de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      ORDER BY p.id_pedido DESC
      LIMIT 1
    `, [userId]);

    if (carrito.length === 0 || carrito[0].total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay productos en el carrito'
      });
    }

    const carritoId = carrito[0].id_pedido;
    console.log('🛒 Carrito ID:', carritoId);
    console.log('💰 Total:', carrito[0].total);

    // Verificar stock final
    const [items] = await connection.execute(`
      SELECT dp.cantidad, pd.id_detalle_producto, pd.stock, p.nombre_producto
      FROM detalle_pedido dp
      JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      JOIN producto p ON pd.producto_id_producto = p.id_producto
      WHERE dp.pedido_id_pedido = ?
    `, [carritoId]);

    console.log(`📦 Verificando stock para ${items.length} productos...`);

    // Validar stock
    for (const item of items) {
      if (item.stock < item.cantidad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${item.nombre_producto}. Disponible: ${item.stock}, Solicitado: ${item.cantidad}`
        });
      }
    }

    console.log('✅ Stock verificado correctamente');

    // Cambiar estado del pedido a "Pendiente"
    const estadoPendienteId = await getEstadoIdByName('Pendiente');
    
    if (estadoPendienteId) {
      await crearCambioEstado(connection, carritoId, estadoPendienteId, 'Pedido creado - Pendiente de pago');
      console.log('📋 Estado cambiado a Pendiente');
    } else {
      console.error('❌ No se encontró el estado "Pendiente"');
    }

    // Crear registro de venta
    await connection.execute(`
      INSERT INTO venta (fecha_venta, metodo_pago, pedido_id_pedido)
      VALUES (NOW(), ?, ?)
    `, [metodo_pago, carritoId]);

    console.log('🧾 Registro de venta creado');

    await connection.commit();

    console.log('✅ Compra finalizada exitosamente');

    res.json({
      success: true,
      message: 'Pedido creado exitosamente - Pendiente de pago',
      pedido_id: carritoId
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al finalizar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
// ============================================
// FUNCIONES DE USUARIO - CORREGIDAS CON COMUNA
// ============================================

// Obtener datos del usuario con comuna - CORREGIDO
export const getDatosUsuario = async (req, res) => {
  try {
    const userId = getUserId(req);

    console.log('=== OBTENIENDO DATOS DE USUARIO ===');
    console.log('👤 Usuario ID:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    const [usuario] = await pool.execute(`
      SELECT 
        u.id_usuario,
        u.nombre_usuario,
        u.apellido_usuario,
        u.correo,
        u.rol,
        u.estado_usuario,
        u.rut,
        u.direccion,
        u.region_id_region,
        u.comuna_id_comuna,
        r.nombre_region,
        c.nombre_comuna
      FROM usuario u
      LEFT JOIN region r ON u.region_id_region = r.id_region
      LEFT JOIN comuna c ON u.comuna_id_comuna = c.id_comuna
      WHERE u.id_usuario = ?
    `, [userId]);

    if (usuario.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    // No devolver la contraseña
    const { contrasena, ...usuarioSinPassword } = usuario[0];

    console.log('✅ Datos de usuario obtenidos');

    res.json({
      success: true,
      usuario: usuarioSinPassword
    });

  } catch (error) {
    console.error('❌ Error al obtener datos del usuario:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los datos del usuario', 
      error: error.message 
    });
  }
};

// Modificar los datos del usuario con comuna - CORREGIDO
export const modificarDatosUsuario = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { 
      nombre_usuario, 
      apellido_usuario, 
      correo, 
      direccion, 
      region_id_region,
      comuna_id_comuna
    } = req.body;

    console.log('=== MODIFICANDO DATOS DE USUARIO ===');
    console.log('👤 Usuario ID:', userId);
    console.log('📍 Región ID:', region_id_region);
    console.log('🏘️ Comuna ID:', comuna_id_comuna);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    // Validar que se proporcionen todos los campos requeridos
    if (!nombre_usuario || !apellido_usuario || !correo || !direccion || !region_id_region || !comuna_id_comuna) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Verificar que el correo no esté en uso por otro usuario
    const [correoExistente] = await pool.execute(`
      SELECT id_usuario FROM usuario 
      WHERE correo = ? AND id_usuario != ?
    `, [correo, userId]);

    if (correoExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está en uso por otro usuario'
      });
    }

    // Verificar que la comuna pertenezca a la región seleccionada
    const [comunaValida] = await pool.execute(`
      SELECT id_comuna FROM comuna 
      WHERE id_comuna = ? AND region_id_region = ?
    `, [comuna_id_comuna, region_id_region]);

    if (comunaValida.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La comuna seleccionada no pertenece a la región especificada'
      });
    }

    const [result] = await pool.execute(`
      UPDATE usuario 
      SET nombre_usuario = ?, apellido_usuario = ?, correo = ?, 
          direccion = ?, region_id_region = ?, comuna_id_comuna = ?
      WHERE id_usuario = ?
    `, [nombre_usuario, apellido_usuario, correo, direccion, region_id_region, comuna_id_comuna, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado o no se realizaron cambios' 
      });
    }

    console.log('✅ Datos de usuario modificados exitosamente');

    res.json({ 
      success: true,
      message: 'Datos modificados correctamente' 
    });

  } catch (error) {
    console.error('❌ Error al modificar datos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al modificar los datos', 
      error: error.message 
    });
  }
};
// AGREGAR ESTAS FUNCIONES AL ClientController.j
// Obtener historial de pedidos con información completa de productos - ACTUALIZADA
export const getHistorialPedidos = async (req, res) => {
  try {
    const userId = getUserId(req);

    console.log('=== OBTENIENDO HISTORIAL DE PEDIDOS MEJORADO ===');
    console.log('👤 Usuario ID:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }
    
    // Obtener pedidos con información de productos
    const [pedidos] = await pool.execute(`
      SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        ep.nombre_estado,
        ep.descripcion_estado,
        de.fecha_cb_estado,
        de.descripcion_cb_estado,
        COUNT(dp.id_detalle) as cantidad_productos,
        GROUP_CONCAT(
          CONCAT(
            prod.nombre_producto, ' (', 
            m.nombre_marca, ' - ', 
            t.nombre_talla, ') x', 
            dp.cantidad
          ) SEPARATOR ', '
        ) as productos_resumen
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.pedido_id_pedido
      LEFT JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      LEFT JOIN producto prod ON pd.producto_id_producto = prod.id_producto
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE p.usuario_id_usuario = ?
      AND de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      AND ep.nombre_estado != 'Carrito'
      GROUP BY p.id_pedido, p.fecha_pedido, p.total, ep.nombre_estado, ep.descripcion_estado, de.fecha_cb_estado, de.descripcion_cb_estado
      ORDER BY p.fecha_pedido DESC
    `, [userId]);

    // Para cada pedido, obtener las imágenes de los productos (primera imagen)
    const pedidosConImagenes = await Promise.all(
      pedidos.map(async (pedido) => {
        const [primeraImagen] = await pool.execute(`
          SELECT prod.imagen_url
          FROM detalle_pedido dp
          JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
          JOIN producto prod ON pd.producto_id_producto = prod.id_producto
          WHERE dp.pedido_id_pedido = ?
          LIMIT 1
        `, [pedido.id_pedido]);

        return {
          ...pedido,
          imagen_principal: primeraImagen.length > 0 ? primeraImagen[0].imagen_url : null
        };
      })
    );

    console.log(`📋 Pedidos encontrados: ${pedidos.length}`);

    res.json({
      success: true,
      pedidos: pedidosConImagenes
    });

  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de pedidos',
      error: error.message
    });
  }
};

// Nueva función: Obtener detalle completo de un pedido específico
export const getDetallePedido = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { pedido_id } = req.params;

    console.log('=== OBTENIENDO DETALLE DE PEDIDO ===');
    console.log('👤 Usuario ID:', userId);
    console.log('📦 Pedido ID:', pedido_id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    // Verificar que el pedido pertenece al usuario
    const [pedidoInfo] = await pool.execute(`
      SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        u.nombre_usuario,
        u.apellido_usuario,
        u.direccion,
        r.nombre_region,
        c.nombre_comuna
      FROM pedido p
      JOIN usuario u ON p.usuario_id_usuario = u.id_usuario
      LEFT JOIN region r ON u.region_id_region = r.id_region
      LEFT JOIN comuna c ON u.comuna_id_comuna = c.id_comuna
      WHERE p.id_pedido = ? AND p.usuario_id_usuario = ?
    `, [pedido_id, userId]);

    if (pedidoInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Obtener productos del pedido
    const [productos] = await pool.execute(`
      SELECT 
        dp.cantidad,
        pd.precio,
        prod.nombre_producto,
        prod.descripcion,
        prod.imagen_url,
        m.nombre_marca,
        t.nombre_talla,
        c.nombre_categoria,
        (dp.cantidad * pd.precio) as subtotal
      FROM detalle_pedido dp
      JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      JOIN producto prod ON pd.producto_id_producto = prod.id_producto
      JOIN marca m ON pd.marca_id_marca = m.id_marca
      JOIN talla t ON pd.talla_id_talla = t.id_talla
      JOIN categoria c ON prod.categoria_id_categoria = c.id_categoria
      WHERE dp.pedido_id_pedido = ?
      ORDER BY prod.nombre_producto
    `, [pedido_id]);

    // Obtener historial completo de estados del pedido
    const [seguimiento] = await pool.execute(`
      SELECT 
        de.fecha_cb_estado,
        de.descripcion_cb_estado,
        ep.id_estado,
        ep.nombre_estado,
        ep.descripcion_estado
      FROM detalle_estado de
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.pedido_id_pedido = ?
      ORDER BY de.fecha_cb_estado ASC, de.id_detalle_estado ASC
    `, [pedido_id]);

    // Obtener información de venta si existe
    const [venta] = await pool.execute(`
      SELECT fecha_venta, metodo_pago
      FROM venta
      WHERE pedido_id_pedido = ?
    `, [pedido_id]);

    console.log('✅ Detalle de pedido obtenido');

    res.json({
      success: true,
      pedido: {
        ...pedidoInfo[0],
        productos: productos,
        seguimiento: seguimiento,
        venta: venta.length > 0 ? venta[0] : null
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener detalle del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle del pedido',
      error: error.message
    });
  }
};

// Nueva función: Obtener seguimiento de estados de un pedido
export const getSeguimientoPedido = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { pedido_id } = req.params;

    console.log('=== OBTENIENDO SEGUIMIENTO DE PEDIDO ===');
    console.log('👤 Usuario ID:', userId);
    console.log('📦 Pedido ID:', pedido_id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado correctamente'
      });
    }

    // Verificar que el pedido pertenece al usuario
    const [pedidoCheck] = await pool.execute(`
      SELECT id_pedido FROM pedido 
      WHERE id_pedido = ? AND usuario_id_usuario = ?
    `, [pedido_id, userId]);

    if (pedidoCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Obtener todos los estados posibles del sistema
    const [todosLosEstados] = await pool.execute(`
      SELECT id_estado, nombre_estado, descripcion_estado
      FROM estado_pedido
      WHERE nombre_estado IN ('Pendiente', 'Pagado', 'Enviado', 'Entregado')
      ORDER BY id_estado
    `);

    // Obtener el historial de estados del pedido
    const [historialEstados] = await pool.execute(`
      SELECT 
        de.fecha_cb_estado,
        de.descripcion_cb_estado,
        ep.id_estado,
        ep.nombre_estado,
        ep.descripcion_estado
      FROM detalle_estado de
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.pedido_id_pedido = ?
      AND ep.nombre_estado IN ('Pendiente', 'Pagado', 'Enviado', 'Entregado')
      ORDER BY de.fecha_cb_estado ASC, de.id_detalle_estado ASC
    `, [pedido_id]);

    // Crear el seguimiento con todos los estados y marcar cuáles están completados
    const seguimientoCompleto = todosLosEstados.map(estado => {
      const estadoRealizado = historialEstados.find(h => h.id_estado === estado.id_estado);
      
      return {
        id_estado: estado.id_estado,
        nombre_estado: estado.nombre_estado,
        descripcion_estado: estado.descripcion_estado,
        completado: !!estadoRealizado,
        fecha_completado: estadoRealizado ? estadoRealizado.fecha_cb_estado : null,
        descripcion_cb_estado: estadoRealizado ? estadoRealizado.descripcion_cb_estado : null
      };
    });

    // Obtener el estado actual (último estado registrado)
    const estadoActual = historialEstados.length > 0 
      ? historialEstados[historialEstados.length - 1] 
      : null;

    console.log('✅ Seguimiento obtenido');

    res.json({
      success: true,
      seguimiento: {
        estado_actual: estadoActual,
        historial_completo: historialEstados,
        progreso_estados: seguimientoCompleto
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener seguimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el seguimiento del pedido',
      error: error.message
    });
  }
};