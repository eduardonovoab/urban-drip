// ===============================================
// SISTEMA AUTOMATIZADO DE ACTUALIZACIÓN DE ESTADOS - NUEVA LÓGICA
// Archivo: utils/estadosAutomaticos.js
// ===============================================

import cron from 'node-cron';
import pool from '../config/db.js';

/**
 * Función para actualizar automáticamente los estados basado en stock - NUEVA LÓGICA
 * Solo cambia entre Disponible (1) ↔ Agotado (2)
 * NO toca productos Inhabilitados (3)
 */
export const actualizarEstadosAutomaticos = async () => {
  try {
    console.log('🤖 [CRON] Iniciando actualización automática de estados...');

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
    let cambios = [];

    for (const producto of productos) {
      const estadoActual = parseInt(producto.estado_actual);
      const stockTotal = parseInt(producto.stock_total);
      
      // NUEVA LÓGICA: Solo cambiar entre Disponible (1) y Agotado (2)
      let nuevoEstado = null;
      
      if (estadoActual === 1 && stockTotal === 0) {
        // Disponible → Agotado
        nuevoEstado = 2;
      } else if (estadoActual === 2 && stockTotal > 0) {
        // Agotado → Disponible
        nuevoEstado = 1;
      }
      
      if (nuevoEstado && nuevoEstado !== estadoActual) {
        // Actualizar estado
        const descripcion = `Estado actualizado automáticamente por CRON: ${nuevoEstado === 1 ? 'Disponible' : 'Agotado'} (Stock: ${stockTotal}) - ${new Date().toLocaleString()}`;
        
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
        
        console.log(`🔄 [CRON] Producto "${producto.nombre_producto}": Estado ${estadoActual} → ${nuevoEstado} (Stock: ${stockTotal})`);
      }
    }

    console.log(`✅ [CRON] Actualización automática completada:`);
    console.log(`   📊 Productos procesados: ${productos.length}`);
    console.log(`   🔄 Productos actualizados: ${productosActualizados}`);
    console.log(`   🚫 Productos inhabilitados: EXCLUIDOS (no se modifican)`);
    
    if (cambios.length > 0) {
      console.log(`   📝 Cambios realizados:`, cambios);
    }

    return {
      productosProcessos: productos.length,
      productosActualizados,
      cambios
    };

  } catch (error) {
    console.error('❌ [CRON] Error en actualización automática de estados:', error);
    throw error;
  }
};

/**
 * Función para actualizar estado de un producto específico cuando cambia su stock - NUEVA LÓGICA
 * Solo cambia entre Disponible (1) ↔ Agotado (2)
 * NO toca productos Inhabilitados (3)
 * @param {number} productoId - ID del producto
 * @param {string} descripcionAdicional - Descripción adicional del cambio
 */
export const actualizarEstadoPorStock = async (productoId, descripcionAdicional = '') => {
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

    // NUEVA LÓGICA: No actualizar productos inhabilitados (estado 3)
    if (estadoActual === 3) {
      console.log('🚫 Producto inhabilitado, no se actualiza automáticamente');
      return false;
    }

    // Solo cambiar entre Disponible (1) y Agotado (2)
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
    throw error;
  }
};

/**
 * Configurar el CRON job para ejecutar cada 30 minutos
 */
export const configurarCronEstados = () => {
  // Ejecutar cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    try {
      await actualizarEstadosAutomaticos();
    } catch (error) {
      console.error('❌ [CRON] Error en tarea programada:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Santiago" // Ajustar según tu zona horaria
  });

  console.log('⏰ CRON job configurado: Actualización de estados cada 30 minutos');
  console.log('📋 Lógica: Solo Disponible ↔ Agotado. Los Inhabilitados se mantienen sin cambios.');
};

/**
 * Ejecutar actualización inmediata de estados (útil para testing)
 */
export const ejecutarActualizacionInmediata = async () => {
  console.log('🚀 Ejecutando actualización inmediata de estados...');
  console.log('📋 Regla: Solo se actualizan productos Disponibles ↔ Agotados');
  return await actualizarEstadosAutomaticos();
};

// Exportar todo
export default {
  actualizarEstadosAutomaticos,
  actualizarEstadoPorStock,
  configurarCronEstados,
  ejecutarActualizacionInmediata
};