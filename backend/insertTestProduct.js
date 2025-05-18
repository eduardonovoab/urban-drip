import pool from '../backend/config/db.js';

async function insertarProductoConDetalles() {
  const producto = {
    nombre: 'Zapatilla Air Max',
    descripcion: 'Zapatilla urbana edición limitada',
    imagen_url: 'https://url.com/zapatilla.jpg',
    estado: 'activo',
  };

  // Usar marcas y tallas que ya insertaste, por ejemplo:
  const detalles = [
    { marca_id: 1, talla_id: 3, precio: 79990, stock: 10 }, // Nike, talla M
    { marca_id: 2, talla_id: 4, precio: 74990, stock: 15 }, // Adidas, talla L
  ];

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO producto (nombre, descripcion, imagen_url, estado) VALUES (?, ?, ?, ?)',
      [producto.nombre, producto.descripcion, producto.imagen_url, producto.estado]
    );

    const id_producto = result.insertId;

    for (const detalle of detalles) {
      await conn.query(
        'INSERT INTO producto_detalle (producto_id, marca_id, talla_id, precio, stock) VALUES (?, ?, ?, ?, ?)',
        [id_producto, detalle.marca_id, detalle.talla_id, detalle.precio, detalle.stock]
      );
    }

    await conn.commit();
    console.log('Producto y detalles insertados correctamente');
  } catch (error) {
    await conn.rollback();
    console.error('Error al insertar producto:', error);
  } finally {
    conn.release();
  }
}

// Ejecuta la función para insertar
insertarProductoConDetalles();
