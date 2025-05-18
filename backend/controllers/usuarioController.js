import pool from '../config/db.js';
import bcrypt from 'bcrypt';


export const registerUser = async (req, res) => {
  let {
    nombre,
    apellido,
    correo,
    contrasena,
    rol,
    estado,
    rut,
    direccion,
    ciudad,
    region_id,
    comuna_id,
  } = req.body;

  // Si no se envía estado, asignar 'A' por defecto
  if (!estado) {
    estado = 'A';
  }

  try {
    // Validar que el correo no exista
    const [existing] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Correo ya registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar usuario
    const [result] = await pool.query(
      `INSERT INTO usuario 
      (nombre, apellido, correo, contrasena, rol, estado, rut, direccion, ciudad, region_id, comuna_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        correo,
        hashedPassword,
        rol,
        estado,
        rut,
        direccion,
        ciudad,
        region_id,
        comuna_id,
      ]
    );

    res.status(201).json({ message: 'Usuario creado correctamente', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};