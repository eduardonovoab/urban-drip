import pool from '../config/db.js';
import bcrypt from 'bcrypt';

export const registerUser = async (req, res) => {
  let {
    nombre_usuario,          // Cambiado de 'nombre' a 'nombre_usuario'
    apellido_usuario,        // Cambiado de 'apellido' a 'apellido_usuario'
    correo,
    contrasena,
    rol,
    estado_usuario,          // Cambiado de 'estado' a 'estado_usuario'
    rut,
    direccion,
    region_id_region,        // Cambiado de 'region_id' a 'region_id_region'
    comuna_id_comuna         // Campo comuna agregado a la tabla usuario
  } = req.body;

  // Si no se envía estado_usuario, asignar 'Activo' por defecto
  if (!estado_usuario) {
    estado_usuario = 'Activo';
  }

  // Si no se envía rol, asignar 'cliente' por defecto
  if (!rol) {
    rol = 'cliente';
  }

  try {
    // Validar que el correo no exista
    const [existingEmail] = await pool.query(
      'SELECT * FROM usuario WHERE correo = ?', 
      [correo]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Correo ya registrado' });
    }

    // Validar que el RUT no exista
    const [existingRut] = await pool.query(
      'SELECT * FROM usuario WHERE rut = ?', 
      [rut]
    );
    if (existingRut.length > 0) {
      return res.status(400).json({ error: 'RUT ya registrado' });
    }

    // Validar que la comuna existe y pertenece a la región
    const [comunaExists] = await pool.query(
      'SELECT id_comuna FROM comuna WHERE id_comuna = ? AND region_id_region = ?', 
      [comuna_id_comuna, region_id_region]
    );
    if (comunaExists.length === 0) {
      return res.status(400).json({ error: 'Comuna no válida para la región seleccionada' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar usuario (incluyendo comuna)
    const [result] = await pool.query(
      `INSERT INTO usuario 
       (nombre_usuario, apellido_usuario, correo, contrasena, rol, estado_usuario, rut, direccion, region_id_region, comuna_id_comuna)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_usuario,
        apellido_usuario,
        correo,
        hashedPassword,
        rol,
        estado_usuario,
        rut,
        direccion,
        region_id_region,
        comuna_id_comuna
      ]
    );

    res.status(201).json({ 
      message: 'Usuario creado correctamente', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ 
      error: 'Error al crear usuario',
      details: error.message 
    });
  }
};