import { db } from '../config/db.js';

export const crearPedido = async (req, res) => {
  const { productos, total, metodo_pago } = req.body;
  const id_usuario = req.user.id;

  try {
    // 1. Insertar el pedido
    const [pedidoResult] = await db.query(
      'INSERT INTO pedido (id_usuario, fecha_pedido, total, estado, id_usuario2) VALUES (?, NOW(), ?, ?, ?)',
      [id_usuario, total, 'pendiente', id_usuario]
    );

    const id_pedido = pedidoResult.insertId;

    // 2. Insertar detalle por producto
    for (const prod of productos) {
      const { detalle_producto_id, cantidad, precio_unitario } = prod;

      await db.query(
        'INSERT INTO detalle_pedido (pedido_id, detalle_producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [id_pedido, detalle_producto_id, cantidad, precio_unitario]
      );
    }

    // 3. Insertar venta (opcional)
    if (metodo_pago) {
      await db.query(
        'INSERT INTO venta (pedido_id, fecha_venta, metodo_pago) VALUES (?, NOW(), ?)',
        [id_pedido, metodo_pago]
      );
    }

    res.status(201).json({ message: 'Pedido creado con éxito', id_pedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
