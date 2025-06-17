// controllers/webpayController.js - CORREGIDO: BÚSQUEDA DE PEDIDOS
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import pool from '../config/db.js';

dotenv.config();

// CONFIGURACIÓN CORREGIDA PARA TRANSBANK WEBPAY PLUS
const WEBPAY_BASE_URL = process.env.WEBPAY_BASE_URL || 'https://webpay3gint.transbank.cl';

// Credenciales para ambiente de integración
const WEBPAY_API_KEY = process.env.WEBPAY_API_KEY || '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';
const WEBPAY_COMMERCE_CODE = process.env.WEBPAY_COMMERCE_CODE || '597055555532';

// Headers correctos para Webpay Plus API
const getWebpayHeaders = () => ({
  'Content-Type': 'application/json',
  'Tbk-Api-Key-Id': WEBPAY_COMMERCE_CODE,
  'Tbk-Api-Key-Secret': WEBPAY_API_KEY,
});

// ============================================
// FUNCIONES DE APOYO PARA ESTADOS DE PEDIDO
// ============================================

// Obtener ID de estado por nombre
const getEstadoIdByName = async (nombreEstado) => {
  try {
    const [estado] = await pool.execute(
      'SELECT id_estado FROM estado_pedido WHERE nombre_estado = ?',
      [nombreEstado]
    );
    console.log(`🔍 Estado "${nombreEstado}":`, estado.length > 0 ? estado[0].id_estado : 'NO ENCONTRADO');
    return estado.length > 0 ? estado[0].id_estado : null;
  } catch (error) {
    console.error(`❌ Error obteniendo estado ${nombreEstado}:`, error);
    return null;
  }
};

// Crear registro de cambio de estado
const crearCambioEstado = async (connection, pedidoId, estadoId, descripcion = '') => {
  try {
    const result = await connection.execute(`
      INSERT INTO detalle_estado (fecha_cb_estado, descripcion_cb_estado, pedido_id_pedido, estado_pedido_id_estado)
      VALUES (NOW(), ?, ?, ?)
    `, [descripcion, pedidoId, estadoId]);
    
    console.log(`✅ Estado creado: Pedido ${pedidoId} → Estado ${estadoId} (${descripcion})`);
    return result;
  } catch (error) {
    console.error(`❌ Error creando cambio de estado:`, error);
    throw error;
  }
};

// Obtener estado actual de un pedido
const getEstadoActualPedido = async (pedidoId) => {
  try {
    const [estado] = await pool.execute(`
      SELECT ep.nombre_estado, ep.id_estado, de.fecha_cb_estado, de.descripcion_cb_estado
      FROM detalle_estado de
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.pedido_id_pedido = ?
      ORDER BY de.fecha_cb_estado DESC, de.id_detalle_estado DESC
      LIMIT 1
    `, [pedidoId]);
    
    if (estado.length > 0) {
      console.log(`🔍 Estado actual del pedido ${pedidoId}:`, estado[0]);
      return estado[0];
    } else {
      console.log(`⚠️ No se encontró estado para el pedido ${pedidoId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error obteniendo estado actual del pedido ${pedidoId}:`, error);
    return null;
  }
};

// 🔥 FUNCIÓN CORREGIDA: Buscar pedido por buy_order
const buscarPedidoPorBuyOrder = async (buyOrder) => {
  console.log(`🔍 Buscando pedido para buyOrder: ${buyOrder}`);
  
  try {
    // MÉTODO 1: Buscar por timestamp en buyOrder
    // Si buyOrder es "ORD1734388234567890", extraer el timestamp
    const timestampMatch = buyOrder.match(/ORD(\d{13})/);
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1]);
      const fecha = new Date(timestamp);
      
      console.log(`📅 Timestamp extraído: ${timestamp} → Fecha: ${fecha.toISOString()}`);
      
      // Buscar pedidos creados en un rango de ±5 minutos del timestamp
      const [pedidosPorFecha] = await pool.execute(`
        SELECT DISTINCT p.id_pedido, p.usuario_id_usuario, p.total, p.fecha_pedido,
               ep.nombre_estado, de.fecha_cb_estado
        FROM pedido p
        JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
        JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
        WHERE de.id_detalle_estado = (
          SELECT MAX(de2.id_detalle_estado)
          FROM detalle_estado de2
          WHERE de2.pedido_id_pedido = p.id_pedido
        )
        AND ep.nombre_estado = 'Pendiente'
        AND p.fecha_pedido BETWEEN DATE_SUB(?, INTERVAL 5 MINUTE) AND DATE_ADD(?, INTERVAL 5 MINUTE)
        ORDER BY ABS(TIMESTAMPDIFF(SECOND, p.fecha_pedido, ?)) ASC
        LIMIT 1
      `, [fecha, fecha, fecha]);
      
      if (pedidosPorFecha.length > 0) {
        console.log(`✅ Pedido encontrado por timestamp:`, pedidosPorFecha[0]);
        return pedidosPorFecha[0];
      }
    }
    
    // MÉTODO 2: Buscar el último pedido en estado Pendiente (fallback)
    console.log('🔄 Buscando último pedido pendiente como fallback...');
    
    const [ultimoPendiente] = await pool.execute(`
      SELECT DISTINCT p.id_pedido, p.usuario_id_usuario, p.total, p.fecha_pedido,
             ep.nombre_estado, de.fecha_cb_estado
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      AND ep.nombre_estado = 'Pendiente'
      AND p.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      ORDER BY p.id_pedido DESC
      LIMIT 1
    `);
    
    if (ultimoPendiente.length > 0) {
      console.log(`✅ Último pedido pendiente encontrado:`, ultimoPendiente[0]);
      return ultimoPendiente[0];
    }
    
    // MÉTODO 3: Listar todos los pedidos pendientes para debug
    console.log('🔍 Listando todos los pedidos pendientes para debug...');
    
    const [todosPendientes] = await pool.execute(`
      SELECT DISTINCT p.id_pedido, p.usuario_id_usuario, p.total, p.fecha_pedido,
             ep.nombre_estado, de.fecha_cb_estado, de.descripcion_cb_estado
      FROM pedido p
      JOIN detalle_estado de ON p.id_pedido = de.pedido_id_pedido
      JOIN estado_pedido ep ON de.estado_pedido_id_estado = ep.id_estado
      WHERE de.id_detalle_estado = (
        SELECT MAX(de2.id_detalle_estado)
        FROM detalle_estado de2
        WHERE de2.pedido_id_pedido = p.id_pedido
      )
      AND ep.nombre_estado = 'Pendiente'
      ORDER BY p.id_pedido DESC
      LIMIT 5
    `);
    
    console.log(`📋 Pedidos pendientes encontrados (${todosPendientes.length}):`, todosPendientes);
    
    if (todosPendientes.length > 0) {
      console.log(`✅ Usando el pedido pendiente más reciente:`, todosPendientes[0]);
      return todosPendientes[0];
    }
    
    console.log('❌ No se encontró ningún pedido pendiente');
    return null;
    
  } catch (error) {
    console.error(`❌ Error buscando pedido por buyOrder ${buyOrder}:`, error);
    return null;
  }
};

// Validación mejorada para Transbank
const validateTransbankFormat = (value, fieldName) => {
  const regex = /^[a-zA-Z0-9]{1,26}$/;
  if (!regex.test(value)) {
    throw new Error(`${fieldName} debe contener solo caracteres alfanuméricos y máximo 26 caracteres`);
  }
};

const fetchWithTimeout = async (url, options, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const crearTransaccion = async (req, res) => {
  try {
    const { amount, buyOrder, sessionId, returnUrl } = req.body;

    console.log('=== INICIANDO CREACIÓN DE TRANSACCIÓN WEBPAY PLUS ===');
    console.log('Datos recibidos:', { amount, buyOrder, sessionId, returnUrl });

    // Validaciones básicas
    if (!amount || !buyOrder || !sessionId || !returnUrl) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        required: ['amount', 'buyOrder', 'sessionId', 'returnUrl']
      });
    }

    // Validar monto
    const numericAmount = parseInt(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ 
        error: `El monto debe ser un número válido mayor a 0. Recibido: ${amount}` 
      });
    }

    // Validar formato Transbank
    try {
      validateTransbankFormat(buyOrder, 'buyOrder');
      validateTransbankFormat(sessionId, 'sessionId');
    } catch (validationError) {
      return res.status(422).json({ 
        error: validationError.message
      });
    }

    // Validar URL de retorno
    try {
      new URL(returnUrl);
    } catch (urlError) {
      return res.status(400).json({ 
        error: `URL de retorno inválida: ${returnUrl}` 
      });
    }

    // Datos para Transbank (formato exacto requerido)
    const transactionData = {
      buy_order: buyOrder,
      session_id: sessionId,
      amount: numericAmount,
      return_url: returnUrl
    };

    const headers = getWebpayHeaders();
    
    // URL CORREGIDA - Usar la API correcta de Webpay Plus
    const apiUrl = `${WEBPAY_BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions`;

    console.log('=== CONFIGURACIÓN PARA TRANSBANK ===');
    console.log('URL API:', apiUrl);
    console.log('Commerce Code:', WEBPAY_COMMERCE_CODE);
    console.log('Transaction Data:', transactionData);

    // Petición a Transbank
    const response = await fetchWithTimeout(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(transactionData)
    });

    console.log('=== RESPUESTA DE TRANSBANK ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    // Obtener respuesta
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textResponse = await response.text();
      console.error('Respuesta no es JSON:', textResponse);
      
      return res.status(502).json({
        error: 'El servidor de pagos devolvió una respuesta inválida',
        details: process.env.NODE_ENV === 'development' ? textResponse : 'Invalid response format'
      });
    }

    console.log('Response Data:', responseData);

    // Manejar errores de Transbank
    if (!response.ok) {
      let errorMessage = 'Error en servidor de pagos';
      
      if (responseData.error_message) {
        errorMessage = responseData.error_message;
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }

      console.error('=== ERROR DE TRANSBANK ===');
      console.error('Status:', response.status);
      console.error('Error:', errorMessage);

      return res.status(response.status).json({
        error: errorMessage,
        transbank_status: response.status,
        details: process.env.NODE_ENV === 'development' ? responseData : undefined
      });
    }

    // Validar respuesta exitosa
    if (!responseData.url || !responseData.token) {
      console.error('=== RESPUESTA INCOMPLETA ===');
      console.error('Faltan campos:', {
        url: !responseData.url ? 'FALTA' : 'OK',
        token: !responseData.token ? 'FALTA' : 'OK'
      });
      
      return res.status(502).json({
        error: 'Respuesta incompleta del servidor de pagos',
        missing: {
          url: !responseData.url,
          token: !responseData.token
        }
      });
    }

    console.log('=== TRANSACCIÓN CREADA EXITOSAMENTE ===');
    console.log('Token:', responseData.token);
    console.log('URL de pago:', responseData.url);

    // IMPORTANTE: Construir la URL correcta para el formulario de pago
    // Transbank requiere que se envíe un formulario POST, no una redirección GET
    const correctPaymentUrl = `${WEBPAY_BASE_URL}/webpayserver/initTransaction`;
    
    res.status(200).json({
      success: true,
      token: responseData.token,
      url: correctPaymentUrl, // URL corregida para el formulario
      buyOrder: buyOrder,
      sessionId: sessionId,
      amount: numericAmount,
      
      // Información adicional para debug
      debug: process.env.NODE_ENV === 'development' ? {
        original_url: responseData.url,
        corrected_url: correctPaymentUrl,
        api_url_used: apiUrl,
        commerce_code: WEBPAY_COMMERCE_CODE,
        transbank_response: responseData
      } : undefined
    });

  } catch (error) {
    console.error('=== ERROR INTERNO ===');
    console.error('Error completo:', error);
    
    let statusCode = 500;
    let errorMessage = 'Error interno del servidor';

    if (error.name === 'AbortError') {
      statusCode = 504;
      errorMessage = 'Tiempo de espera agotado con Transbank';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      statusCode = 503;
      errorMessage = 'No se puede conectar con Transbank';
    } else if (error.code === 'ENOTFOUND') {
      statusCode = 503;
      errorMessage = 'Servidor de Transbank no encontrado';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Conexión rechazada por Transbank';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      } : undefined
    });
  }
};

// 🚀 FUNCIÓN CORREGIDA: Confirmar pago + Sistema de Estados
export const confirmarPago = async (req, res) => {
  let connection = null;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Transbank puede enviar tanto GET como POST
    const token_ws = req.query.token_ws || req.body.token_ws;

    console.log('=== CONFIRMANDO PAGO + ACTUALIZANDO PEDIDO ===');
    console.log('Token recibido:', token_ws);
    console.log('Method:', req.method);
    console.log('Query params:', req.query);
    console.log('Body:', req.body);

    if (!token_ws) {
      return res.status(400).json({
        success: false,
        message: 'Token de transacción requerido',
        error: 'Missing token_ws parameter'
      });
    }

    const headers = getWebpayHeaders();
    const apiUrl = `${WEBPAY_BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions/${token_ws}`;

    console.log('💳 PASO 1: Confirmando con Transbank en URL:', apiUrl);

    // Confirmar transacción con PUT
    const response = await fetchWithTimeout(apiUrl, {
      method: 'PUT',
      headers: headers
    });

    console.log('=== RESPUESTA DE CONFIRMACIÓN TRANSBANK ===');
    console.log('Status:', response.status);

    const responseData = await response.json();
    console.log('Datos de confirmación:', responseData);

    if (!response.ok) {
      let errorMessage = 'Error al confirmar transacción';
      
      if (responseData.error_message) {
        errorMessage = responseData.error_message;
      }
      
      await connection.commit(); // No hay cambios que revertir
      
      return res.status(response.status).json({
        success: false,
        message: errorMessage,
        error: responseData.error_message || 'Confirmation error'
      });
    }

    // Verificar estado del pago
    const isApproved = responseData.status === 'AUTHORIZED';
    
    console.log('=== RESULTADO DEL PAGO TRANSBANK ===');
    console.log('Estado:', responseData.status);
    console.log('Aprobado:', isApproved);
    
    if (isApproved) {
      console.log('Authorization Code:', responseData.authorization_code);
      console.log('Amount:', responseData.amount);
      console.log('Buy Order:', responseData.buy_order);
      
      // 🔥 PASO 2: INTEGRACIÓN CON SISTEMA DE ESTADOS DE PEDIDOS
      console.log('🏪 PASO 2: Integrando con sistema de pedidos...');
      
      try {
        // Buscar pedido asociado
        const pedido = await buscarPedidoPorBuyOrder(responseData.buy_order);
        
        if (pedido) {
          const pedidoId = pedido.id_pedido;
          console.log(`🔍 Pedido encontrado: ${pedidoId}`);
          console.log(`📋 Estado actual: ${pedido.nombre_estado}`);
          
          if (pedido.nombre_estado === 'Pendiente') {
            console.log('✅ Pedido está en estado Pendiente, procediendo con confirmación...');
            
            // PASO 3: Reducir stock de productos
            console.log('📉 PASO 3: Reduciendo stock...');
            
            const [items] = await connection.execute(`
              SELECT dp.cantidad, pd.id_detalle_producto, pd.stock, p.nombre_producto
              FROM detalle_pedido dp
              JOIN producto_detalle pd ON dp.producto_detalle_id_detalle_producto = pd.id_detalle_producto
              JOIN producto p ON pd.producto_id_producto = p.id_producto
              WHERE dp.pedido_id_pedido = ?
            `, [pedidoId]);

            console.log(`🛍️ Procesando ${items.length} productos en el pedido:`);
            items.forEach((item, index) => {
              console.log(`   ${index + 1}. ${item.nombre_producto} - Cantidad: ${item.cantidad}, Stock actual: ${item.stock}`);
            });

            // Validar stock antes de reducir
            const stockInsuficiente = [];
            for (const item of items) {
              if (item.stock < item.cantidad) {
                stockInsuficiente.push(`${item.nombre_producto} (Stock: ${item.stock}, Necesario: ${item.cantidad})`);
              }
            }

            if (stockInsuficiente.length > 0) {
              const errorMessage = `Stock insuficiente para: ${stockInsuficiente.join(', ')}`;
              console.error('❌', errorMessage);
              throw new Error(errorMessage);
            }

            // Reducir stock
            let stockReducido = 0;
            for (const item of items) {
              const [updateResult] = await connection.execute(`
                UPDATE producto_detalle SET stock = stock - ? WHERE id_detalle_producto = ?
              `, [item.cantidad, item.id_detalle_producto]);
              
              if (updateResult.affectedRows > 0) {
                console.log(`   ✅ ${item.nombre_producto}: -${item.cantidad} unidades`);
                stockReducido++;
              } else {
                console.log(`   ⚠️ No se pudo actualizar stock para ${item.nombre_producto}`);
              }
            }

            console.log(`✅ Stock reducido para ${stockReducido}/${items.length} productos`);

            // PASO 4: Cambiar estado del pedido a "Pagado"
            console.log('📋 PASO 4: Cambiando estado a Pagado...');
            
            const estadoPagadoId = await getEstadoIdByName('Pagado');
            
            if (estadoPagadoId) {
              const descripcionCambio = `Pago confirmado exitosamente - Transbank Auth: ${responseData.authorization_code}, Monto: $${responseData.amount}, Buy Order: ${responseData.buy_order}`;
              
              await crearCambioEstado(
                connection, 
                pedidoId, 
                estadoPagadoId, 
                descripcionCambio
              );

              console.log('🎉 ¡PAGO E INTEGRACIÓN COMPLETADOS EXITOSAMENTE!');
              console.log(`📦 Pedido ${pedidoId} ahora está en estado PAGADO`);
            } else {
              console.error('❌ No se encontró el estado "Pagado" en la base de datos');
              console.log('🔍 Verificando estados disponibles...');
              
              const [estadosDisponibles] = await connection.execute('SELECT * FROM estado_pedido');
              console.log('Estados en BD:', estadosDisponibles);
            }
          } else {
            console.log(`⚠️ Pedido ${pedidoId} no está en estado Pendiente. Estado actual: ${pedido.nombre_estado}`);
            console.log('ℹ️ Es posible que el pago ya haya sido procesado anteriormente');
          }
        } else {
          console.log('❌ No se encontró pedido asociado a buyOrder:', responseData.buy_order);
          console.log('🔍 Esto puede deberse a:');
          console.log('   1. El timestamp en buyOrder no coincide con ningún pedido');
          console.log('   2. No hay pedidos en estado Pendiente recientes');
          console.log('   3. El pedido ya fue procesado anteriormente');
        }
      } catch (pedidoError) {
        console.error('❌ Error procesando pedido:', pedidoError);
        throw pedidoError; // Re-lanzar para que se revierta la transacción
      }
    } else {
      console.log('❌ Pago no aprobado por Transbank:', responseData.status);
    }

    await connection.commit();
    console.log('✅ Transacción de base de datos confirmada');

    // Respuesta final (manteniendo tu formato original)
    res.json({
      success: isApproved,
      message: isApproved ? 'Pago aprobado y procesado exitosamente' : 'Pago rechazado',
      details: {
        status: responseData.status,
        authorization_code: responseData.authorization_code,
        transaction_date: responseData.transaction_date,
        amount: responseData.amount,
        buy_order: responseData.buy_order,
        session_id: responseData.session_id,
        card_detail: responseData.card_detail ? {
          card_number: responseData.card_detail.card_number
        } : null,
        response_code: responseData.response_code,
        vci: responseData.vci
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.log('🔄 Transacción de base de datos revertida debido a error');
    }
    
    console.error('=== ERROR AL CONFIRMAR PAGO ===');
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno al confirmar el pago',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Función para confirmar transacción (endpoint original)
export const confirmarTransaccion = async (req, res) => {
  return confirmarPago(req, res);
};

// Función para obtener estado de transacción
export const obtenerEstadoTransaccion = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token de transacción requerido' 
      });
    }

    const headers = getWebpayHeaders();
    const apiUrl = `${WEBPAY_BASE_URL}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`;
    
    const response = await fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: headers
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error_message || 'Error obteniendo estado de transacción'
      });
    }

    res.status(200).json({
      success: true,
      transaction: data
    });

  } catch (error) {
    console.error('Error obteniendo estado de transacción:', error);
    
    res.status(500).json({ 
      error: 'Error interno al obtener estado de transacción'
    });
  }
};