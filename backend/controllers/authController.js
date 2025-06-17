import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10;

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    
    const [rows] = await pool.query(
      'SELECT id_usuario, nombre_usuario, apellido_usuario, correo, rol FROM usuario WHERE id_usuario = ?',
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
    nombre_usuario,
    apellido_usuario,
    correo,
    contrasena,
    rol,
    rut,
    direccion,
    region_id_region,
    comuna_id_comuna // Si tienes este campo
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    const [existing] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Correo ya registrado' });
    }

    // Ajustado a tu estructura de BD
    await pool.query(
      `INSERT INTO usuario (nombre_usuario, apellido_usuario, correo, contrasena, rol, estado_usuario, rut, direccion, region_id_region)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_usuario,
        apellido_usuario,
        correo,
        hashedPassword,
        rol || 'cliente',
        'activo',
        rut,
        direccion,
        region_id_region
      ]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: error.message });
  }
};
export const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  console.log('Intento de login:', { correo, contrasena: '***' });

  try {
    // Verificar que se envíen los datos
    if (!correo || !contrasena) {
      console.log('Faltan datos:', { correo: !!correo, contrasena: !!contrasena });
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    const [rows] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
    console.log('Usuarios encontrados:', rows.length);

    if (rows.length === 0) {
      console.log('Usuario no encontrado con correo:', correo);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const usuario = rows[0];
    console.log('Usuario encontrado:', {
      id: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      estado: usuario.estado_usuario,
      hasPassword: !!usuario.contrasena,
      passwordLength: usuario.contrasena ? usuario.contrasena.length : 0
    });
    
    // CORRECCIÓN: Verificar estado del usuario (insensible a mayúsculas/minúsculas)
    if (usuario.estado_usuario.toLowerCase() !== 'activo') {
      console.log('Usuario inactivo:', usuario.estado_usuario);
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    // Comparar contraseñas
    console.log('Comparando contraseñas...');
    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    console.log('Resultado de comparación:', match);

    if (!match) {
      console.log('Contraseña incorrecta para usuario:', correo);
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
        correo: usuario.correo,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login exitoso para:', correo);

    res.json({ 
      token, 
      usuario: { 
        id: usuario.id_usuario,
        nombre: usuario.nombre_usuario,
        apellido: usuario.apellido_usuario, 
        rol: usuario.rol,
        correo: usuario.correo
      } 
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyToken = (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = decoded;
    return res.status(200).json({ message: 'Token válido', user: decoded });
  });
};