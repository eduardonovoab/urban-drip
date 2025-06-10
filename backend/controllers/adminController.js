import pool from '../config/db.js';



export const getAdminDashboard = (req, res) => {
  try {
    // Aquí puedes colocar la lógica para obtener los datos del dashboard para el admin
    res.json({ message: 'Bienvenido al Dashboard de Admin' });  // Esto es un ejemplo
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el Dashboard de Admin' });
  }
};
// Obtener producto por ID con detalles
export const getProductoById = async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener datos básicos del producto
    const [productoRows] = await pool.query('SELECT * FROM producto WHERE id_producto = ?', [id]);
    if (productoRows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener detalles del producto con información completa
    const [detallesRows] = await pool.query(`
      SELECT 
        pd.id_detalle_producto,
        pd.marca_id,
        pd.talla_id,
        pd.precio,
        pd.stock,
        m.nombre as marca_nombre,
        t.talla as talla_nombre
      FROM producto_detalle pd
      LEFT JOIN marca m ON pd.marca_id = m.id_marca
      LEFT JOIN talla t ON pd.talla_id = t.id_talla
      WHERE pd.producto_id = ?
      ORDER BY t.talla
    `, [id]);

    console.log('🔍 Producto obtenido:', productoRows[0]);
    console.log('🔍 Detalles obtenidos:', detallesRows);

    // Estructurar respuesta
    const producto = {
      ...productoRows[0],
      detalles: detallesRows.map(detalle => ({
        id: detalle.id,
        id_detalle: detalle.id, // Para compatibilidad
        marca_id: detalle.marca_id,
        talla_id: detalle.talla_id,
        precio: detalle.precio,
        stock: detalle.stock,
        marca_nombre: detalle.marca_nombre,
        talla_nombre: detalle.talla_nombre
      }))
    };

    res.json(producto);

  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};
// Crear un producto nuevo
export const addProduct = async (req, res) => {
  const { nombre, descripcion, imagen_url, estado, categoria_id, detalles } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // CORRECCIÓN: agregar coma entre consulta y parámetros
    const [result] = await conn.query(
      'INSERT INTO producto (nombre, descripcion, imagen_url, estado, categoria_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, imagen_url, estado, categoria_id]
    );

    const id_producto = result.insertId;

    // Validar que detalles sea array antes de iterar
    if (Array.isArray(detalles) && detalles.length > 0) {
      for (const detalle of detalles) {
        const { marca_id, talla_id, precio, stock } = detalle;

        // CORRECCIÓN: corregir cadena SQL y agregar coma entre parámetros
        await conn.query(
          'INSERT INTO producto_detalle (producto_id, marca_id, talla_id, precio, stock) VALUES (?, ?, ?, ?, ?)',
          [id_producto, marca_id, talla_id, precio, stock]
        );
      }
    } else {
      // Si no hay detalles, puedes decidir qué hacer aquí
      // Por ejemplo, abortar o simplemente permitir producto sin detalles
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

    const [productos] = await pool.query(`
      SELECT 
  p.id_producto, 
  p.nombre AS nombre_producto, 
  p.descripcion, 
  p.imagen_url, 
  p.estado, 
  pd.precio,  
  c.nombre_categoria,
  m.nombre AS nombre_marca,  
  t.talla AS nombre_talla,
  pd.stock,
  pd.talla_id,  -- Incluyendo el campo talla_id y stock de producto_detalle
  pd.id_detalle_producto
FROM 
  producto p
INNER JOIN 
  categoria c ON p.categoria_id = c.id_categoria  
INNER JOIN 
  producto_detalle pd ON p.id_producto = pd.producto_id  
INNER JOIN 
  marca m ON pd.marca_id = m.id_marca  
INNER JOIN 
  talla t ON pd.talla_id = t.id_talla;

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
export const listarProductosPorCategoria = async (req, res) => {
  const categoriaId = req.params.id;

  try {
    const query = `
      SELECT 
        p.id_producto, 
        p.nombre AS nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        p.estado, 
        pd.precio,
        c.nombre_categoria,
        pd.id_detalle_producto,
        pd.marca_id,
        pd.talla_id,
        pd.stock
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id = c.id_categoria
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id
      WHERE p.estado = 'activo' AND c.id_categoria = ?;
    `;

    const [productos] = await pool.query(query, [categoriaId]);
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos por categoría' });
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

export const obtenerCategoriaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM categoria WHERE id_categoria = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(rows[0]);  // Retorna solo la categoría encontrada
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
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

export const getProductosPorMarca = async (req, res) => {
  const marcaId = req.params.id;
  try {
    const query = `
      SELECT p.*, pd.*, m.nombre as marcaNombre
      FROM producto p
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id
      INNER JOIN marca m ON pd.marca_id = m.id_marca
      WHERE m.id_marca = ?
    `;
    const [productos] = await pool.query(query, [marcaId]);

    const marcaNombre = productos.length > 0 ? productos[0].marcaNombre : '';

    res.json({ productos, marcaNombre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos por marca' });
  }
};
// Obtener una marca por ID
export const obtenerMarcaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM marca WHERE id_marca = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json(rows[0]); // Retorna solo la marca encontrada
  } catch (error) {
    console.error('Error al obtener marca:', error);
    res.status(500).json({ error: 'Error al obtener marca' });
  }
};


export const getProductoDetallePorId = async (req, res) => {
  const { id } = req.params; // id_detalle_producto

  try {
    const query = `
      SELECT 
        pd.id_detalle_producto,
        p.id_producto,
        p.nombre AS nombre_producto,
        p.descripcion,
        p.imagen_url,
        p.estado,
        pd.precio,
        pd.stock,
        t.talla AS nombre_talla,
        m.nombre AS nombre_marca,
        c.nombre_categoria,
        c.id_categoria
      FROM producto_detalle pd
      INNER JOIN producto p ON pd.producto_id = p.id_producto
      LEFT JOIN talla t ON pd.talla_id = t.id_talla
      LEFT JOIN marca m ON pd.marca_id = m.id_marca
      LEFT JOIN categoria c ON p.categoria_id = c.id_categoria
      WHERE pd.id_detalle_producto = ? AND p.estado = 'activo'
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener detalle de producto:', error);
    res.status(500).json({ error: 'Error al obtener detalle de producto' });
  }
};

export const obtenerDetallesPorProducto = async (req, res) => {
  const { productoId } = req.params;
  try {
    const query = `
      SELECT pd.id_detalle_producto, pd.precio, pd.stock, t.nombre_talla
      FROM producto_detalle pd
      LEFT JOIN talla t ON pd.talla_id = t.id_talla
      WHERE pd.producto_id = ?
    `;
    const [detalles] = await pool.query(query, [productoId]);
    res.json(detalles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalles por producto' });
  }
};
export const listarUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.query('SELECT id_usuario, nombre, apellido, correo, rol, estado FROM usuario');
    res.json(usuarios); // Devuelve los usuarios en formato JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar usuarios' });
  }
};
// controlador actualizarProducto 
export const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen_url, estado, categoria_id, detalles } = req.body;

  console.log('🔍 Datos recibidos para actualización:', {
    id,
    nombre,
    descripcion,
    imagen_url,
    estado,
    categoria_id,
    detalles
  });

  if (!nombre && !descripcion && !imagen_url && !estado && !categoria_id && !detalles) {
    return res.status(400).json({ message: 'No hay datos para actualizar' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Buscar producto actual
    const [productoActualArr] = await conn.query('SELECT * FROM producto WHERE id_producto = ?', [id]);
    if (productoActualArr.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const productoActual = productoActualArr[0];

    // 2. Actualizar datos básicos del producto
    const nuevoNombre = nombre ?? productoActual.nombre;
    const nuevaDescripcion = descripcion ?? productoActual.descripcion;
    const nuevaImagenUrl = imagen_url ?? productoActual.imagen_url;
    const nuevoEstado = estado ?? productoActual.estado;
    const nuevaCategoriaId = categoria_id ?? productoActual.categoria_id;

    await conn.query(
      `UPDATE producto SET nombre = ?, descripcion = ?, imagen_url = ?, estado = ?, categoria_id = ? WHERE id_producto = ?`,
      [nuevoNombre, nuevaDescripcion, nuevaImagenUrl, nuevoEstado, nuevaCategoriaId, id]
    );

    console.log('✅ Producto básico actualizado');

    // 3. Manejar detalles (tallas) - ESTA ES LA PARTE CRÍTICA
    if (Array.isArray(detalles) && detalles.length > 0) {
      console.log('🔍 Procesando detalles:', detalles);

      // Obtener detalles existentes
      const [detallesExistentes] = await conn.query(
        'SELECT id_detalle_producto, marca_id, talla_id, precio, stock FROM producto_detalle WHERE producto_id = ?',
        [id]
      );

      console.log('🔍 Detalles existentes en BD:', detallesExistentes);

      // Separar detalles a actualizar vs crear nuevos
      const detallesParaActualizar = [];
      const detallesParaCrear = [];
      const idsDetallesExistentes = detallesExistentes.map(detalle => detalle.id_detalle_producto);
      const idsDetallesEnviados = [];

      detalles.forEach(detalle => {
        if (detalle.id_detalle_producto && detalle.id_detalle_producto !== null) {
          // Detalle existente - actualizar
          detallesParaActualizar.push(detalle);
          idsDetallesEnviados.push(detalle.id_detalle_producto);
        } else {
          // Detalle nuevo - crear
          detallesParaCrear.push(detalle);
        }
      });

      console.log('🔍 Detalles para actualizar:', detallesParaActualizar);
      console.log('🔍 Detalles para crear:', detallesParaCrear);

      // Actualizar detalles existentes
      for (const detalle of detallesParaActualizar) {
        console.log('🔄 Actualizando detalle ID:', detalle.id_detalle_producto);
        await conn.query(
          `UPDATE producto_detalle SET marca_id = ?, talla_id = ?, precio = ?, stock = ? WHERE id_detalle_producto = ? AND producto_id = ?`,
          [detalle.marca_id, detalle.talla_id, detalle.precio, detalle.stock, detalle.id_detalle_producto, id]
        );
      }

      // Crear nuevos detalles
      for (const detalle of detallesParaCrear) {
        console.log('➕ Creando nuevo detalle:', detalle);
        await conn.query(
          `INSERT INTO producto_detalle (producto_id, marca_id, talla_id, precio, stock) VALUES (?, ?, ?, ?, ?)`,
          [id, detalle.marca_id, detalle.talla_id, detalle.precio, detalle.stock]
        );
      }

      // Eliminar detalles que ya no están en la lista enviada
      const detallesAEliminar = detallesExistentes.filter(detalle => !idsDetallesEnviados.includes(detalle.id_detalle_producto));
      if (detallesAEliminar.length > 0) {
        const detallesIdsAEliminar = detallesAEliminar.map(detalle => detalle.id_detalle_producto);
        const placeholders = detallesIdsAEliminar.map(() => '?').join(',');
        await conn.query(
          `DELETE FROM producto_detalle WHERE producto_id = ? AND id_detalle_producto IN (${placeholders})`,
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


// Controlador para actualizar el estado del usuario
export const actualizarEstadoUsuario = async (req, res) => {
  const { id } = req.params; // Obtén el id del usuario desde los parámetros
  const { estado } = req.body; // El estado nuevo que vamos a asignar (activo / inactivo)

  // Verificar si el estado es válido
  if (estado !== 'activo' && estado !== 'inactivo') {
    return res.status(400).json({ message: 'El estado debe ser "activo" o "inactivo"' });
  }

  try {
    // Ejecutar la consulta para actualizar el estado del usuario
    const [result] = await pool.query(
      'UPDATE usuario SET estado = ? WHERE id_usuario = ?',
      [estado, id]
    );

    // Verificar si el usuario fue encontrado y actualizado
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Responder con éxito
    res.status(200).json({ message: `El estado del usuario ha sido actualizado a ${estado}` });
  } catch (error) {
    console.error('Error al cambiar el estado del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

