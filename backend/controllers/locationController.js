// controllers/locationController.js
import pool from '../config/db.js';

export const obtenerRegiones = async (req, res) => {
  try {
    const [regiones] = await pool.query('SELECT id_region, nombre_region FROM region');
    res.json(regiones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener regiones' });
  }
};

export const obtenerComunasPorRegion = async (req, res) => {
  const { regionId } = req.params;
  try {
    const [comunas] = await pool.query('SELECT id_comuna, nombre_comuna FROM comuna WHERE region_id = ?', [regionId]);
    res.json(comunas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comunas' });
  }
};
