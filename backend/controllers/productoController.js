import pool from '../config/db.js';

// ========== FUNCIÓN AUXILIAR PARA AGRUPAR PRODUCTOS ==========
const agruparProductos = (rows) => {
  const productosMap = new Map();
  
  rows.forEach(row => {
    const productoId = row.id_producto;
    
    if (!productosMap.has(productoId)) {
      // Crear nuevo producto
      productosMap.set(productoId, {
        id_producto: row.id_producto,
        nombre_producto: row.nombre_producto,
        descripcion: row.descripcion || '',
        imagen_url: row.imagen_url || '/images/placeholder-product.jpg',
        categoria: {
          id_categoria: row.id_categoria,
          nombre_categoria: row.nombre_categoria
        },
        detalles: [],
        // Estadísticas que se calcularán después
        precio_minimo: null,
        precio_maximo: null,
        stock_total: 0,
        marcas_disponibles: [],
        tallas_disponibles: []
      });
    }
    
    // Agregar detalle al producto
    const producto = productosMap.get(productoId);
    if (row.id_detalle_producto) {
      producto.detalles.push({
        id_detalle_producto: row.id_detalle_producto,
        precio: Number(row.precio) || 0,
        stock: Number(row.stock) || 0,
        marca: {
          id_marca: row.id_marca,
          nombre_marca: row.nombre_marca || 'Sin marca'
        },
        talla: {
          id_talla: row.id_talla,
          nombre_talla: row.nombre_talla || 'Sin talla'
        },
        // Información de estado si existe
        estado_producto: row.estado_producto,
        fecha_estado_producto: row.fecha_estado_producto,
        descripcion_estado_producto: row.descripcion_estado_producto
      });
    }
  });
  
  // Calcular estadísticas para cada producto
  const productosConEstadisticas = Array.from(productosMap.values()).map(producto => {
    const detalles = producto.detalles;
    const precios = detalles.map(d => d.precio).filter(p => p > 0);
    const stockTotal = detalles.reduce((total, d) => total + d.stock, 0);
    
    return {
      ...producto,
      total_detalles: detalles.length,
      precio_minimo: precios.length > 0 ? Math.min(...precios) : 0,
      precio_maximo: precios.length > 0 ? Math.max(...precios) : 0,
      stock_total: stockTotal,
      tiene_detalles: detalles.length > 0,
      marcas_disponibles: [...new Set(detalles.map(d => d.marca.nombre_marca).filter(m => m && m !== 'Sin marca'))],
      tallas_disponibles: [...new Set(detalles.map(d => d.talla.nombre_talla).filter(t => t && t !== 'Sin talla'))]
    };
  });
  
  return productosConEstadisticas;
};

// ========== CONTROLADORES ==========

// OPCIÓN 2: Devolver productos agrupados con TODOS sus detalles en un array
export const getProductosAgrupadosConDetalles = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'ID de categoría inválido',
        productos: []
      });
    }

    console.log('=== OBTENIENDO PRODUCTOS AGRUPADOS CON DETALLES PARA CATEGORÍA:', id, '===');

    // Verificar si la categoría existe
    const [categoria] = await pool.execute(
      'SELECT id_categoria, nombre_categoria FROM categoria WHERE id_categoria = ?',
      [parseInt(id)]
    );

    if (categoria.length === 0) {
      return res.status(404).json({
        error: 'Categoría no encontrada',
        productos: []
      });
    }

    // Primero obtener los productos de la categoría
    const queryProductos = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        p.categoria_id_categoria,
        c.nombre_categoria
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      WHERE c.id_categoria = ?
      ORDER BY p.nombre_producto ASC
    `;

    const [productos] = await pool.execute(queryProductos, [parseInt(id)]);

    if (productos.length === 0) {
      return res.json({
        categoria: categoria[0].nombre_categoria,
        categoria_id: parseInt(id),
        total_productos: 0,
        mensaje: 'No hay productos en esta categoría',
        productos: []
      });
    }

    // Para cada producto, obtener TODOS sus detalles
    const productosConDetalles = await Promise.all(
      productos.map(async (producto) => {
        const queryDetalles = `
          SELECT 
            pd.id_detalle_producto,
            pd.precio,
            pd.stock,
            pd.marca_id_marca,
            pd.talla_id_talla,
            m.nombre_marca,
            t.nombre_talla
          FROM producto_detalle pd
          LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
          LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
          WHERE pd.producto_id_producto = ?
          ORDER BY pd.precio ASC
        `;

        const [detalles] = await pool.execute(queryDetalles, [producto.id_producto]);

        // Calcular estadísticas si hay detalles
        const precios = detalles.map(d => Number(d.precio)).filter(p => p > 0);
        const stockTotal = detalles.reduce((total, d) => total + Number(d.stock || 0), 0);

        return {
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre_producto || 'Producto sin nombre',
          descripcion: producto.descripcion || '',
          imagen_url: producto.imagen_url || '/images/placeholder-product.jpg',
          categoria_id: producto.categoria_id_categoria,
          nombre_categoria: producto.nombre_categoria || 'Sin categoría',
          
          // TODOS LOS DETALLES DEL PRODUCTO
          detalles: detalles.map(detalle => ({
            id_detalle_producto: detalle.id_detalle_producto,
            precio: Number(detalle.precio) || 0,
            stock: Number(detalle.stock) || 0,
            marca_id: detalle.marca_id_marca,
            talla_id: detalle.talla_id_talla,
            nombre_marca: detalle.nombre_marca || 'Sin marca',
            nombre_talla: detalle.nombre_talla || 'Sin talla'
          })),
          
          // ESTADÍSTICAS ÚTILES
          total_detalles: detalles.length,
          precio_minimo: precios.length > 0 ? Math.min(...precios) : 0,
          precio_maximo: precios.length > 0 ? Math.max(...precios) : 0,
          stock_total: stockTotal,
          tiene_detalles: detalles.length > 0,
          
          // RESUMEN DE MARCAS Y TALLAS DISPONIBLES
          marcas_disponibles: [...new Set(detalles.map(d => d.nombre_marca).filter(m => m && m !== 'Sin marca'))],
          tallas_disponibles: [...new Set(detalles.map(d => d.nombre_talla).filter(t => t && t !== 'Sin talla'))]
        };
      })
    );

    // Opcional: Filtrar solo productos que tienen detalles
    const productosConDetallesDisponibles = productosConDetalles.filter(p => p.tiene_detalles);

    console.log('Productos encontrados:', productos.length);
    console.log('Productos con detalles:', productosConDetallesDisponibles.length);
    console.log('Productos sin detalles:', productosConDetalles.length - productosConDetallesDisponibles.length);

    res.json({
      categoria: categoria[0].nombre_categoria,
      categoria_id: parseInt(id),
      total_productos: productosConDetallesDisponibles.length,
      productos: productosConDetallesDisponibles
    });

  } catch (error) {
    console.error('Error completo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      productos: []
    });
  }
};

// Obtener producto por ID con todos sus detalles - CORREGIDO
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID sea un número válido
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    console.log('=== OBTENIENDO PRODUCTO POR ID:', id, '===');

    // Query para obtener el producto con sus detalles usando pool
    const query = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        c.id_categoria,
        c.nombre_categoria,
        pd.id_detalle_producto,
        pd.precio,
        pd.stock,
        m.id_marca,
        m.nombre_marca,
        t.id_talla,
        t.nombre_talla
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      LEFT JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE p.id_producto = ?
      ORDER BY pd.id_detalle_producto
    `;

    const [rows] = await pool.execute(query, [parseInt(id)]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Estructurar la respuesta para que coincida con tu frontend
    const producto = {
      id_producto: rows[0].id_producto,
      nombre_producto: rows[0].nombre_producto,
      descripcion: rows[0].descripcion,
      imagen_url: rows[0].imagen_url,
      categoria: {
        id_categoria: rows[0].id_categoria,
        nombre_categoria: rows[0].nombre_categoria
      },
      detalles: []
    };

    // Agrupar los detalles del producto
    rows.forEach(row => {
      if (row.id_detalle_producto) {
        producto.detalles.push({
          id_detalle_producto: row.id_detalle_producto,
          precio: parseFloat(row.precio),
          stock: row.stock,
          talla_id_talla: row.nombre_talla, // Para que coincida con tu frontend
          marca_id_marca: row.nombre_marca,
          marca: {
            id_marca: row.id_marca,
            nombre_marca: row.nombre_marca
          },
          talla: {
            id_talla: row.id_talla,
            nombre_talla: row.nombre_talla
          }
        });
      }
    });

    // Si no tiene detalles, crear un array vacío
    if (producto.detalles.length === 0) {
      console.warn(`Producto ${id} no tiene detalles asociados`);
    }

    console.log('Producto encontrado:', producto);
    res.status(200).json(producto);

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener todos los productos - CORREGIDO
export const getAllProductos = async (req, res) => {
  try {
    const { categoria, marca, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT DISTINCT
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        c.nombre_categoria,
        MIN(pd.precio) as precio_min,
        MAX(pd.precio) as precio_max,
        SUM(pd.stock) as stock_total
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      LEFT JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      LEFT JOIN marca m ON pd.marca_id_marca = m.id_marca
      WHERE 1=1
    `;

    const params = [];

    if (categoria) {
      query += ' AND c.id_categoria = ?';
      params.push(categoria);
    }

    if (marca) {
      query += ' AND m.id_marca = ?';
      params.push(marca);
    }

    query += `
      GROUP BY p.id_producto, p.nombre_producto, p.descripcion, p.imagen_url, c.nombre_categoria
      ORDER BY p.id_producto
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, params);

    const productos = rows.map(row => ({
      id_producto: row.id_producto,
      nombre_producto: row.nombre_producto,
      descripcion: row.descripcion,
      imagen_url: row.imagen_url,
      categoria: row.nombre_categoria,
      precio_min: parseFloat(row.precio_min) || 0,
      precio_max: parseFloat(row.precio_max) || 0,
      stock_total: row.stock_total || 0
    }));

    res.status(200).json(productos);

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar stock disponible - CORREGIDO
export const getStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { marca, talla } = req.query;

    let query = `
      SELECT 
        pd.id_detalle_producto,
        pd.stock,
        pd.precio,
        m.nombre_marca,
        t.nombre_talla
      FROM producto_detalle pd
      JOIN marca m ON pd.marca_id_marca = m.id_marca
      JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE pd.producto_id_producto = ?
    `;

    const params = [parseInt(id)];

    if (marca) {
      query += ' AND m.id_marca = ?';
      params.push(marca);
    }

    if (talla) {
      query += ' AND t.id_talla = ?';
      params.push(talla);
    }

    const [rows] = await pool.execute(query, params);

    res.status(200).json(rows);

  } catch (error) {
    console.error('Error al obtener stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock del producto'
    });
  }
};

// Endpoint mejorado para obtener productos con detalles
export const getproductodetalle = async (req, res) => {
  try {
    console.log('=== INICIANDO getproductodetalle ===');
    
    // Query principal con LEFT JOINs para obtener información completa
    const query = `
      SELECT 
        pd.id_detalle_producto,
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        c.nombre_categoria,
        c.id_categoria,
        m.nombre_marca,
        m.id_marca,
        pd.precio,
        pd.stock,
        t.nombre_talla,
        t.id_talla,
        -- Información del estado del producto (si existe)
        ep.nombre_estado as estado_producto,
        dep.fecha_cb_estado as fecha_estado_producto,
        dep.descripcion_cb_estado as descripcion_estado_producto
      FROM producto_detalle pd
      INNER JOIN producto p ON pd.producto_id_producto = p.id_producto
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      INNER JOIN talla t ON pd.talla_id_talla = t.id_talla
      -- LEFT JOIN para estados (puede que no todos los productos tengan estado)
      LEFT JOIN detalle_estado_pro dep ON pd.id_detalle_producto = dep.producto_detalle_id_detalle_producto
      LEFT JOIN estado_producto ep ON dep.estado_producto_id_estado = ep.id_estado
      WHERE pd.stock > 0
      ORDER BY 
        c.nombre_categoria, 
        p.nombre_producto, 
        FIELD(t.nombre_talla, 'XS', 'S', 'M', 'L', 'XL', 'XXL') ASC,
        pd.precio ASC
    `;
    
    console.log('Ejecutando consulta principal...');
    const [rows] = await pool.execute(query);
    
    console.log(`Filas obtenidas de la BD: ${rows.length}`);
    
    if (rows.length === 0) {
      return res.json({
        productos: [],
        estadisticas: {
          total_productos: 0,
          total_detalles: 0,
          categorias: [],
          marcas: [],
          tallas_disponibles: [],
          rango_precios: { minimo: 0, maximo: 0 }
        },
        timestamp: new Date().toISOString(),
        mensaje: 'No se encontraron productos con stock disponible'
      });
    }
    
    // Procesar los datos para agrupar por producto
    console.log('Agrupando productos...');
    const productosAgrupados = agruparProductos(rows);
    
    console.log(`Productos agrupados: ${productosAgrupados.length}`);
    
    // Agregar estadísticas útiles
    const categorias = [...new Map(rows.map(r => [r.id_categoria, {
      id: r.id_categoria,
      nombre: r.nombre_categoria
    }])).values()];
    
    const marcas = [...new Map(rows.map(r => [r.id_marca, {
      id: r.id_marca,
      nombre: r.nombre_marca
    }])).values()];
    
    const tallas = [...new Set(rows.map(r => r.nombre_talla))].sort((a, b) => {
      const orden = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      return orden.indexOf(a) - orden.indexOf(b);
    });
    
    const precios = rows.map(r => Number(r.precio)).filter(p => p > 0);
    
    const estadisticas = {
      total_productos: productosAgrupados.length,
      total_detalles: rows.length,
      categorias: categorias,
      marcas: marcas,
      tallas_disponibles: tallas,
      rango_precios: {
        minimo: precios.length > 0 ? Math.min(...precios) : 0,
        maximo: precios.length > 0 ? Math.max(...precios) : 0
      }
    };

    console.log(`✅ Respuesta exitosa: ${productosAgrupados.length} productos únicos con ${rows.length} variantes`);
    
    res.json({
      productos: productosAgrupados,
      estadisticas: estadisticas,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// ========== FUNCIÓN ADICIONAL PARA PRODUCTOS POR MARCA ==========
export const getProductosPorMarca = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'ID de marca inválido',
        productos: []
      });
    }

    console.log('=== OBTENIENDO PRODUCTOS POR MARCA:', id, '===');

    // Verificar si la marca existe
    const [marca] = await pool.execute(
      'SELECT id_marca, nombre_marca FROM marca WHERE id_marca = ?',
      [parseInt(id)]
    );

    if (marca.length === 0) {
      return res.status(404).json({
        error: 'Marca no encontrada',
        productos: []
      });
    }

    // Obtener productos de la marca con sus detalles
    const query = `
      SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.imagen_url,
        c.nombre_categoria,
        pd.precio,
        pd.stock,
        m.nombre_marca,
        t.nombre_talla
      FROM producto_detalle pd
      INNER JOIN producto p ON pd.producto_id_producto = p.id_producto
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      INNER JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE m.id_marca = ?
      ORDER BY p.nombre_producto ASC, pd.precio ASC
    `;

    const [rows] = await pool.execute(query, [parseInt(id)]);

    // Transformar los datos para el frontend
    const productos = rows.map(row => ({
      id_producto: row.id_producto,
      nombre: row.nombre_producto,
      descripcion: row.descripcion,
      imagen_url: row.imagen_url,
      categoria: row.nombre_categoria,
      precio: Number(row.precio),
      stock: Number(row.stock),
      marca: row.nombre_marca,
      talla: row.nombre_talla
    }));

    console.log(`Productos encontrados: ${productos.length}`);

    res.json({
      marcaNombre: marca[0].nombre_marca,
      marca_id: parseInt(id),
      total_productos: productos.length,
      productos: productos
    });

  } catch (error) {
    console.error('Error al obtener productos por marca:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      productos: []
    });
  }
};
// Obtener productos por talla
export const getProductosPorTalla = async (req, res) => {
  const { talla } = req.params; // Obtener talla desde los parámetros de la URL
  try {
    const [productos] = await pool.query(`
      SELECT 
        p.id_producto, 
        p.nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        c.nombre_categoria, 
        pd.precio, 
        pd.stock, 
        t.nombre_talla
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      INNER JOIN talla t ON pd.talla_id_talla = t.id_talla
      WHERE t.nombre_talla = ?
      ORDER BY p.nombre_producto ASC`, [talla]);

    if (productos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron productos para esta talla' });
    }

    res.json({ productos });
  } catch (error) {
    console.error('Error al obtener productos por talla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
// Obtener productos por categoría
export const getProductosPorCategoria = async (req, res) => {
  const { id } = req.params; // Obtener ID de la categoría desde los parámetros de la URL
  try {
    const [productos] = await pool.query(`
      SELECT 
        p.id_producto, 
        p.nombre_producto, 
        p.descripcion, 
        p.imagen_url, 
        c.nombre_categoria, 
        pd.precio, 
        pd.stock
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id_categoria = c.id_categoria
      INNER JOIN producto_detalle pd ON p.id_producto = pd.producto_id_producto
      WHERE c.id_categoria = ?
      ORDER BY p.nombre_producto ASC`, [id]);

    if (productos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron productos para esta categoría' });
    }

    res.json({ productos });
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
// Obtener todas las categorías
export const obtenerCategorias = async (req, res) => {
  try {
    console.log('=== OBTENIENDO TODAS LAS CATEGORÍAS ===');

    const query = `
      SELECT 
        c.id_categoria,
        c.nombre_categoria,
        COUNT(DISTINCT p.id_producto) as total_productos
      FROM categoria c
      LEFT JOIN producto p ON c.id_categoria = p.categoria_id_categoria
      GROUP BY c.id_categoria, c.nombre_categoria
      ORDER BY c.nombre_categoria ASC
    `;

    const [rows] = await pool.execute(query);

    // Transformar los datos para que coincidan con lo que espera tu frontend
    const categorias = rows.map(row => ({
      id_categoria: row.id_categoria,
      nombre_categoria: row.nombre_categoria,
      total_productos: row.total_productos || 0
    }));

    console.log(`Categorías encontradas: ${categorias.length}`);

    res.status(200).json(categorias);

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      categorias: []
    });
  }
};
export const obtenerMarcas = async (req, res) => {
  try {
    console.log('=== OBTENIENDO TODAS LAS MARCAS ===');

    const query = `
      SELECT 
        m.id_marca,
        m.nombre_marca,
        COUNT(DISTINCT pd.producto_id_producto) as total_productos
      FROM marca m
      LEFT JOIN producto_detalle pd ON m.id_marca = pd.marca_id_marca
      GROUP BY m.id_marca, m.nombre_marca
      ORDER BY m.nombre_marca ASC
    `;

    const [rows] = await pool.execute(query);

    // Transformar los datos para que coincidan con lo que espera tu frontend
    const marcas = rows.map(row => ({
      id_marca: row.id_marca,
      nombre_marca: row.nombre_marca,
      nombre: row.nombre_marca, // Alias adicional para compatibilidad
      total_productos: row.total_productos || 0
    }));

    console.log(`Marcas encontradas: ${marcas.length}`);

    res.status(200).json(marcas);

  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      marcas: []
    });
  }
};