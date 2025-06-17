import pool from '../config/db.js';

export const obtenerRegiones = async (req, res) => {
  try {
    console.log('Obteniendo regiones...');
    const [regiones] = await pool.query(`
      SELECT id_region, nombre_region 
      FROM region
      ORDER BY nombre_region
    `);
    console.log('Regiones obtenidas:', regiones.length);
    res.json(regiones);
  } catch (error) {
    console.error('Error al obtener regiones:', error);
    res.status(500).json({ error: 'Error al obtener las regiones' });
  }
};

export const obtenerComunasPorRegion = async (req, res) => {
  const { regionId } = req.params;
  
  console.log('=== DEBUG COMUNAS ===');
  console.log('RegionId recibido:', regionId);
  console.log('Tipo de regionId:', typeof regionId);
  
  if (!regionId || isNaN(regionId)) {
    console.log('RegionId inválido');
    return res.status(400).json({ error: 'ID de región inválido' });
  }

  try {
    console.log('Ejecutando consulta para región:', regionId);
    
    // Primero verifica si la conexión funciona
    const [testConnection] = await pool.query('SELECT 1 as test');
    console.log('Conexión DB OK:', testConnection);
    
    // Verifica si la tabla existe
    const [tableExists] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'comuna'
    `);
    console.log('Tabla comuna existe:', tableExists[0].count > 0);
    
    // Verifica la estructura de la tabla
    const [columns] = await pool.query('DESCRIBE comuna');
    console.log('Columnas de la tabla comuna:', columns.map(col => col.Field));
    
    // Ejecuta la consulta original
    const [comunas] = await pool.query(`
      SELECT id_comuna, nombre_comuna 
      FROM comuna 
      WHERE region_id_region = ?
      ORDER BY nombre_comuna
    `, [regionId]);
    
    console.log('Comunas encontradas:', comunas.length);
    console.log('Primeras 3 comunas:', comunas.slice(0, 3));
    
    if (comunas.length === 0) {
      console.log('No se encontraron comunas para región:', regionId);
      return res.status(404).json({ error: 'No se encontraron comunas para esta región' });
    }
    
    res.json(comunas);
  } catch (error) {
    console.error('Error completo al obtener comunas:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error al obtener las comunas',
      details: error.message 
    });
  }
};