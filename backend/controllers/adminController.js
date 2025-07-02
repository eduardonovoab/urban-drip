import pool from '../config/db.js';

export const getAdminDashboard = (req, res) => {
  try {
    res.json({ message: 'Bienvenido al Dashboard de Admin' });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el Dashboard de Admin' });
  }
};

// Crear un producto nuevo - CORREGIDO 
// Crear un producto nuevo - CORREGIDO
export const addProduct = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { nombre, descripcion, imagen_url, categoria_id, detalles } = req.body;

    console.log('📥 Datos recibidos:', { nombre, descripcion, imagen_url, categoria_id, detalles });

    // 🔍 Validaciones básicas
    if (!nombre || !descripcion || !categoria_id || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios: nombre, descripcion, categoria_id y detalles son requeridos'
      });
    }

    // Validar que cada detalle tenga los campos necesarios
    for (let i = 0; i < detalles.length; i++) {
      const detalle = detalles[i];
      if (!detalle.marca_id || !detalle.talla_id || !detalle.precio || detalle.stock === undefined) {
        return res.status(400).json({
          error: `Detalle ${i + 1}: marca_id, talla_id, precio y stock son obligatorios`
        });
      }
    }

    await connection.beginTransaction();

    // 📝 PASO 1: Insertar el producto principal
    console.log('🔄 Insertando producto principal...');
    const [productResult] = await connection.execute(
      `INSERT INTO producto (nombre_producto, descripcion, imagen_url, categoria_id_categoria) 
       VALUES (?, ?, ?, ?)`,
      [nombre.trim(), descripcion.trim(), imagen_url?.trim() || '', categoria_id]
    );

    const productoId = productResult.insertId;
    console.log('✅ Producto creado con ID:', productoId);

    // 📦 PASO 2: Insertar las variantes (detalles de producto)
    console.log('🔄 Insertando variantes del producto...');
    const detalleIds = [];

    for (const detalle of detalles) {
      // Verificar que la combinación marca-talla no exista para este producto
      const [existingDetail] = await connection.execute(
        `SELECT id_detalle_producto FROM producto_detalle 
         WHERE producto_id_producto = ? AND marca_id_marca = ? AND talla_id_talla = ?`,
        [productoId, detalle.marca_id, detalle.talla_id]
      );

      if (existingDetail.length > 0) {
        throw new Error(`Ya existe una variante con marca ${detalle.marca_id} y talla ${detalle.talla_id} para este producto`);
      }

      // Insertar el detalle del producto
      const [detalleResult] = await connection.execute(
        `INSERT INTO producto_detalle (precio, stock, marca_id_marca, producto_id_producto, talla_id_talla) 
         VALUES (?, ?, ?, ?, ?)`,
        [detalle.precio, detalle.stock, detalle.marca_id, productoId, detalle.talla_id]
      );

      const detalleId = detalleResult.insertId;
      console.log(`🔍 Detalle insertado con ID: ${detalleId}`);

      // VERIFICAR que el detalle se insertó correctamente
      const [verificarDetalle] = await connection.execute(
        `SELECT id_detalle_producto FROM producto_detalle WHERE id_detalle_producto = ?`,
        [detalleId]
      );

      if (verificarDetalle.length === 0) {
        throw new Error(`Error: No se pudo verificar la inserción del detalle con ID ${detalleId}`);
      }

      detalleIds.push({
        detalleId,
        tallaId: detalle.talla_id
      });

      console.log(`✅ Variante creada y verificada - Detalle ID: ${detalleId}, Marca: ${detalle.marca_id}, Talla: ${detalle.talla_id}`);
    }

    // 🏷️ PASO 3: Establecer el estado inicial para cada variante
    console.log('🔄 Estableciendo estados iniciales...');

    // Primero verificamos que existe el estado "Disponible" (ID = 1)
    // Si no existe, lo creamos
    const [estadoDisponible] = await connection.execute(
      `SELECT id_estado FROM estado_producto WHERE nombre_estado = 'Disponible' LIMIT 1`
    );

    let estadoId;
    if (estadoDisponible.length === 0) {
      // Crear el estado "Disponible" si no existe
      const [estadoResult] = await connection.execute(
        `INSERT INTO estado_producto (nombre_estado, descripcion_estado) 
         VALUES ('Disponible', 'Producto disponible para la venta')`
      );
      estadoId = estadoResult.insertId;
      console.log('✅ Estado "Disponible" creado con ID:', estadoId);
    } else {
      estadoId = estadoDisponible[0].id_estado;
      console.log('✅ Estado "Disponible" encontrado con ID:', estadoId);
    }

    // Insertar el estado inicial para cada variante - CORREGIDO
    // Estructura de tabla detalle_estado_pro:
    // - id_detalle_estado (AUTO_INCREMENT)
    // - fecha_cb_estado (date)
    // - descripcion_cb_estado (varchar(250))
    // - producto_detalle_id_detalle_producto (int)
    // - estado_producto_id_estado (int)

    for (const { detalleId } of detalleIds) {
      console.log(`🔄 Insertando estado para detalle ID: ${detalleId} con estado ID: ${estadoId}`);

      try {
        const [estadoResult] = await connection.execute(
          `INSERT INTO detalle_estado_pro 
           (fecha_cb_estado, descripcion_cb_estado, producto_detalle_id_detalle_producto, estado_producto_id_estado) 
           VALUES (CURDATE(), 'Estado inicial del producto', ?, ?)`,
          [detalleId, estadoId]
        );

        console.log(`✅ Estado inicial establecido para variante ${detalleId}, resultado:`, estadoResult);
      } catch (estadoError) {
        console.error(`❌ Error específico al insertar estado para detalle ${detalleId}:`, estadoError);

        // Verificar si el detalle realmente existe antes de fallar
        const [checkDetalle] = await connection.execute(
          `SELECT id_detalle_producto FROM producto_detalle WHERE id_detalle_producto = ?`,
          [detalleId]
        );

        if (checkDetalle.length === 0) {
          throw new Error(`El detalle con ID ${detalleId} no existe en producto_detalle`);
        }

        // Verificar si el estado existe
        const [checkEstado] = await connection.execute(
          `SELECT id_estado FROM estado_producto WHERE id_estado = ?`,
          [estadoId]
        );

        if (checkEstado.length === 0) {
          throw new Error(`El estado con ID ${estadoId} no existe en estado_producto`);
        }

        // Si ambos existen, re-lanzar el error original
        throw estadoError;
      }
    }

    await connection.commit();

    // 📊 Respuesta exitosa con información completa
    res.status(201).json({
      message: 'Producto agregado exitosamente con todas sus variantes y estados',
      producto: {
        id: productoId,
        nombre,
        descripcion,
        imagen_url: imagen_url || '',
        categoria_id,
        variantes: detalleIds.length,
        estado: 'Disponible'
      }
    });

    console.log('🎉 Producto agregado completamente:', {
      productoId,
      variantes: detalleIds.length,
      estado: 'Establecido'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al agregar producto:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: 'Ya existe un producto con esa combinación de datos'
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        error: 'Uno de los IDs referenciados (categoría, marca o talla) no existe'
      });
    }

    res.status(500).json({
      error: error.message || 'Error interno del servidor al agregar el producto'
    });
  } finally {
    connection.release();
  }
};
// Función para actualizar el estado de una variante específica
export const actualizarEstadoVariante = async (req, res) => {
  try {
    const { detalleId } = req.params;
    const { estado_id, descripcion } = req.body;

    if (!estado_id) {
      return res.status(400).json({ error: 'El estado_id es obligatorio' });
    }

    const [result] = await pool.execute(
      `INSERT INTO detalle_estado_pro 
       (fecha_cb_estado, descripcion_cb_estado, talla_id_talla, producto_detalle_id_detalle_producto, estado_producto_id_estado) 
       SELECT CURDATE(), ?, pd.talla_id_talla, ?, ?
       FROM producto_detalle pd 
       WHERE pd.id_detalle_producto = ?`,
      [descripcion || 'Cambio de estado', detalleId, estado_id, detalleId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }

    res.json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado de variante:', error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

// Obtener producto por ID con detalles - CORREGIDO
export const getProductoById = async (req, res) => {
  const { id } = req.params;

  try {
    // CORREGIDO: usar nombres de columna correctos
    const [productoRows] = await pool.query(`
      SELECT 
        p.id_producto, 
        p.nombre_producto,
        p.descripcion,
        p.imagen_url, 
        c.nombre_categoria 
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      WHERE p.id_producto = ?`, [id]);

    if (productoRows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // CORREGIDO: usar nombres de columna correctos
    const [detallesRows] = await pool.query(`
      SELECT 
        pd.id_detalle_producto, 
        pd.marca_id_marca, 
        pd.talla_id_talla, 
        pd.precio, 
        pd.stock,
        m.nombre_marca,
        t.nombre_talla
      FROM producto_detalle pd
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE pd.producto_id_producto = ?
      ORDER BY t.nombre_talla`, [id]);

    console.log('🔍 Producto obtenido:', productoRows[0]);
    console.log('🔍 Detalles obtenidos:', detallesRows);

    // Estructurar respuesta
    const producto = {
      ...productoRows[0],
      detalles: detallesRows.map(detalle => ({
        id_detalle_producto: detalle.id_detalle_producto,
        marca_id: detalle.marca_id_marca,
        talla_id: detalle.talla_id_talla,
        precio: detalle.precio,
        stock: detalle.stock,
        marca_nombre: detalle.nombre_marca,
        talla_nombre: detalle.nombre_talla
      }))
    };

    res.json(producto);

  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Actualizar producto - CORREGIDO
export const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen_url, categoria_id, detalles } = req.body;

  console.log('🔍 Datos recibidos para actualización:', {
    id, nombre, descripcion, imagen_url, categoria_id, detalles
  });

  if (!nombre && !descripcion && !imagen_url && !categoria_id && !detalles) {
    return res.status(400).json({ message: 'No hay datos para actualizar' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Buscar producto actual - CORREGIDO
    const [productoActualArr] = await conn.query(
      'SELECT * FROM producto WHERE id_producto = ?', [id]
    );

    if (productoActualArr.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const productoActual = productoActualArr[0];

    // 2. Actualizar datos básicos del producto - CORREGIDO
    const nuevoNombre = nombre ?? productoActual.nombre_producto;
    const nuevaDescripcion = descripcion ?? productoActual.descripcion;
    const nuevaImagenUrl = imagen_url ?? productoActual.imagen_url;
    const nuevaCategoriaId = categoria_id ?? productoActual.categoria_id_categoria;

    await conn.query(
      `UPDATE producto SET 
       nombre_producto = ?, 
       descripcion = ?, 
       imagen_url = ?, 
       categoria_id_categoria = ? 
       WHERE id_producto = ?`,
      [nuevoNombre, nuevaDescripcion, nuevaImagenUrl, nuevaCategoriaId, id]
    );

    console.log('✅ Producto básico actualizado');

    // 3. Manejar detalles (tallas)
    if (Array.isArray(detalles) && detalles.length > 0) {
      console.log('🔍 Procesando detalles:', detalles);

      // Obtener detalles existentes - CORREGIDO
      const [detallesExistentes] = await conn.query(
        'SELECT id_detalle_producto, marca_id_marca, talla_id_talla, precio, stock FROM producto_detalle WHERE producto_id_producto = ?',
        [id]
      );

      console.log('🔍 Detalles existentes en BD:', detallesExistentes);

      // Separar detalles a actualizar vs crear nuevos
      const detallesParaActualizar = [];
      const detallesParaCrear = [];
      const idsDetallesEnviados = [];

      detalles.forEach(detalle => {
        if (detalle.id_detalle_producto && detalle.id_detalle_producto !== null) {
          detallesParaActualizar.push(detalle);
          idsDetallesEnviados.push(detalle.id_detalle_producto);
        } else {
          detallesParaCrear.push(detalle);
        }
      });

      // Actualizar detalles existentes - CORREGIDO
      for (const detalle of detallesParaActualizar) {
        console.log('🔄 Actualizando detalle ID:', detalle.id_detalle_producto);
        await conn.query(
          `UPDATE producto_detalle SET 
           marca_id_marca = ?, 
           talla_id_talla = ?, 
           precio = ?, 
           stock = ? 
           WHERE id_detalle_producto = ? AND producto_id_producto = ?`,
          [detalle.marca_id, detalle.talla_id, detalle.precio, detalle.stock, detalle.id_detalle_producto, id]
        );
      }

      // Crear nuevos detalles - CORREGIDO
      for (const detalle of detallesParaCrear) {
        console.log('➕ Creando nuevo detalle:', detalle);
        await conn.query(
          `INSERT INTO producto_detalle (producto_id_producto, marca_id_marca, talla_id_talla, precio, stock) VALUES (?, ?, ?, ?, ?)`,
          [id, detalle.marca_id, detalle.talla_id, detalle.precio, detalle.stock]
        );
      }

      // Eliminar detalles que ya no están en la lista enviada
      const detallesAEliminar = detallesExistentes.filter(
        detalle => !idsDetallesEnviados.includes(detalle.id_detalle_producto)
      );

      if (detallesAEliminar.length > 0) {
        const detallesIdsAEliminar = detallesAEliminar.map(detalle => detalle.id_detalle_producto);
        const placeholders = detallesIdsAEliminar.map(() => '?').join(',');
        await conn.query(
          `DELETE FROM producto_detalle WHERE producto_id_producto = ? AND id_detalle_producto IN (${placeholders})`,
          [id, ...detallesIdsAEliminar]
        );
        console.log('🗑️ Detalles eliminados que no están en la lista enviada');
      }
    }

    await conn.commit();
    console.log('✅ Transacción completada exitosamente');

    res.status(200).json({
      message: 'Producto actualizado con éxito',
      producto_id: id
    });

  } catch (error) {
    await conn.rollback();
    console.error('❌ Error al actualizar el producto:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    conn.release();
  }
};

// Eliminar producto - CORREGIDO
export const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // CORREGIDO: usar nombres de columna correctos
    await conn.query('DELETE FROM producto_detalle WHERE producto_id_producto = ?', [id]);
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

// Obtener todas las marcas
export const obtenerMarcas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM marca ORDER BY nombre_marca');
    console.log('🏷️ Marcas obtenidas:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener marcas:', err);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
};

// Obtener todas las tallas
export const obtenerTallas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM talla ORDER BY nombre_talla');
    console.log('📏 Tallas obtenidas:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener tallas:', err);
    res.status(500).json({ error: 'Error al obtener tallas' });
  }
};

// Obtener todas las categorías
export const obtenerCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categoria ORDER BY nombre_categoria');
    console.log('📂 Categorías obtenidas:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// Obtener categoría por ID
export const obtenerCategoriaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM categoria WHERE id_categoria = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

// Obtener marca por ID
export const obtenerMarcaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM marca WHERE id_marca = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener marca:', error);
    res.status(500).json({ error: 'Error al obtener marca' });
  }
};

// Listar usuarios
export const listarUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT id_usuario, nombre_usuario, apellido_usuario, correo, rol, estado_usuario FROM usuario ORDER BY id_usuario'
    );
    res.json(usuarios);
  } catch (error) {
    console.error('❌ Error al cargar usuarios:', error);
    res.status(500).json({ error: 'Error al cargar usuarios' });
  }
};

// Actualizar estado del usuario
export const actualizarEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (estado !== 'activo' && estado !== 'inactivo') {
    return res.status(400).json({ message: 'El estado debe ser "activo" o "inactivo"' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE usuario SET estado_usuario = ? WHERE id_usuario = ?',
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: `El estado del usuario ha sido actualizado a ${estado}` });
  } catch (error) {
    console.error('❌ Error al cambiar el estado del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getProductoDetallePorId = async (req, res) => {
  const { id } = req.params;

  try {
    // CORREGIDO: consulta con la estructura correcta
    const [productoRows] = await pool.query(`
      SELECT 
        p.id_producto, 
        p.nombre_producto,
        p.descripcion,
        p.imagen_url, 
        c.nombre_categoria 
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      WHERE p.id_producto = ?`, [id]);

    if (productoRows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Detalles del producto
    const [detallesRows] = await pool.query(`
      SELECT 
        pd.id_detalle_producto, 
        pd.marca_id_marca, 
        pd.talla_id_talla, 
        pd.precio, 
        pd.stock,
        m.nombre_marca,
        t.nombre_talla
      FROM producto_detalle pd
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE pd.producto_id_producto = ?`, [id]);

    const producto = {
      ...productoRows[0],
      detalles: detallesRows.map(detalle => ({
        id_detalle_producto: detalle.id_detalle_producto,
        marca_id: detalle.marca_id_marca,
        talla_id: detalle.talla_id_talla,
        precio: detalle.precio,
        stock: detalle.stock,
        marca_nombre: detalle.nombre_marca,
        talla_nombre: detalle.nombre_talla
      }))
    };

    res.json(producto);

  } catch (error) {
    console.error('Error al obtener detalles del producto:', error);
    res.status(500).json({ error: 'Error al obtener detalles del producto' });
  }
};

// Obtener productos por marca
export const getProductosPorMarca = async (req, res) => {
  const { id } = req.params; // Obtener ID de la marca desde los parámetros de la URL
  
  try {
    // Consulta para obtener productos de una marca específica
    const [productos] = await pool.query(`
      SELECT 
        pd.id_detalle_producto,
        p.id_producto,
        p.nombre_producto as nombre,
        p.descripcion,
        p.imagen_url,
        pd.precio,
        c.nombre_categoria,
        m.nombre_marca
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      WHERE m.id_marca = ?
      ORDER BY p.nombre_producto ASC`, [id]);
    
    if (productos.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontraron productos para esta marca',
        productos: [],
        marcaNombre: ''
      });
    }
    
    // Obtener el nombre de la marca del primer producto
    const marcaNombre = productos[0].nombre_marca;
    
    res.json({
      productos: productos,
      marcaNombre: marcaNombre
    });
  } catch (error) {
    console.error('Error al obtener productos por marca:', error);
    res.status(500).json({ error: 'Error al obtener productos por marca' });
  }
};
// Obtener productos por categoría
export const listarProductosPorCategoria = async (req, res) => {
  const { id } = req.params;  // Obtener ID de la categoría desde los parámetros de la URL

  try {
    // Consulta para obtener productos de una categoría específica
    const [productos] = await pool.query(`
      SELECT 
        p.id_producto, 
        p.nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        c.nombre_categoria 
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      WHERE c.id_categoria = ?`, [id]);

    if (productos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron productos para esta categoría' });
    }

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({ error: 'Error al obtener productos por categoría' });
  }
};

export const listarProductosConDetalles = async (req, res) => {
  try {
    // Consulta para obtener productos junto con sus detalles
    const [productosDetalles] = await pool.query(`
      SELECT 
        p.id_producto, 
        p.nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        c.nombre_categoria,
        pd.precio, 
        pd.stock, 
        t.nombre_talla, 
        m.nombre_marca
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      INNER JOIN talla t ON pd.talla_id_talla = t.id_talla
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      ORDER BY p.id_producto, t.nombre_talla
    `);

    if (productosDetalles.length === 0) {
      return res.status(404).json({ error: 'No se encontraron productos con detalles' });
    }

    res.json(productosDetalles);
  } catch (error) {
    console.error('Error al obtener productos con detalles:', error);
    res.status(500).json({ error: 'Error al obtener productos con detalles' });
  }
};
// adminController.js
// Obtener todos los pedidos para el admin
export const listarTodosPedidos = async (req, res) => {
  try {
    console.log('=== OBTENIENDO TODOS LOS PEDIDOS (ADMIN) ===');

    const [pedidos] = await pool.execute(`
      SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        u.id_usuario,
        u.nombre_usuario,
        u.apellido_usuario,
        u.correo,
        ep.id_estado,
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
      JOIN usuario u ON p.usuario_id_usuario = u.id_usuario
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.pedido_id_pedido
      LEFT JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      LEFT JOIN producto prod ON pd.producto_id_producto = prod.id_producto
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      AND ep.nombre_estado != 'Carrito'
      GROUP BY 
        p.id_pedido, p.fecha_pedido, p.total, u.id_usuario, u.nombre_usuario, 
        u.apellido_usuario, u.correo, ep.id_estado, ep.nombre_estado, 
        ep.descripcion_estado, de.fecha_cb_estado, de.descripcion_cb_estado
      ORDER BY p.fecha_pedido DESC
    `);

    // Para cada pedido, obtener la imagen principal
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

    console.log(`📋 Total de pedidos encontrados: ${pedidos.length}`);

    res.json({
      success: true,
      pedidos: pedidosConImagenes
    });

  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de pedidos',
      error: error.message
    });
  }
};

// Obtener detalle completo de un pedido específico (para admin)
export const getDetallePedidoAdmin = async (req, res) => {
  try {
    const { pedido_id } = req.params;

    console.log('=== OBTENIENDO DETALLE DE PEDIDO (ADMIN) ===');
    console.log('📦 Pedido ID:', pedido_id);

    // Obtener información básica del pedido y usuario
    const [pedidoInfo] = await pool.execute(`
      SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        u.id_usuario,
        u.nombre_usuario,
        u.apellido_usuario,
        u.correo,
        u.rut,
        u.direccion,
        r.nombre_region,
        c.nombre_comuna,
        u.estado_usuario
      FROM pedido p
      JOIN usuario u ON p.usuario_id_usuario = u.id_usuario
      LEFT JOIN region r ON u.region_id_region = r.id_region
      LEFT JOIN comuna c ON u.comuna_id_comuna = c.id_comuna
      WHERE p.id_pedido = ?
    `, [pedido_id]);

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

    console.log('✅ Detalle de pedido obtenido (Admin)');

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
    console.error('❌ Error al obtener detalle del pedido (Admin):', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle del pedido',
      error: error.message
    });
  }
};

// Cambiar estado de un pedido (solo admin)
export const cambiarEstadoPedido = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { pedido_id } = req.params;
    const { nuevo_estado, descripcion } = req.body;

    console.log('=== CAMBIANDO ESTADO DE PEDIDO (ADMIN) ===');
    console.log('📦 Pedido ID:', pedido_id);
    console.log('🔄 Nuevo estado:', nuevo_estado);
    console.log('📝 Descripción:', descripcion);

    // Validar que el estado sea válido para admin
    const estadosPermitidos = ['Enviado', 'Entregado'];
    if (!estadosPermitidos.includes(nuevo_estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Solo se permite cambiar a: Enviado, Entregado'
      });
    }

    // Verificar que el pedido existe
    const [pedidoExiste] = await connection.execute(`
      SELECT id_pedido FROM pedido WHERE id_pedido = ?
    `, [pedido_id]);

    if (pedidoExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Obtener el estado actual del pedido
    const [estadoActual] = await connection.execute(`
      SELECT ep.nombre_estado, ep.id_estado
      FROM detalle_estado de
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.pedido_id_pedido = ?
      ORDER BY de.fecha_cb_estado DESC, de.id_detalle_estado DESC
      LIMIT 1
    `, [pedido_id]);

    if (estadoActual.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo determinar el estado actual del pedido'
      });
    }

    const estadoActualNombre = estadoActual[0].nombre_estado;

    // Validar transiciones de estado permitidas
    const transicionesValidas = {
      'Pendiente': ['Enviado'],
      'Pagado': ['Enviado'],
      'Enviado': ['Entregado'],
      'Entregado': [] // No se puede cambiar desde entregado
    };

    if (!transicionesValidas[estadoActualNombre] || 
        !transicionesValidas[estadoActualNombre].includes(nuevo_estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de "${estadoActualNombre}" a "${nuevo_estado}"`
      });
    }

    // Obtener ID del nuevo estado
    const [nuevoEstadoInfo] = await connection.execute(`
      SELECT id_estado FROM estado_pedido WHERE nombre_estado = ?
    `, [nuevo_estado]);

    if (nuevoEstadoInfo.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Estado objetivo no encontrado en el sistema'
      });
    }

    const nuevoEstadoId = nuevoEstadoInfo[0].id_estado;

    // Crear el nuevo registro de cambio de estado
    await connection.execute(`
      INSERT INTO detalle_estado (fecha_cb_estado, descripcion_cb_estado, pedido_id_pedido, estado_pedido_id_estado)
      VALUES (NOW(), ?, ?, ?)
    `, [descripcion || `Cambio de estado a ${nuevo_estado}`, pedido_id, nuevoEstadoId]);

    await connection.commit();

    console.log(`✅ Estado cambiado exitosamente de "${estadoActualNombre}" a "${nuevo_estado}"`);

    res.json({
      success: true,
      message: `Estado del pedido cambiado exitosamente a "${nuevo_estado}"`,
      estado_anterior: estadoActualNombre,
      estado_nuevo: nuevo_estado
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al cambiar estado del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Obtener estadísticas de pedidos para el admin
export const getEstadisticasPedidos = async (req, res) => {
  try {
    console.log('=== OBTENIENDO ESTADÍSTICAS DE PEDIDOS ===');

    // Estadísticas por estado
    const [estadisticasPorEstado] = await pool.execute(`
      SELECT 
        ep.nombre_estado,
        COUNT(DISTINCT p.id_pedido) as cantidad_pedidos,
        COALESCE(SUM(p.total), 0) as total_ventas
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      AND ep.nombre_estado != 'Carrito'
      GROUP BY ep.id_estado, ep.nombre_estado
      ORDER BY cantidad_pedidos DESC
    `);

    // Pedidos por mes (últimos 6 meses)
    const [pedidosPorMes] = await pool.execute(`
      SELECT 
        DATE_FORMAT(p.fecha_pedido, '%Y-%m') as mes,
        COUNT(p.id_pedido) as cantidad_pedidos,
        SUM(p.total) as total_ventas
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      AND ep.nombre_estado != 'Carrito'
      AND p.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(p.fecha_pedido, '%Y-%m')
      ORDER BY mes DESC
    `);

    // Totales generales
    const [totalesGenerales] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT p.id_pedido) as total_pedidos,
        SUM(p.total) as total_ventas,
        AVG(p.total) as promedio_pedido
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      AND ep.nombre_estado != 'Carrito'
    `);

    console.log('✅ Estadísticas obtenidas');

    res.json({
      success: true,
      estadisticas: {
        por_estado: estadisticasPorEstado,
        por_mes: pedidosPorMes,
        totales: totalesGenerales[0] || { total_pedidos: 0, total_ventas: 0, promedio_pedido: 0 }
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de pedidos',
      error: error.message
    });
  }
};
export const eliminarDetalleProducto = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params; // id_detalle_producto

    console.log('🗑️ Iniciando eliminación de detalle de producto, ID:', id);

    // Verificar que el detalle existe
    const [existeDetalle] = await connection.execute(
      'SELECT id_detalle_producto FROM producto_detalle WHERE id_detalle_producto = ?',
      [id]
    );

    if (existeDetalle.length === 0) {
      return res.status(404).json({ error: 'Detalle de producto no encontrado' });
    }

    // Iniciar transacción
    await connection.beginTransaction();

    try {
      // PASO 1: Verificar si hay pedidos asociados (CRÍTICO)
      console.log('🔍 Verificando pedidos asociados...');
      const [pedidosRelacionados] = await connection.execute(
        'SELECT COUNT(*) as count FROM detalle_pedido WHERE producto_detalle_id_detalle_producto = ?',
        [id]
      );

      if (pedidosRelacionados[0].count > 0) {
        await connection.rollback();
        console.log(`❌ No se puede eliminar: ${pedidosRelacionados[0].count} pedido(s) asociado(s)`);
        return res.status(400).json({ 
          error: 'No se puede eliminar este detalle porque está asociado a pedidos existentes',
          detalles: `Hay ${pedidosRelacionados[0].count} pedido(s) que incluyen este producto`,
          tipo: 'PEDIDOS_ASOCIADOS'
        });
      }

      console.log('✅ Sin pedidos asociados, procediendo con eliminación...');

      // PASO 2: Eliminar registros relacionados en detalle_estado_pro
      console.log('🔄 Eliminando estados relacionados del detalle...');
      const [estadosEliminados] = await connection.execute(
        'DELETE FROM detalle_estado_pro WHERE producto_detalle_id_detalle_producto = ?',
        [id]
      );
      
      console.log(`✅ Eliminados ${estadosEliminados.affectedRows} registros de estados`);

      // PASO 3: Verificar otras posibles dependencias (agregar según tu esquema)
      // Ejemplo si tienes otras tablas que referencien producto_detalle:
      /*
      const [otrasReferencias] = await connection.execute(
        'SELECT COUNT(*) as count FROM otra_tabla WHERE detalle_producto_id = ?',
        [id]
      );

      if (otrasReferencias[0].count > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'No se puede eliminar debido a otras referencias'
        });
      }
      */

      // PASO 4: Eliminar el detalle de producto
      console.log('🔄 Eliminando detalle de producto...');
      const [detalleEliminado] = await connection.execute(
        'DELETE FROM producto_detalle WHERE id_detalle_producto = ?',
        [id]
      );

      if (detalleEliminado.affectedRows === 0) {
        throw new Error('No se pudo eliminar el detalle de producto');
      }

      // Confirmar transacción
      await connection.commit();
      
      console.log('✅ Detalle de producto eliminado correctamente');
      
      res.json({ 
        message: 'Detalle eliminado correctamente',
        eliminados: {
          estados: estadosEliminados.affectedRows,
          detalle: detalleEliminado.affectedRows
        },
        detalle_id: id
      });

    } catch (transactionError) {
      await connection.rollback();
      console.error('❌ Error en transacción:', transactionError);
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Error al eliminar detalle:', error);
    
    // Manejo específico de errores de foreign key
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'No se puede eliminar este detalle porque tiene datos relacionados',
        detalles: 'El detalle está siendo referenciado por otros registros en el sistema',
        tipo: 'FOREIGN_KEY_CONSTRAINT'
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      tipo: 'INTERNAL_ERROR'
    });
  } finally {
    connection.release();
  }
};

// 3. CORREGIR actualizarDetalleProducto - USAR NOMBRES CORRECTOS
export const actualizarDetalleProducto = async (req, res) => {
  try {
    const { id } = req.params; // id_detalle_producto
    const { marca_id, talla_id, precio, stock } = req.body;

    // Validaciones
    if (!marca_id || !talla_id || precio === undefined || stock === undefined) {
      return res.status(400).json({ 
        error: 'Marca, talla, precio y stock son obligatorios' 
      });
    }

    if (precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    if (stock < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo' });
    }

    // Verificar que el detalle existe - CORREGIR NOMBRE DE TABLA
    const [existeDetalle] = await pool.execute(
      'SELECT id_detalle_producto FROM producto_detalle WHERE id_detalle_producto = ?',
      [id]
    );

    if (existeDetalle.length === 0) {
      return res.status(404).json({ error: 'Detalle de producto no encontrado' });
    }

    // Actualizar el detalle - CORREGIR NOMBRES DE COLUMNAS
    const query = `
      UPDATE producto_detalle 
      SET marca_id_marca = ?, 
          talla_id_talla = ?, 
          precio = ?, 
          stock = ?
      WHERE id_detalle_producto = ?
    `;

    await pool.execute(query, [marca_id, talla_id, precio, stock, id]);

    res.json({ message: 'Detalle actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar detalle:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 4. CORREGIR crearDetalleProducto - USAR NOMBRES CORRECTOS
export const crearDetalleProducto = async (req, res) => {
  try {
    const { producto_id, marca_id, talla_id, precio, stock } = req.body;

    // Validaciones
    if (!producto_id || !marca_id || !talla_id || precio === undefined || stock === undefined) {
      return res.status(400).json({ 
        error: 'Producto ID, marca, talla, precio y stock son obligatorios' 
      });
    }

    if (precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    if (stock < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo' });
    }

    // Verificar que no existe ya esa combinación producto-marca-talla
    const [existeCombinacion] = await pool.execute(
      'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ? AND marca_id_marca = ? AND talla_id_talla = ?',
      [producto_id, marca_id, talla_id]
    );

    if (existeCombinacion.length > 0) {
      return res.status(400).json({ 
        error: 'Ya existe un detalle para este producto con esta marca y talla' 
      });
    }

    // Crear el nuevo detalle - CORREGIR NOMBRES DE COLUMNAS
    const query = `
      INSERT INTO producto_detalle (producto_id_producto, marca_id_marca, talla_id_talla, precio, stock)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      producto_id, marca_id, talla_id, precio, stock
    ]);

    res.status(201).json({ 
      message: 'Detalle creado correctamente',
      id_detalle_producto: result.insertId
    });

  } catch (error) {
    console.error('Error al crear detalle:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 5. CORREGIR actualizarEstadosProducto - USAR NOMBRES CORRECTOS
export const actualizarEstadosProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_producto_id, descripcion_cb_estado } = req.body;

    // Verificar que el producto existe
    const [existeProducto] = await pool.execute(
      'SELECT id_producto FROM producto WHERE id_producto = ?',
      [id]
    );

    if (existeProducto.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener todos los detalles del producto
    const [detallesProducto] = await pool.execute(
      'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ?',
      [id]
    );

    if (detallesProducto.length === 0) {
      return res.status(400).json({ error: 'No hay variantes para este producto' });
    }

    // Insertar nuevo estado para cada variante del producto
    for (const detalle of detallesProducto) {
      await pool.execute(
        `INSERT INTO detalle_estado_pro 
         (fecha_cb_estado, descripcion_cb_estado, producto_detalle_id_detalle_producto, estado_producto_id_estado) 
         VALUES (CURDATE(), ?, ?, ?)`,
        [descripcion_cb_estado || 'Cambio de estado', detalle.id_detalle_producto, estado_producto_id]
      );
    }

    res.json({ message: 'Estados actualizados correctamente para todas las variantes' });

  } catch (error) {
    console.error('Error al actualizar estados:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// 6. CORREGIR obtenerProductoPorId - USAR NOMBRES CORRECTOS
export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Consulta mejorada para obtener el producto con sus detalles
    const query = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        p.categoria_id_categoria,
        c.nombre_categoria,
        pd.id_detalle_producto,
        pd.precio,
        pd.stock,
        pd.marca_id_marca,
        pd.talla_id_talla,
        m.nombre_marca,
        t.nombre_talla
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE p.id_producto = ?
      ORDER BY pd.id_detalle_producto
    `;

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Estructurar la respuesta
    const producto = {
      id_producto: rows[0].id_producto,
      nombre_producto: rows[0].nombre_producto,
      descripcion: rows[0].descripcion,
      imagen_url: rows[0].imagen_url,
      categoria_id_categoria: rows[0].categoria_id_categoria,
      nombre_categoria: rows[0].nombre_categoria || 'Sin categoría',
      detalles: rows
        .filter(row => row.id_detalle_producto) // Solo incluir filas con detalles
        .map(row => ({
          id_detalle_producto: row.id_detalle_producto,
          marca_id_marca: row.marca_id_marca,
          talla_id_talla: row.talla_id_talla,
          precio: row.precio,
          stock: row.stock,
          nombre_marca: row.nombre_marca || 'Sin marca',
          nombre_talla: row.nombre_talla || 'Sin talla'
        }))
    };

    res.json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
export const obtenerProductoParaEdicionSimple = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Obteniendo producto para edición (versión simple), ID:', id);

    // Consulta simplificada sin joins complejos de estado
    const query = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        p.categoria_id_categoria,
        c.nombre_categoria,
        1 as estado_id,
        'Disponible' as nombre_estado,
        pd.id_detalle_producto as id_detalle,
        pd.precio,
        pd.stock,
        pd.marca_id_marca,
        pd.talla_id_talla,
        m.nombre_marca,
        t.nombre_talla,
        'activo' as estado_detalle
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE p.id_producto = ?
      ORDER BY pd.id_detalle_producto, t.nombre_talla
    `;

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Producto no encontrado' 
      });
    }

    console.log('📋 Producto encontrado con', rows.length, 'variantes');
    
    // Retornar directamente el array (mismo formato que listarProductos)
    res.json(rows);

  } catch (error) {
    console.error('❌ Error al obtener producto para edición:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};
/**
 * Actualizar estado de un producto específico - NUEVA LÓGICA
 * PUT /api/admin/producto/:id/estado
 * Solo permite cambios entre Disponible (1) ↔ Inhabilitado (3)
 */
export const actualizarEstadoProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_id, descripcion_cambio } = req.body;

    console.log('🔄 Actualizando estado del producto:', {
      producto_id: id,
      nuevo_estado: estado_id,
      descripcion: descripcion_cambio
    });

    // Validar que el producto existe
    const [productoExiste] = await pool.execute(
      'SELECT id_producto FROM producto WHERE id_producto = ?',
      [id]
    );

    if (productoExiste.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // NUEVA VALIDACIÓN: Solo permitir estados 1 (Disponible) y 3 (Inhabilitado)
    const estadosPermitidos = [1, 3]; // Solo Disponible e Inhabilitado
    if (!estadosPermitidos.includes(parseInt(estado_id))) {
      return res.status(400).json({
        error: 'Solo se puede cambiar entre estados "Disponible" e "Inhabilitado"',
        estados_permitidos: {
          1: 'Disponible',
          3: 'Inhabilitado'
        },
        nota: 'El estado "Agotado" se asigna automáticamente cuando el stock llega a 0'
      });
    }

    // Obtener estado actual del producto
    const [estadoActualQuery] = await pool.execute(`
      SELECT esp.estado_producto_id_estado as estado_actual
      FROM detalle_estado_pro esp 
      JOIN producto_detalle pd ON esp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      WHERE pd.producto_id_producto = ? 
      ORDER BY esp.fecha_cb_estado DESC, esp.id_detalle_estado DESC
      LIMIT 1
    `, [id]);

    const estadoActual = estadoActualQuery.length > 0 ? parseInt(estadoActualQuery[0].estado_actual) : null;

    // Validar transición de estado
    if (estadoActual === parseInt(estado_id)) {
      return res.status(400).json({
        error: `El producto ya está en estado "${estado_id === 1 ? 'Disponible' : 'Inhabilitado'}"`
      });
    }

    // NUEVA VALIDACIÓN: Si el producto tiene stock 0 y se intenta poner disponible
    if (parseInt(estado_id) === 1) {
      const [stockTotal] = await pool.execute(`
        SELECT COALESCE(SUM(pd.stock), 0) as stock_total
        FROM producto_detalle pd
        WHERE pd.producto_id_producto = ?
      `, [id]);

      if (stockTotal[0].stock_total === 0) {
        return res.status(400).json({
          error: 'No se puede marcar como disponible un producto sin stock',
          nota: 'Agregue stock al producto para que pueda estar disponible'
        });
      }
    }

    // Insertar en el historial de cambios de estado
    const descripcionFinal = descripcion_cambio || 
      `Estado cambiado manualmente a ${estado_id === 1 ? 'Disponible' : 'Inhabilitado'} - ${new Date().toLocaleString()}`;
    
    const insertHistorialQuery = `
      INSERT INTO detalle_estado_pro (
        fecha_cb_estado,
        descripcion_cb_estado,
        producto_detalle_id_detalle_producto,
        estado_producto_id_estado
      )
      SELECT 
        CURDATE(),
        ?,
        pd.id_detalle_producto,
        ?
      FROM producto_detalle pd 
      WHERE pd.producto_id_producto = ?
    `;

    await pool.execute(insertHistorialQuery, [
      descripcionFinal,
      estado_id,
      id
    ]);

    console.log('✅ Estado del producto actualizado correctamente');

    res.status(200).json({
      message: 'Estado del producto actualizado correctamente',
      producto_id: id,
      estado_anterior: estadoActual,
      nuevo_estado: parseInt(estado_id),
      descripcion: estado_id === 1 ? 'Disponible' : 'Inhabilitado'
    });

  } catch (error) {
    console.error('❌ Error al actualizar estado del producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el estado del producto'
    });
  }
};

/**
 * Actualizar automáticamente estados basado en stock - NUEVA LÓGICA
 * POST /api/admin/productos/actualizar-estados-automaticos
 * Solo cambia entre Disponible (1) ↔ Agotado (2)
 * NO toca productos Inhabilitados (3)
 */
export const actualizarEstadosAutomaticos = async (req, res) => {
  try {
    console.log('🤖 Iniciando actualización automática de estados...');

    // Obtener productos con stock total y estado actual
    // EXCLUIR productos inhabilitados (estado 3)
    const productosQuery = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        COALESCE(SUM(pd.stock), 0) as stock_total,
        (
          SELECT esp.estado_producto_id_estado 
          FROM detalle_estado_pro esp 
          JOIN producto_detalle pd2 ON esp.producto_detalle_id_detalle_producto = pd2.id_detalle_producto
          WHERE pd2.producto_id_producto = p.id_producto 
          ORDER BY esp.fecha_cb_estado DESC, esp.id_detalle_estado DESC
          LIMIT 1
        ) as estado_actual
      FROM producto p
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      GROUP BY p.id_producto, p.nombre_producto
      HAVING estado_actual IS NOT NULL AND estado_actual != 3  -- EXCLUIR inhabilitados
    `;

    const [productos] = await pool.execute(productosQuery);

    let productosActualizados = 0;
    const cambios = [];

    for (const producto of productos) {
      const estadoActual = parseInt(producto.estado_actual);
      const stockTotal = parseInt(producto.stock_total);
      
      // NUEVA LÓGICA: Solo cambiar entre Disponible (1) y Agotado (2)
      let nuevoEstado = null;
      
      if (estadoActual === 1 && stockTotal === 0) {
        nuevoEstado = 2; // Disponible → Agotado
      } else if (estadoActual === 2 && stockTotal > 0) {
        nuevoEstado = 1; // Agotado → Disponible
      }
      
      if (nuevoEstado && nuevoEstado !== estadoActual) {
        // Actualizar estado
        const descripcion = `Estado actualizado automáticamente: ${nuevoEstado === 1 ? 'Disponible' : 'Agotado'} (Stock: ${stockTotal}) - ${new Date().toLocaleString()}`;
        
        const insertQuery = `
          INSERT INTO detalle_estado_pro (
            fecha_cb_estado,
            descripcion_cb_estado,
            producto_detalle_id_detalle_producto,
            estado_producto_id_estado
          )
          SELECT 
            CURDATE(),
            ?,
            pd.id_detalle_producto,
            ?
          FROM producto_detalle pd 
          WHERE pd.producto_id_producto = ?
        `;

        await pool.execute(insertQuery, [
          descripcion,
          nuevoEstado,
          producto.id_producto
        ]);

        productosActualizados++;
        cambios.push({
          id: producto.id_producto,
          nombre: producto.nombre_producto,
          estadoAnterior: estadoActual,
          estadoNuevo: nuevoEstado,
          stock: stockTotal
        });
        
        console.log(`📦 Producto "${producto.nombre_producto}": Estado ${estadoActual} → ${nuevoEstado} (Stock: ${stockTotal})`);
      }
    }

    console.log(`✅ Actualización automática completada: ${productosActualizados} productos actualizados`);

    res.status(200).json({
      message: 'Estados actualizados automáticamente',
      productos_procesados: productos.length,
      productos_actualizados: productosActualizados,
      cambios: cambios,
      nota: 'Solo se actualizan productos Disponibles ↔ Agotados. Los Inhabilitados se mantienen sin cambios.'
    });

  } catch (error) {
    console.error('❌ Error en actualización automática de estados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron actualizar los estados automáticamente'
    });
  }
};

/**
 * REEMPLAZAR la función existente actualizarDatosBasicosProducto - NUEVA LÓGICA
 * PUT /api/admin/producto/:id/datos-basicos
 */
export const actualizarDatosBasicosProductoConEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, imagen_url, categoria_id, estado_id } = req.body;

    console.log('📝 Actualizando datos básicos del producto con estado:', {
      id,
      nombre,
      descripcion,
      categoria_id,
      estado_id
    });

    // Validar datos requeridos
    if (!nombre || !descripcion || !categoria_id) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        requeridos: ['nombre', 'descripcion', 'categoria_id']
      });
    }

    // Verificar que el producto existe
    const [productoExiste] = await pool.execute(
      'SELECT id_producto FROM producto WHERE id_producto = ?',
      [id]
    );

    if (productoExiste.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Verificar que la categoría existe
    const [categoriaExiste] = await pool.execute(
      'SELECT id_categoria FROM categoria WHERE id_categoria = ?',
      [categoria_id]
    );

    if (categoriaExiste.length === 0) {
      return res.status(400).json({
        error: 'Categoría no válida'
      });
    }

    // Actualizar datos básicos del producto
    const updateQuery = `
      UPDATE producto 
      SET 
        nombre_producto = ?,
        descripcion = ?,
        imagen_url = ?,
        categoria_id_categoria = ?
      WHERE id_producto = ?
    `;

    await pool.execute(updateQuery, [
      nombre.trim(),
      descripcion.trim(),
      imagen_url ? imagen_url.trim() : '',
      categoria_id,
      id
    ]);

    // Si se proporciona estado_id, validar y actualizar estado del producto - NUEVA LÓGICA
    if (estado_id) {
      // NUEVA VALIDACIÓN: Solo permitir estados 1 (Disponible) y 3 (Inhabilitado)
      const estadosPermitidos = [1, 3];
      if (!estadosPermitidos.includes(parseInt(estado_id))) {
        return res.status(400).json({
          error: 'Solo se pueden asignar estados "Disponible" (1) e "Inhabilitado" (3)',
          nota: 'El estado "Agotado" (2) se asigna automáticamente'
        });
      }

      // Verificar que el estado existe
      const [estadoExiste] = await pool.execute(
        'SELECT id_estado FROM estado_producto WHERE id_estado = ?',
        [estado_id]
      );

      if (estadoExiste.length === 0) {
        return res.status(400).json({
          error: 'Estado no válido'
        });
      }

      // NUEVA VALIDACIÓN: Si se intenta poner disponible, verificar que hay stock
      if (parseInt(estado_id) === 1) {
        const [stockTotal] = await pool.execute(`
          SELECT COALESCE(SUM(pd.stock), 0) as stock_total
          FROM producto_detalle pd
          WHERE pd.producto_id_producto = ?
        `, [id]);

        if (stockTotal[0].stock_total === 0) {
          return res.status(400).json({
            error: 'No se puede marcar como disponible un producto sin stock',
            nota: 'Agregue stock al producto primero'
          });
        }
      }

      // Actualizar estado del producto (crear entrada en historial)
      const descripcionEstado = `Datos básicos actualizados con cambio de estado a ${estado_id === 1 ? 'Disponible' : 'Inhabilitado'} - ${new Date().toLocaleString()}`;
      
      const insertEstadoQuery = `
        INSERT INTO detalle_estado_pro (
          fecha_cb_estado,
          descripcion_cb_estado,
          producto_detalle_id_detalle_producto,
          estado_producto_id_estado
        )
        SELECT 
          CURDATE(),
          ?,
          pd.id_detalle_producto,
          ?
        FROM producto_detalle pd 
        WHERE pd.producto_id_producto = ?
      `;

      await pool.execute(insertEstadoQuery, [
        descripcionEstado,
        estado_id,
        id
      ]);
    }

    console.log('✅ Datos básicos del producto actualizados correctamente');

    res.status(200).json({
      message: 'Datos básicos del producto actualizados correctamente',
      producto_id: id,
      estado_actualizado: estado_id ? true : false
    });

  } catch (error) {
    console.error('❌ Error al actualizar datos básicos del producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron actualizar los datos del producto'
    });
  }
};

/**
 * NUEVO: Obtener solo estados manuales permitidos (Disponible e Inhabilitado)
 * GET /api/admin/estados-producto/manuales
 */
export const obtenerEstadosManuales = async (req, res) => {
  try {
    console.log('📋 Obteniendo estados manuales permitidos...');

    const query = `
      SELECT 
        id_estado,
        nombre_estado,
        descripcion_estado
      FROM estado_producto 
      WHERE id_estado IN (1, 3)  -- Solo Disponible e Inhabilitado
      ORDER BY id_estado ASC
    `;

    const [estados] = await pool.execute(query);

    console.log(`✅ Estados manuales obtenidos: ${estados.length}`);

    res.status(200).json({
      estados: estados,
      nota: 'Solo se muestran estados que pueden cambiarse manualmente. El estado "Agotado" se asigna automáticamente.'
    });

  } catch (error) {
    console.error('❌ Error al obtener estados manuales:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los estados manuales'
    });
  }
};

/**
 * NUEVO: Obtener productos activos para vistas públicas (excluye inhabilitados)
 * GET /api/admin/productos/activos-publicos
 */
export const getProductosActivosPublicos = async (req, res) => {
  try {
    console.log('🔍 Obteniendo productos para vistas públicas (sin inhabilitados)...');

    const query = `
      SELECT DISTINCT
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        pd.precio,
        SUM(pd.stock) as stock_total,
        c.nombre_categoria,
        m.nombre_marca,
        
        -- Obtener estado actual del producto
        (
          SELECT esp.estado_producto_id_estado 
          FROM detalle_estado_pro esp 
          JOIN producto_detalle pd_estado ON esp.producto_detalle_id_detalle_producto = pd_estado.id_detalle_producto
          WHERE pd_estado.producto_id_producto = p.id_producto 
          ORDER BY esp.fecha_cb_estado DESC, esp.id_detalle_estado DESC
          LIMIT 1
        ) as estado_id,
        
        (
          SELECT ep.nombre_estado
          FROM detalle_estado_pro esp 
          JOIN producto_detalle pd_estado ON esp.producto_detalle_id_detalle_producto = pd_estado.id_detalle_producto
          JOIN estado_producto ep ON esp.estado_producto_id_estado = ep.id_estado
          WHERE pd_estado.producto_id_producto = p.id_producto 
          ORDER BY esp.fecha_cb_estado DESC, esp.id_detalle_estado DESC
          LIMIT 1
        ) as nombre_estado
        
      FROM producto p
      JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      JOIN marca m ON pd.marca_id_marca = m.id_marca
      GROUP BY p.id_producto, p.nombre_producto, p.descripcion, p.imagen_url, pd.precio, c.nombre_categoria, m.nombre_marca
      HAVING estado_id IN (1, 2)  -- Solo Disponibles (1) y Agotados (2), NO Inhabilitados (3)
      ORDER BY p.nombre_producto ASC
    `;

    const [productos] = await pool.execute(query);

    console.log(`✅ Productos activos para público obtenidos: ${productos.length}`);
    
    res.status(200).json({
      productos: productos,
      total: productos.length,
      nota: 'Solo productos disponibles y agotados. Los inhabilitados están ocultos.'
    });

  } catch (error) {
    console.error('❌ Error al obtener productos activos públicos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los productos activos'
    });
  }
};
// ===== FUNCIONES CORREGIDAS PARA MANEJAR ESTADOS DE PRODUCTOS =====

/**
 * 1. OBTENER PRODUCTO PARA EDICIÓN - CORREGIDO
 * GET /api/admin/producto/:id/edicion
 */
export const obtenerProductoParaEdicion = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Obteniendo producto para edición, ID:', id);

    // Consulta corregida que obtiene el estado actual del producto
    const query = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        p.categoria_id_categoria,
        c.nombre_categoria,
        
        -- Datos del detalle del producto
        pd.id_detalle_producto as id_detalle,
        pd.precio,
        pd.stock,
        pd.marca_id_marca,
        pd.talla_id_talla,
        m.nombre_marca,
        t.nombre_talla,
        
        -- ESTADO ACTUAL DEL PRODUCTO (más reciente)
        COALESCE(estado_actual.estado_id, 1) as estado_id,
        COALESCE(estado_actual.nombre_estado, 'Disponible') as nombre_estado
        
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      
      -- Subconsulta para obtener el estado más reciente del producto
      LEFT JOIN (
        SELECT 
          pd_sub.producto_id_producto,
          ep.id_estado as estado_id,
          ep.nombre_estado,
          ROW_NUMBER() OVER (
            PARTITION BY pd_sub.producto_id_producto 
            ORDER BY dep.fecha_cb_estado DESC, dep.id_detalle_estado DESC
          ) as rn
        FROM producto_detalle pd_sub
        JOIN detalle_estado_pro dep ON pd_sub.id_detalle_producto = dep.producto_detalle_id_detalle_producto
        JOIN estado_producto ep ON dep.estado_producto_id_estado = ep.id_estado
      ) estado_actual ON p.id_producto = estado_actual.producto_id_producto AND estado_actual.rn = 1
      
      WHERE p.id_producto = ?
      ORDER BY pd.id_detalle_producto
    `;

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Producto no encontrado' 
      });
    }

    console.log('📋 Producto encontrado:', {
      id: rows[0].id_producto,
      nombre: rows[0].nombre_producto,
      estado_id: rows[0].estado_id,
      nombre_estado: rows[0].nombre_estado,
      variantes: rows.filter(r => r.id_detalle).length
    });
    
    res.json(rows);

  } catch (error) {
    console.error('❌ Error al obtener producto para edición:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

/**
 * 2. ACTUALIZAR DATOS BÁSICOS DEL PRODUCTO CON ESTADO - CORREGIDO
 * PUT /api/admin/producto/:id/datos-basicos
 */
export const actualizarDatosBasicosProducto = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { nombre, descripcion, imagen_url, categoria_id, estado_id } = req.body;

    console.log('📝 Actualizando datos básicos del producto:', {
      id,
      nombre,
      descripcion,
      categoria_id,
      estado_id
    });

    // Validar datos requeridos
    if (!nombre || !descripcion || !categoria_id) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios: nombre, descripcion, categoria_id'
      });
    }

    await connection.beginTransaction();

    // Verificar que el producto existe
    const [productoExiste] = await connection.execute(
      'SELECT id_producto FROM producto WHERE id_producto = ?',
      [id]
    );

    if (productoExiste.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Actualizar datos básicos del producto
    const updateQuery = `
      UPDATE producto 
      SET 
        nombre_producto = ?,
        descripcion = ?,
        imagen_url = ?,
        categoria_id_categoria = ?
      WHERE id_producto = ?
    `;

    await connection.execute(updateQuery, [
      nombre.trim(),
      descripcion.trim(),
      imagen_url ? imagen_url.trim() : '',
      categoria_id,
      id
    ]);

    console.log('✅ Datos básicos actualizados');

    // Si se proporciona estado_id, actualizar estado
    if (estado_id) {
      console.log('🔄 Actualizando estado del producto a:', estado_id);

      // Validar estado permitido (1=Disponible, 2=Agotado, 3=Inhabilitado)
      const estadosValidos = [1, 2, 3];
      if (!estadosValidos.includes(parseInt(estado_id))) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Estado no válido. Debe ser 1 (Disponible), 2 (Agotado) o 3 (Inhabilitado)'
        });
      }

      // Verificar que el estado existe en la tabla estado_producto
      const [estadoExiste] = await connection.execute(
        'SELECT id_estado, nombre_estado FROM estado_producto WHERE id_estado = ?',
        [estado_id]
      );

      if (estadoExiste.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'El estado especificado no existe en el sistema'
        });
      }

      // VALIDACIÓN ESPECIAL: Si se intenta poner disponible, verificar stock
      if (parseInt(estado_id) === 1) {
        const [stockTotal] = await connection.execute(`
          SELECT COALESCE(SUM(pd.stock), 0) as stock_total
          FROM producto_detalle pd
          WHERE pd.producto_id_producto = ?
        `, [id]);

        if (stockTotal[0].stock_total === 0) {
          await connection.rollback();
          return res.status(400).json({
            error: 'No se puede marcar como disponible un producto sin stock',
            nota: 'Agregue stock al producto primero'
          });
        }
      }

      // Obtener todas las variantes del producto
      const [variantes] = await connection.execute(
        'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ?',
        [id]
      );

      if (variantes.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No se encontraron variantes para este producto'
        });
      }

      // Insertar nuevo estado para todas las variantes
      const descripcionEstado = `Estado cambiado a ${estadoExiste[0].nombre_estado} desde actualización de datos básicos - ${new Date().toLocaleString()}`;
      
      for (const variante of variantes) {
        await connection.execute(`
          INSERT INTO detalle_estado_pro (
            fecha_cb_estado,
            descripcion_cb_estado,
            producto_detalle_id_detalle_producto,
            estado_producto_id_estado
          ) VALUES (NOW(), ?, ?, ?)
        `, [descripcionEstado, variante.id_detalle_producto, estado_id]);
      }

      console.log(`✅ Estado actualizado a ${estadoExiste[0].nombre_estado} para ${variantes.length} variantes`);
    }

    await connection.commit();

    console.log('✅ Actualización de datos básicos completada exitosamente');

    res.status(200).json({
      message: 'Datos básicos del producto actualizados correctamente',
      producto_id: id,
      estado_actualizado: estado_id ? true : false
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al actualizar datos básicos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * 3. CAMBIAR ESTADO DE PRODUCTO ESPECÍFICO - NUEVO
 * PUT /api/admin/producto/:id/estado
 */
export const cambiarEstadoProducto = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { estado_id, descripcion_cambio } = req.body;

    console.log('🔄 Cambiando estado del producto:', {
      producto_id: id,
      nuevo_estado: estado_id,
      descripcion: descripcion_cambio
    });

    // Validar que se proporcione el estado
    if (!estado_id) {
      return res.status(400).json({
        error: 'El estado_id es obligatorio'
      });
    }

    await connection.beginTransaction();

    // Verificar que el producto existe
    const [productoExiste] = await connection.execute(
      'SELECT id_producto FROM producto WHERE id_producto = ?',
      [id]
    );

    if (productoExiste.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Validar estado (1=Disponible, 2=Agotado, 3=Inhabilitado)
    const estadosValidos = [1, 2, 3];
    if (!estadosValidos.includes(parseInt(estado_id))) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Estado no válido',
        estados_validos: {
          1: 'Disponible',
          2: 'Agotado', 
          3: 'Inhabilitado'
        }
      });
    }

    // Verificar que el estado existe
    const [estadoInfo] = await connection.execute(
      'SELECT id_estado, nombre_estado FROM estado_producto WHERE id_estado = ?',
      [estado_id]
    );

    if (estadoInfo.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'El estado especificado no existe en el sistema'
      });
    }

    // Obtener estado actual del producto
    const [estadoActual] = await connection.execute(`
      SELECT 
        ep.id_estado as estado_actual,
        ep.nombre_estado as nombre_estado_actual
      FROM detalle_estado_pro dep
      JOIN producto_detalle pd ON dep.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      JOIN estado_producto ep ON dep.estado_producto_id_estado = ep.id_estado
      WHERE pd.producto_id_producto = ?
      ORDER BY dep.fecha_cb_estado DESC, dep.id_detalle_estado DESC
      LIMIT 1
    `, [id]);

    const estadoActualId = estadoActual.length > 0 ? parseInt(estadoActual[0].estado_actual) : null;

    // Verificar si el estado ya es el mismo
    if (estadoActualId === parseInt(estado_id)) {
      await connection.rollback();
      return res.status(400).json({
        error: `El producto ya está en estado "${estadoInfo[0].nombre_estado}"`
      });
    }

    // VALIDACIÓN ESPECIAL: Si se intenta poner disponible, verificar stock
    if (parseInt(estado_id) === 1) {
      const [stockTotal] = await connection.execute(`
        SELECT COALESCE(SUM(pd.stock), 0) as stock_total
        FROM producto_detalle pd
        WHERE pd.producto_id_producto = ?
      `, [id]);

      if (stockTotal[0].stock_total === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: 'No se puede marcar como disponible un producto sin stock'
        });
      }
    }

    // Obtener todas las variantes del producto
    const [variantes] = await connection.execute(
      'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ?',
      [id]
    );

    if (variantes.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'No se encontraron variantes para este producto'
      });
    }

    // Insertar nuevo estado para todas las variantes
    const descripcionFinal = descripcion_cambio || 
      `Estado cambiado manualmente a ${estadoInfo[0].nombre_estado} - ${new Date().toLocaleString()}`;
    
    for (const variante of variantes) {
      await connection.execute(`
        INSERT INTO detalle_estado_pro (
          fecha_cb_estado,
          descripcion_cb_estado,
          producto_detalle_id_detalle_producto,
          estado_producto_id_estado
        ) VALUES (NOW(), ?, ?, ?)
      `, [descripcionFinal, variante.id_detalle_producto, estado_id]);
    }

    await connection.commit();

    console.log(`✅ Estado cambiado exitosamente de "${estadoActual[0]?.nombre_estado_actual || 'Desconocido'}" a "${estadoInfo[0].nombre_estado}"`);

    res.status(200).json({
      message: 'Estado del producto cambiado correctamente',
      producto_id: id,
      estado_anterior: {
        id: estadoActualId,
        nombre: estadoActual[0]?.nombre_estado_actual || 'Desconocido'
      },
      estado_nuevo: {
        id: parseInt(estado_id),
        nombre: estadoInfo[0].nombre_estado
      },
      variantes_actualizadas: variantes.length
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al cambiar estado del producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * 4. LISTAR PRODUCTOS CORREGIDO - CON ESTADO CORRECTO
 * GET /api/admin/productos
 */
export const listarProductosCorregido = async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de productos...');

    const [productos] = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        c.nombre_categoria,
        
        -- Datos del detalle del producto
        pd.id_detalle_producto as id_detalle,
        pd.precio,
        pd.stock,
        m.nombre_marca,
        t.nombre_talla,
        
        -- ESTADO ACTUAL CORREGIDO (el más reciente por producto)
        estado_actual.estado_id as id_estado,
        estado_actual.nombre_estado,
        estado_actual.descripcion_estado,
        estado_actual.fecha_cb_estado
        
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      INNER JOIN talla t ON pd.talla_id_talla = t.id_talla
      
      -- Subconsulta para obtener el estado más reciente de cada producto
      LEFT JOIN (
        SELECT 
          pd_sub.producto_id_producto,
          ep.id_estado as estado_id,
          ep.nombre_estado,
          ep.descripcion_estado,
          dep.fecha_cb_estado,
          ROW_NUMBER() OVER (
            PARTITION BY pd_sub.producto_id_producto 
            ORDER BY dep.fecha_cb_estado DESC, dep.id_detalle_estado DESC
          ) as rn
        FROM producto_detalle pd_sub
        JOIN detalle_estado_pro dep ON pd_sub.id_detalle_producto = dep.producto_detalle_id_detalle_producto
        JOIN estado_producto ep ON dep.estado_producto_id_estado = ep.id_estado
      ) estado_actual ON p.id_producto = estado_actual.producto_id_producto AND estado_actual.rn = 1
      
      ORDER BY p.id_producto, pd.id_detalle_producto
    `);

    console.log(`📋 Productos obtenidos: ${productos.length} registros`);

    // Agregar estado por defecto si no hay estado registrado
    const productosConEstado = productos.map(producto => ({
      ...producto,
      id_estado: producto.id_estado || 1,
      nombre_estado: producto.nombre_estado || 'Disponible',
      estado_id: producto.id_estado || 1 // Para compatibilidad
    }));

    res.json(productosConEstado);
  } catch (err) {
    console.error('❌ Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

/**
 * 5. OBTENER ESTADOS DE PRODUCTO - TODOS
 * GET /api/admin/estados-producto
 */
export const obtenerEstadosProducto = async (req, res) => {
  try {
    console.log('📋 Obteniendo estados de producto...');

    const [estados] = await pool.execute(
      `SELECT 
        id_estado, 
        nombre_estado, 
        descripcion_estado 
      FROM estado_producto 
      ORDER BY id_estado ASC`
    );

    console.log(`✅ Estados obtenidos: ${estados.length}`);

    res.json(estados);
  } catch (error) {
    console.error('❌ Error al obtener estados de producto:', error);
    res.status(500).json({ error: 'Error al obtener los estados de producto' });
  }
};

/**
 * 6. APLICAR LÓGICA AUTOMÁTICA DE ESTADOS - NUEVO
 * POST /api/admin/productos/aplicar-logica-automatica
 */
export const aplicarLogicaAutomaticaEstados = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🤖 Aplicando lógica automática de estados...');

    await connection.beginTransaction();

    // Obtener todos los productos con su stock total y estado actual
    const [productos] = await connection.execute(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        COALESCE(SUM(pd.stock), 0) as stock_total,
        estado_actual.estado_id as estado_actual_id,
        estado_actual.nombre_estado as estado_actual_nombre
      FROM producto p
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      
      -- Obtener estado actual de cada producto
      LEFT JOIN (
        SELECT 
          pd_sub.producto_id_producto,
          ep.id_estado as estado_id,
          ep.nombre_estado,
          ROW_NUMBER() OVER (
            PARTITION BY pd_sub.producto_id_producto 
            ORDER BY dep.fecha_cb_estado DESC, dep.id_detalle_estado DESC
          ) as rn
        FROM producto_detalle pd_sub
        JOIN detalle_estado_pro dep ON pd_sub.id_detalle_producto = dep.producto_detalle_id_detalle_producto
        JOIN estado_producto ep ON dep.estado_producto_id_estado = ep.id_estado
      ) estado_actual ON p.id_producto = estado_actual.producto_id_producto AND estado_actual.rn = 1
      
      GROUP BY p.id_producto, p.nombre_producto, estado_actual.estado_id, estado_actual.nombre_estado
    `);

    let productosActualizados = 0;
    const cambios = [];

    for (const producto of productos) {
      const estadoActual = producto.estado_actual_id || 1; // Por defecto Disponible
      const stockTotal = parseInt(producto.stock_total);
      
      let nuevoEstado = null;
      
      // LÓGICA AUTOMÁTICA:
      // - Si stock = 0 y estado != Inhabilitado → Agotado
      // - Si stock > 0 y estado = Agotado → Disponible
      // - No tocar productos Inhabilitados (estado 3)
      
      if (estadoActual !== 3) { // Solo si no está inhabilitado
        if (stockTotal === 0 && estadoActual !== 2) {
          nuevoEstado = 2; // Cambiar a Agotado
        } else if (stockTotal > 0 && estadoActual === 2) {
          nuevoEstado = 1; // Cambiar a Disponible
        }
      }
      
      if (nuevoEstado && nuevoEstado !== estadoActual) {
        // Obtener variantes del producto
        const [variantes] = await connection.execute(
          'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ?',
          [producto.id_producto]
        );

        if (variantes.length > 0) {
          const nombreNuevoEstado = nuevoEstado === 1 ? 'Disponible' : 'Agotado';
          const descripcion = `Estado actualizado automáticamente a ${nombreNuevoEstado} (Stock: ${stockTotal}) - ${new Date().toLocaleString()}`;
          
          // Insertar nuevo estado para todas las variantes
          for (const variante of variantes) {
            await connection.execute(`
              INSERT INTO detalle_estado_pro (
                fecha_cb_estado,
                descripcion_cb_estado,
                producto_detalle_id_detalle_producto,
                estado_producto_id_estado
              ) VALUES (NOW(), ?, ?, ?)
            `, [descripcion, variante.id_detalle_producto, nuevoEstado]);
          }

          productosActualizados++;
          cambios.push({
            id: producto.id_producto,
            nombre: producto.nombre_producto,
            estadoAnterior: {
              id: estadoActual,
              nombre: producto.estado_actual_nombre || 'Disponible'
            },
            estadoNuevo: {
              id: nuevoEstado,
              nombre: nombreNuevoEstado
            },
            stock: stockTotal,
            variantes: variantes.length
          });
          
          console.log(`📦 ${producto.nombre_producto}: ${producto.estado_actual_nombre || 'Disponible'} → ${nombreNuevoEstado} (Stock: ${stockTotal})`);
        }
      }
    }

    await connection.commit();

    console.log(`✅ Lógica automática aplicada: ${productosActualizados} productos actualizados`);

    res.status(200).json({
      message: 'Lógica automática de estados aplicada correctamente',
      productos_procesados: productos.length,
      productos_actualizados: productosActualizados,
      cambios: cambios
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al aplicar lógica automática:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

// ===== EXPORTAR FUNCIONES CORREGIDAS =====
// Asegúrate de que estas funciones reemplacen a las existentes en tu archivo de controladores
// FUNCIÓN CORREGIDA: listarProductos - REEMPLAZA la función existente
export const listarProductos = async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de productos con estados correctos...');

    const [productos] = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        c.nombre_categoria,
        
        -- Datos del detalle del producto
        pd.id_detalle_producto as id_detalle,
        pd.precio,
        pd.stock,
        m.nombre_marca,
        t.nombre_talla,
        
        -- ESTADO ACTUAL CORREGIDO - el más reciente por PRODUCTO (no por detalle)
        COALESCE(estado_producto.id_estado, 1) as id_estado,
        COALESCE(estado_producto.nombre_estado, 'Disponible') as nombre_estado,
        COALESCE(estado_producto.descripcion_estado, 'Producto disponible') as descripcion_estado,
        estado_producto.fecha_cb_estado
        
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      INNER JOIN talla t ON pd.talla_id_talla = t.id_talla
      
      -- Subconsulta para obtener el estado más reciente de cada PRODUCTO
      LEFT JOIN (
        SELECT 
          pd_estado.producto_id_producto,
          ep.id_estado,
          ep.nombre_estado,
          ep.descripcion_estado,
          dep.fecha_cb_estado,
          ROW_NUMBER() OVER (
            PARTITION BY pd_estado.producto_id_producto 
            ORDER BY dep.fecha_cb_estado DESC, dep.id_detalle_estado DESC
          ) as rn
        FROM producto_detalle pd_estado
        INNER JOIN detalle_estado_pro dep ON pd_estado.id_detalle_producto = dep.producto_detalle_id_detalle_producto
        INNER JOIN estado_producto ep ON dep.estado_producto_id_estado = ep.id_estado
      ) estado_producto ON p.id_producto = estado_producto.producto_id_producto AND estado_producto.rn = 1
      
      ORDER BY p.id_producto, pd.id_detalle_producto
    `);

    console.log(`📋 Productos obtenidos: ${productos.length} registros`);
    
    // Debug: mostrar primeros productos con su estado
    if (productos.length > 0) {
      console.log('🔍 Primeros 3 productos con estados:');
      productos.slice(0, 3).forEach(p => {
        console.log(`- ${p.nombre_producto}: estado_id=${p.id_estado}, nombre="${p.nombre_estado}"`);
      });
    }

    res.json(productos);
  } catch (err) {
    console.error('❌ Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// FUNCIÓN ADICIONAL: Verificar y corregir estados automáticamente
export const verificarYCorregirEstados = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔍 Verificando estados de productos...');

    await connection.beginTransaction();

    // Obtener todos los productos con su stock total
    const [productos] = await connection.execute(`
      SELECT 
        p.id_producto,
        p.nombre_producto,
        COALESCE(SUM(pd.stock), 0) as stock_total
      FROM producto p
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      GROUP BY p.id_producto, p.nombre_producto
    `);

    let productosCorregidos = 0;

    for (const producto of productos) {
      // Obtener estado actual
      const [estadoActual] = await connection.execute(`
        SELECT ep.id_estado, ep.nombre_estado
        FROM detalle_estado_pro dep
        INNER JOIN producto_detalle pd ON dep.producto_detalle_id_detalle_producto = pd.id_detalle_producto
        INNER JOIN estado_producto ep ON dep.estado_producto_id_estado = ep.id_estado
        WHERE pd.producto_id_producto = ?
        ORDER BY dep.fecha_cb_estado DESC, dep.id_detalle_estado DESC
        LIMIT 1
      `, [producto.id_producto]);

      if (estadoActual.length === 0) {
        // Si no tiene estado, asignar "Disponible" por defecto
        const [variantes] = await connection.execute(
          'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ?',
          [producto.id_producto]
        );

        for (const variante of variantes) {
          await connection.execute(`
            INSERT INTO detalle_estado_pro (
              fecha_cb_estado, 
              descripcion_cb_estado, 
              producto_detalle_id_detalle_producto, 
              estado_producto_id_estado
            ) VALUES (NOW(), 'Estado inicial asignado automáticamente', ?, 1)
          `, [variante.id_detalle_producto]);
        }

        productosCorregidos++;
        console.log(`✅ Estado inicial asignado a: ${producto.nombre_producto}`);
      } else {
        const estadoActualId = estadoActual[0].id_estado;
        const stockTotal = parseInt(producto.stock_total);

        // Aplicar lógica automática solo si no está inhabilitado
        let nuevoEstado = null;
        
        if (estadoActualId !== 3) { // No es inhabilitado
          if (stockTotal === 0 && estadoActualId !== 2) {
            nuevoEstado = 2; // Cambiar a Agotado
          } else if (stockTotal > 0 && estadoActualId === 2) {
            nuevoEstado = 1; // Cambiar a Disponible
          }
        }

        if (nuevoEstado && nuevoEstado !== estadoActualId) {
          const [variantes] = await connection.execute(
            'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ?',
            [producto.id_producto]
          );

          const nombreNuevoEstado = nuevoEstado === 1 ? 'Disponible' : 'Agotado';
          
          for (const variante of variantes) {
            await connection.execute(`
              INSERT INTO detalle_estado_pro (
                fecha_cb_estado, 
                descripcion_cb_estado, 
                producto_detalle_id_detalle_producto, 
                estado_producto_id_estado
              ) VALUES (NOW(), ?, ?, ?)
            `, [
              `Estado corregido automáticamente a ${nombreNuevoEstado} (Stock: ${stockTotal})`,
              variante.id_detalle_producto,
              nuevoEstado
            ]);
          }

          productosCorregidos++;
          console.log(`🔄 ${producto.nombre_producto}: ${estadoActual[0].nombre_estado} → ${nombreNuevoEstado}`);
        }
      }
    }

    await connection.commit();

    console.log(`✅ Verificación completada: ${productosCorregidos} productos corregidos`);

    res.json({
      success: true,
      message: 'Estados verificados y corregidos',
      productos_procesados: productos.length,
      productos_corregidos: productosCorregidos
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al verificar estados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar estados',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

// FUNCIÓN DE MANTENIMIENTO: Limpiar estados inconsistentes
export const limpiarEstadosInconsistentes = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧹 Limpiando estados inconsistentes...');

    await connection.beginTransaction();

    // Eliminar estados huérfanos (sin producto_detalle válido)
    const [estadosHuerfanos] = await connection.execute(`
      DELETE dep FROM detalle_estado_pro dep
      LEFT JOIN producto_detalle pd ON dep.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      WHERE pd.id_detalle_producto IS NULL
    `);

    console.log(`🗑️ Eliminados ${estadosHuerfanos.affectedRows} estados huérfanos`);

    // Asegurar que todos los productos tengan al menos un estado
    const [productosSinEstado] = await connection.execute(`
      SELECT DISTINCT p.id_producto, p.nombre_producto
      FROM producto p
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      LEFT JOIN detalle_estado_pro dep ON pd.id_detalle_producto = dep.producto_detalle_id_detalle_producto
      WHERE dep.id_detalle_estado IS NULL
    `);

    let estadosCreados = 0;
    
    for (const producto of productosSinEstado) {
      const [variantes] = await connection.execute(
        'SELECT id_detalle_producto FROM producto_detalle WHERE producto_id_producto = ?',
        [producto.id_producto]
      );

      for (const variante of variantes) {
        await connection.execute(`
          INSERT INTO detalle_estado_pro (
            fecha_cb_estado, 
            descripcion_cb_estado, 
            producto_detalle_id_detalle_producto, 
            estado_producto_id_estado
          ) VALUES (NOW(), 'Estado creado durante limpieza de inconsistencias', ?, 1)
        `, [variante.id_detalle_producto]);
        
        estadosCreados++;
      }

      console.log(`✅ Estados creados para: ${producto.nombre_producto}`);
    }

    await connection.commit();

    console.log(`✅ Limpieza completada: ${estadosCreados} estados creados`);

    res.json({
      success: true,
      message: 'Estados inconsistentes limpiados',
      estados_huerfanos_eliminados: estadosHuerfanos.affectedRows,
      estados_creados: estadosCreados
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al limpiar estados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al limpiar estados inconsistentes',
      details: error.message
    });
  } finally {
    connection.release();
  }
};