import pool from '../config/db.js';

// ========== DASHBOARD GENERAL ==========
export const getDashboardGeneral = async (req, res) => {
  try {
    console.log('=== GENERANDO DASHBOARD GENERAL ===');

    // Métricas principales - sin parámetros
    const [ventasResult] = await pool.execute(
      'SELECT COUNT(*) as ventas_mes FROM venta WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );

    const [ingresosResult] = await pool.execute(`
      SELECT COALESCE(SUM(p.total), 0) as ingresos_mes 
      FROM pedido p 
      INNER JOIN venta v ON p.id_pedido = v.pedido_id_pedido 
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const [clientesResult] = await pool.execute(
      'SELECT COUNT(DISTINCT usuario_id_usuario) as clientes_activos FROM pedido WHERE fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );

    const [stockResult] = await pool.execute(
      'SELECT COUNT(*) as productos_stock_bajo FROM producto_detalle WHERE stock <= 10'
    );

    const [pendientesResult] = await pool.execute(`
      SELECT COUNT(*) as pedidos_pendientes 
      FROM pedido p 
      LEFT JOIN venta v ON p.id_pedido = v.pedido_id_pedido 
      WHERE v.id_venta IS NULL
    `);

    // Ventas últimos 7 días
    const [ventasDiarias] = await pool.execute(`
      SELECT 
        DATE(v.fecha_venta) as fecha,
        COUNT(v.id_venta) as total_ventas,
        SUM(p.total) as ingresos_dia
      FROM venta v
      INNER JOIN pedido p ON v.pedido_id_pedido = p.id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(v.fecha_venta)
      ORDER BY fecha ASC
    `);

    // Top 5 productos
    const [topProductos] = await pool.execute(`
      SELECT 
        pr.nombre_producto,
        SUM(dp.cantidad) as cantidad_vendida,
        SUM(dp.cantidad * pd.precio) as ingresos
      FROM detalle_pedido dp
      INNER JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      INNER JOIN producto pr ON pd.producto_id_producto = pr.id_producto
      INNER JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      INNER JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY pr.id_producto, pr.nombre_producto
      ORDER BY cantidad_vendida DESC
      LIMIT 5
    `);

    res.json({
      metricas: {
        ventas_mes: ventasResult[0]?.ventas_mes || 0,
        ingresos_mes: ingresosResult[0]?.ingresos_mes || 0,
        clientes_activos: clientesResult[0]?.clientes_activos || 0,
        productos_stock_bajo: stockResult[0]?.productos_stock_bajo || 0,
        pedidos_pendientes: pendientesResult[0]?.pedidos_pendientes || 0
      },
      ventasDiarias,
      topProductos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al generar dashboard general:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};

// ========== REPORTE DE VENTAS ==========
export const getReporteVentas = async (req, res) => {
  try {
    console.log('=== GENERANDO REPORTE DE VENTAS ===');

    const [ventasData] = await pool.execute(`
      SELECT 
        DATE_FORMAT(v.fecha_venta, '%Y-%m') as periodo,
        COUNT(v.id_venta) as total_ventas,
        SUM(p.total) as ingresos_totales,
        AVG(p.total) as ticket_promedio,
        v.metodo_pago
      FROM venta v
      INNER JOIN pedido p ON v.pedido_id_pedido = p.id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(v.fecha_venta, '%Y-%m'), v.metodo_pago
      ORDER BY periodo DESC, v.metodo_pago
    `);

    const [metodosPagoData] = await pool.execute(`
      SELECT 
        v.metodo_pago,
        COUNT(v.id_venta) as cantidad_ventas,
        SUM(p.total) as total_ingresos,
        AVG(p.total) as promedio_venta
      FROM venta v
      INNER JOIN pedido p ON v.pedido_id_pedido = p.id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY v.metodo_pago
      ORDER BY total_ingresos DESC
    `);

    const [tendenciasData] = await pool.execute(`
      SELECT 
        MONTH(v.fecha_venta) as mes,
        YEAR(v.fecha_venta) as año,
        COUNT(v.id_venta) as ventas_mes,
        SUM(p.total) as ingresos_mes
      FROM venta v
      INNER JOIN pedido p ON v.pedido_id_pedido = p.id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(v.fecha_venta), MONTH(v.fecha_venta)
      ORDER BY año, mes
    `);

    res.json({
      ventasPorPeriodo: ventasData,
      metodosPago: metodosPagoData,
      tendencias: tendenciasData,
      resumen: {
        totalVentas: ventasData.reduce((sum, item) => sum + parseInt(item.total_ventas || 0), 0),
        ingresosTotales: ventasData.reduce((sum, item) => sum + parseFloat(item.ingresos_totales || 0), 0),
        ticketPromedio: ventasData.length > 0 ? 
          ventasData.reduce((sum, item) => sum + parseFloat(item.ticket_promedio || 0), 0) / ventasData.length : 0
      }
    });

  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};

// ========== PRODUCTOS MÁS VENDIDOS ==========
export const getProductosMasVendidos = async (req, res) => {
  try {
    console.log('=== GENERANDO REPORTE DE PRODUCTOS MÁS VENDIDOS ===');

    // Consulta completamente sin parámetros
    const [productosData] = await pool.execute(`
      SELECT 
        pr.id_producto,
        pr.nombre_producto,
        pr.descripcion,
        pr.imagen_url,
        c.nombre_categoria,
        m.nombre_marca,
        SUM(dp.cantidad) as cantidad_vendida,
        SUM(dp.cantidad * pd.precio) as ingresos_producto,
        AVG(pd.precio) as precio_promedio,
        COUNT(DISTINCT p.id_pedido) as pedidos_diferentes
      FROM detalle_pedido dp
      INNER JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
      INNER JOIN producto pr ON pd.producto_id_producto = pr.id_producto
      INNER JOIN categoria c ON pr.categoria_id_categoria = c.id_categoria
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      INNER JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      INNER JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      GROUP BY pr.id_producto, pr.nombre_producto, pr.descripcion, pr.imagen_url, c.nombre_categoria, m.nombre_marca
      ORDER BY cantidad_vendida DESC
      LIMIT 10
    `);

    console.log('Productos obtenidos:', productosData.length);

    const [categoriaData] = await pool.execute(`
      SELECT 
        c.nombre_categoria,
        COUNT(DISTINCT pr.id_producto) as productos_diferentes,
        COALESCE(SUM(dp.cantidad), 0) as cantidad_total,
        COALESCE(SUM(dp.cantidad * pd.precio), 0) as ingresos_categoria
      FROM categoria c
      LEFT JOIN producto pr ON c.id_categoria = pr.categoria_id_categoria
      LEFT JOIN producto_detalle pd ON pr.id_producto = pd.producto_id_producto
      LEFT JOIN detalle_pedido dp ON pd.id_detalle_producto = dp.producto_detalle_id_detalle_producto
      LEFT JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      LEFT JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      GROUP BY c.id_categoria, c.nombre_categoria
      ORDER BY cantidad_total DESC
    `);

    const [marcaData] = await pool.execute(`
      SELECT 
        m.nombre_marca,
        COUNT(DISTINCT pr.id_producto) as productos_diferentes,
        COALESCE(SUM(dp.cantidad), 0) as cantidad_total,
        COALESCE(SUM(dp.cantidad * pd.precio), 0) as ingresos_marca
      FROM marca m
      LEFT JOIN producto_detalle pd ON m.id_marca = pd.marca_id_marca
      LEFT JOIN producto pr ON pd.producto_id_producto = pr.id_producto
      LEFT JOIN detalle_pedido dp ON pd.id_detalle_producto = dp.producto_detalle_id_detalle_producto
      LEFT JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      LEFT JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      GROUP BY m.id_marca, m.nombre_marca
      ORDER BY cantidad_total DESC
    `);

    res.json({
      productosTop: productosData,
      ventasPorCategoria: categoriaData,
      ventasPorMarca: marcaData,
      resumen: {
        totalProductosVendidos: productosData.reduce((sum, item) => sum + parseInt(item.cantidad_vendida || 0), 0),
        ingresosTotales: productosData.reduce((sum, item) => sum + parseFloat(item.ingresos_producto || 0), 0),
        categoriaTop: categoriaData[0]?.nombre_categoria || 'N/A',
        marcaTop: marcaData[0]?.nombre_marca || 'N/A'
      }
    });

    console.log('Reporte de productos completado exitosamente');

  } catch (error) {
    console.error('Error al generar reporte de productos más vendidos:', error);
    console.error('Stack completo:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: error.stack
    });
  }
};

// ========== ESTADO DE INVENTARIO ==========
export const getEstadoInventario = async (req, res) => {
  try {
    console.log('=== GENERANDO REPORTE DE INVENTARIO ===');

    const [inventarioData] = await pool.execute(`
      SELECT 
        pd.id_detalle_producto,
        pr.id_producto,
        pr.nombre_producto,
        pr.descripcion,
        c.nombre_categoria,
        m.nombre_marca,
        t.nombre_talla,
        pd.precio,
        pd.stock,
        CASE 
          WHEN pd.stock = 0 THEN 'SIN_STOCK'
          WHEN pd.stock <= 10 THEN 'STOCK_BAJO'
          WHEN pd.stock <= 20 THEN 'STOCK_MEDIO'
          ELSE 'STOCK_ALTO'
        END as estado_stock
      FROM producto_detalle pd
      INNER JOIN producto pr ON pd.producto_id_producto = pr.id_producto
      INNER JOIN categoria c ON pr.categoria_id_categoria = c.id_categoria
      INNER JOIN marca m ON pd.marca_id_marca = m.id_marca
      INNER JOIN talla t ON pd.talla_id_talla = t.id_talla
      ORDER BY pd.stock ASC, pr.nombre_producto
    `);

    const [resumenCategorias] = await pool.execute(`
      SELECT 
        c.nombre_categoria,
        COUNT(pd.id_detalle_producto) as total_productos,
        SUM(pd.stock) as stock_total,
        SUM(CASE WHEN pd.stock = 0 THEN 1 ELSE 0 END) as sin_stock,
        SUM(CASE WHEN pd.stock <= 10 THEN 1 ELSE 0 END) as stock_bajo,
        AVG(pd.stock) as stock_promedio
      FROM producto_detalle pd
      INNER JOIN producto pr ON pd.producto_id_producto = pr.id_producto
      INNER JOIN categoria c ON pr.categoria_id_categoria = c.id_categoria
      GROUP BY c.id_categoria, c.nombre_categoria
      ORDER BY stock_total DESC
    `);

    const alertas = {
      sinStock: inventarioData.filter(item => item.estado_stock === 'SIN_STOCK'),
      stockBajo: inventarioData.filter(item => item.estado_stock === 'STOCK_BAJO'),
      rotacionRapida: []
    };

    res.json({
      inventario: inventarioData,
      resumenCategorias,
      alertas,
      estadisticas: {
        totalProductos: inventarioData.length,
        sinStock: alertas.sinStock.length,
        stockBajo: alertas.stockBajo.length,
        stockTotal: inventarioData.reduce((sum, item) => sum + parseInt(item.stock || 0), 0),
        valorInventario: inventarioData.reduce((sum, item) => sum + (parseInt(item.stock || 0) * parseFloat(item.precio || 0)), 0)
      }
    });

  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};

// ========== ANÁLISIS DE CLIENTES ==========
export const getAnalisisClientes = async (req, res) => {
  try {
    console.log('=== GENERANDO ANÁLISIS DE CLIENTES ===');

    // Query completamente sin parámetros
    const [clientesData] = await pool.execute(`
      SELECT 
        u.id_usuario,
        u.nombre_usuario,
        u.apellido_usuario,
        u.correo,
        u.rut,
        r.nombre_region,
        COUNT(p.id_pedido) as total_pedidos,
        SUM(p.total) as total_gastado,
        AVG(p.total) as promedio_compra,
        MAX(p.fecha_pedido) as ultima_compra,
        MIN(p.fecha_pedido) as primera_compra,
        DATEDIFF(CURDATE(), MAX(p.fecha_pedido)) as dias_sin_comprar
      FROM usuario u
      INNER JOIN pedido p ON u.id_usuario = p.usuario_id_usuario
      INNER JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      INNER JOIN region r ON u.region_id_region = r.id_region
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY u.id_usuario, u.nombre_usuario, u.apellido_usuario, u.correo, u.rut, r.nombre_region
      ORDER BY total_gastado DESC
      LIMIT 10
    `);

    console.log('Clientes obtenidos:', clientesData.length);

    const [distribucionData] = await pool.execute(`
      SELECT 
        r.nombre_region,
        COUNT(DISTINCT u.id_usuario) as total_clientes,
        COUNT(p.id_pedido) as total_pedidos,
        COALESCE(SUM(p.total), 0) as ingresos_region,
        COALESCE(AVG(p.total), 0) as promedio_pedido_region
      FROM region r
      LEFT JOIN usuario u ON r.id_region = u.region_id_region
      LEFT JOIN pedido p ON u.id_usuario = p.usuario_id_usuario
      LEFT JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      GROUP BY r.id_region, r.nombre_region
      ORDER BY ingresos_region DESC
    `);

    const [comportamientoData] = await pool.execute(`
      SELECT 
        'Total Clientes' as tipo,
        COUNT(DISTINCT u.id_usuario) as cantidad
      FROM usuario u
      UNION ALL
      SELECT 
        'Clientes con Compras' as tipo,
        COUNT(DISTINCT p.usuario_id_usuario) as cantidad
      FROM pedido p
      INNER JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    res.json({
      clientesTop: clientesData,
      distribucionGeografica: distribucionData,
      comportamiento: comportamientoData,
      estadisticas: {
        totalClientes: clientesData.length,
        clienteTop: clientesData[0] || null,
        regionTop: distribucionData[0] || null,
        promedioGastoCliente: clientesData.length > 0 ? 
          clientesData.reduce((sum, item) => sum + parseFloat(item.total_gastado || 0), 0) / clientesData.length : 0
      }
    });

    console.log('Análisis de clientes completado exitosamente');

  } catch (error) {
    console.error('Error al generar análisis de clientes:', error);
    console.error('Stack completo:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: error.stack
    });
  }
};

// ========== ESTADO DE PEDIDOS ==========
export const getEstadoPedidos = async (req, res) => {
  try {
    console.log('=== GENERANDO REPORTE DE ESTADO DE PEDIDOS ===');

    const [estadosData] = await pool.execute(`
      SELECT 
        'Completados' as nombre_estado,
        'Pedidos procesados y entregados' as descripcion_estado,
        COUNT(DISTINCT p.id_pedido) as cantidad_pedidos,
        AVG(DATEDIFF(v.fecha_venta, p.fecha_pedido)) as dias_promedio_estado
      FROM pedido p
      INNER JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      UNION ALL
      SELECT 
        'Pendientes' as nombre_estado,
        'Pedidos sin procesar' as descripcion_estado,
        COUNT(DISTINCT p.id_pedido) as cantidad_pedidos,
        AVG(DATEDIFF(CURDATE(), p.fecha_pedido)) as dias_promedio_estado
      FROM pedido p
      LEFT JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      WHERE v.id_venta IS NULL
    `);

    const [pedidosData] = await pool.execute(`
      SELECT 
        DATE(p.fecha_pedido) as fecha,
        COUNT(p.id_pedido) as total_pedidos,
        SUM(p.total) as total_ventas,
        COUNT(CASE WHEN v.id_venta IS NOT NULL THEN 1 END) as pedidos_completados,
        COUNT(CASE WHEN v.id_venta IS NULL THEN 1 END) as pedidos_pendientes
      FROM pedido p
      LEFT JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      WHERE p.fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(p.fecha_pedido)
      ORDER BY fecha DESC
    `);

    res.json({
      estadosPedidos: estadosData,
      pedidosPorPeriodo: pedidosData,
      tiemposProcesamiento: [],
      estadisticas: {
        totalPedidos: pedidosData.reduce((sum, item) => sum + parseInt(item.total_pedidos || 0), 0),
        pedidosCompletados: pedidosData.reduce((sum, item) => sum + parseInt(item.pedidos_completados || 0), 0),
        pedidosPendientes: pedidosData.reduce((sum, item) => sum + parseInt(item.pedidos_pendientes || 0), 0),
        tiempoPromedioEntrega: 0,
        eficienciaEntrega: 0
      }
    });

  } catch (error) {
    console.error('Error al generar reporte de estado de pedidos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};

// ========== RENDIMIENTO POR CATEGORÍAS ==========
export const getRendimientoCategorias = async (req, res) => {
  try {
    console.log('=== GENERANDO REPORTE DE RENDIMIENTO POR CATEGORÍAS ===');

    const [categoriaData] = await pool.execute(`
      SELECT 
        c.id_categoria,
        c.nombre_categoria,
        COUNT(DISTINCT pr.id_producto) as productos_categoria,
        COALESCE(SUM(dp.cantidad), 0) as cantidad_vendida,
        COALESCE(SUM(dp.cantidad * pd.precio), 0) as ingresos_categoria,
        COALESCE(AVG(pd.precio), 0) as precio_promedio,
        COUNT(DISTINCT p.id_pedido) as pedidos_diferentes,
        COUNT(DISTINCT p.usuario_id_usuario) as clientes_diferentes
      FROM categoria c
      LEFT JOIN producto pr ON c.id_categoria = pr.categoria_id_categoria
      LEFT JOIN producto_detalle pd ON pr.id_producto = pd.producto_id_producto
      LEFT JOIN detalle_pedido dp ON pd.id_detalle_producto = dp.producto_detalle_id_detalle_producto
      LEFT JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      LEFT JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      GROUP BY c.id_categoria, c.nombre_categoria
      ORDER BY ingresos_categoria DESC
    `);

    const [tendenciasData] = await pool.execute(`
      SELECT 
        c.nombre_categoria,
        DATE_FORMAT(v.fecha_venta, '%Y-%m') as periodo,
        SUM(dp.cantidad) as cantidad_mes,
        SUM(dp.cantidad * pd.precio) as ingresos_mes
      FROM categoria c
      INNER JOIN producto pr ON c.id_categoria = pr.categoria_id_categoria
      INNER JOIN producto_detalle pd ON pr.id_producto = pd.producto_id_producto
      INNER JOIN detalle_pedido dp ON pd.id_detalle_producto = dp.producto_detalle_id_detalle_producto
      INNER JOIN pedido p ON dp.pedido_id_pedido = p.id_pedido
      INNER JOIN venta v ON p.id_pedido = v.pedido_id_pedido
      WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY c.id_categoria, c.nombre_categoria, DATE_FORMAT(v.fecha_venta, '%Y-%m')
      ORDER BY c.nombre_categoria, periodo
    `);

    const totalIngresos = categoriaData.reduce((sum, cat) => sum + parseFloat(cat.ingresos_categoria || 0), 0);
    const categoriasConPorcentaje = categoriaData.map(categoria => ({
      ...categoria,
      porcentaje_ingresos: totalIngresos > 0 ? 
        Math.round((parseFloat(categoria.ingresos_categoria || 0) / totalIngresos) * 100 * 100) / 100 : 0,
      rentabilidad: parseInt(categoria.productos_categoria) > 0 ? 
        parseFloat(categoria.ingresos_categoria || 0) / parseInt(categoria.productos_categoria) : 0
    }));

    res.json({
      rendimientoCategorias: categoriasConPorcentaje,
      tendenciasPorCategoria: tendenciasData,
      estadisticas: {
        totalCategorias: categoriaData.length,
        categoriaTop: categoriasConPorcentaje[0] || null,
        ingresosTotales: totalIngresos,
        categoriaMasProductos: categoriaData.reduce((max, cat) => 
          parseInt(cat.productos_categoria || 0) > parseInt(max.productos_categoria || 0) ? cat : max, 
          categoriaData[0] || {}
        )
      }
    });

  } catch (error) {
    console.error('Error al generar reporte de rendimiento por categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};