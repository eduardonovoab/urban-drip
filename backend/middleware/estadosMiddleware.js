// ===============================================
// MIDDLEWARE PARA ACTUALIZACIÓN AUTOMÁTICA DE ESTADOS
// Archivo: middleware/estadosMiddleware.js
// ===============================================

import pool from '../config/db.js';

/**
 * Función para actualizar estado de un producto específico cuando cambia su stock
 * @param {number} productoId - ID del producto
 * @param {string} descripcionAdicional - Descripción adicional del cambio
 */
const actualizarEstadoPorStock = async (productoId, descripcionAdicional = '') => {
  try {
    console.log(`🔄 Actualizando estado automático del producto ${productoId}...`);

    // Obtener stock total y estado actual del producto
    const consultaQuery = `
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
      WHERE p.id_producto = ?
      GROUP BY p.id_producto, p.nombre_producto
    `;

    const [resultado] = await pool.execute(consultaQuery, [productoId]);

    if (resultado.length === 0) {
      console.log('⚠️ Producto no encontrado para actualización de estado');
      return false;
    }

    const producto = resultado[0];
    const estadoActual = parseInt(producto.estado_actual);
    const stockTotal = parseInt(producto.stock_total);

    // No actualizar productos inhabilitados (estado 3) o si no tienen estado
    if (!estadoActual || estadoActual === 3) {
      console.log('🚫 Producto inhabilitado o sin estado, no se actualiza automáticamente');
      return false;
    }

    // Determinar nuevo estado
    let nuevoEstado = null;
    
    if (estadoActual === 1 && stockTotal === 0) {
      nuevoEstado = 2; // Disponible → Agotado
    } else if (estadoActual === 2 && stockTotal > 0) {
      nuevoEstado = 1; // Agotado → Disponible
    }

    if (nuevoEstado && nuevoEstado !== estadoActual) {
      const descripcion = `Estado actualizado automáticamente: ${nuevoEstado === 1 ? 'Disponible' : 'Agotado'} (Stock: ${stockTotal})${descripcionAdicional ? ' - ' + descripcionAdicional : ''} - ${new Date().toLocaleString()}`;
      
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
        productoId
      ]);

      console.log(`✅ Estado actualizado: ${producto.nombre_producto} → ${nuevoEstado === 1 ? 'Disponible' : 'Agotado'}`);
      return true;
    }

    console.log('ℹ️ No se requiere actualización de estado');
    return false;

  } catch (error) {
    console.error(`❌ Error al actualizar estado del producto ${productoId}:`, error);
    // No lanzar error para no afectar la operación principal
    return false;
  }
};

/**
 * Middleware para actualizar estados después de modificaciones de stock
 */
export const actualizarEstadosMiddleware = (req, res, next) => {
  // Interceptar la respuesta original
  const originalSend = res.send;
  
  res.send = function(data) {
    // Llamar al método original primero
    originalSend.call(this, data);
    
    // Luego actualizar estados si la operación fue exitosa
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Verificar si la ruta requiere actualización de estados
      const rutasQueActualizanStock = [
        '/api/admin/producto-detalle', // POST - crear detalle
        '/api/admin/producto-detalle/', // PUT - actualizar detalle
        '/api/admin/producto/', // PUT - actualizar producto
        '/api/client/pedido', // POST - crear pedido (reduce stock)
        '/api/pedido/', // POST - crear pedido alternativo
      ];
      
      const requiereActualizacion = rutasQueActualizanStock.some(ruta => {
        return req.path.includes(ruta.replace('/api', '')) || req.path.includes(ruta);
      });
      
      if (requiereActualizacion) {
        // Extraer ID del producto según la ruta
        let productoId = null;
        
        // Para rutas de producto-detalle, extraer producto_id del body
        if (req.body && req.body.producto_id) {
          productoId = req.body.producto_id;
        } 
        // Para rutas de producto directo, usar el parámetro id
        else if (req.params && req.params.id) {
          productoId = req.params.id;
        }
        // Para pedidos, necesitaríamos extraer los productos del pedido
        // (esto es más complejo y se puede implementar después)
        
        if (productoId) {
          // Actualizar estado de forma asíncrona (no bloquear la respuesta)
          setImmediate(async () => {
            try {
              await actualizarEstadoPorStock(productoId, `Operación: ${req.method} ${req.originalUrl}`);
            } catch (error) {
              console.error('❌ Error en middleware de actualización de estados:', error);
            }
          });
        }
      }
    }
  };
  
  next();
};

export default actualizarEstadosMiddleware;