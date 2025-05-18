import pool from '../config/db.js';  // usa pool consistente
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10;

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id_usuario; // coincide con el payload JWT que usas

    const [rows] = await pool.query(
      'SELECT id_usuario, nombre, apellido, correo, rol FROM usuario WHERE id_usuario = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener perfil de usuario' });
  }
};

export const registerUser = async (req, res) => {
  const {
    nombre,
    apellido,
    correo,
    contrasena,
    rol,
    rut,
    direccion,
    ciudad,
    region_id,
    comuna_id
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    const [existing] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Correo ya registrado' });
    }

    await pool.query(
      `INSERT INTO usuario (nombre, apellido, correo, contrasena, rol, estado, rut, direccion, ciudad, region_id, comuna_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        correo,
        hashedPassword,
        rol || 'cliente',
        'A',
        rut,
        direccion,
        ciudad,
        region_id,
        comuna_id
      ]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);

    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const usuario = rows[0];
    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
        correo: usuario.correo,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, usuario: { nombre: usuario.nombre, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
