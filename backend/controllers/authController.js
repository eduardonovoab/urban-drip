import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const saltRounds = 10;

// Configuración del transportador de email (configura según tu proveedor)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    // Configuración específica para Gmail
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Debe ser App Password de Gmail
    },
    tls: {
      rejectUnauthorized: false
    }
    
    // Alternativa usando solo 'service: gmail'
    // service: 'gmail',
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASSWORD
    // }
    
    // Para otros proveedores como SendGrid, Outlook, etc.
    // host: process.env.SMTP_HOST,
    // port: process.env.SMTP_PORT,
    // secure: false,
    // auth: {
    //   user: process.env.SMTP_USER,
    //   pass: process.env.SMTP_PASSWORD
    // }
  });
};

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
    comuna_id_comuna
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    const [existing] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Correo ya registrado' });
    }

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
    
    if (usuario.estado_usuario.toLowerCase() !== 'activo') {
      console.log('Usuario inactivo:', usuario.estado_usuario);
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    console.log('Comparando contraseñas...');
    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    console.log('Resultado de comparación:', match);

    if (!match) {
      console.log('Contraseña incorrecta para usuario:', correo);
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 🔥 CAMBIO AQUÍ: Sin expiración para admin, 1 día para otros
    const tokenOptions = usuario.rol === 'admin' ? {} : { expiresIn: '1d' };
    
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
        correo: usuario.correo,
      },
      process.env.JWT_SECRET,
      tokenOptions
    );

    console.log('Login exitoso para:', correo, 'Rol:', usuario.rol, 'Token expira:', usuario.rol === 'admin' ? 'NUNCA' : '1 día');

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

export const forgotPassword = async (req, res) => {
  const { correo } = req.body;

  console.log('Solicitud de recuperación de contraseña para:', correo);

  try {
    if (!correo) {
      return res.status(400).json({ message: 'El correo es requerido' });
    }

    // Verificar variables de entorno necesarias
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Faltan variables de entorno: EMAIL_USER o EMAIL_PASSWORD');
      return res.status(500).json({ message: 'Configuración de email incompleta' });
    }

    // Verificar que el usuario existe
    const [rows] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);

    if (rows.length === 0) {
      console.log('Usuario no encontrado para recuperación:', correo);
      return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
    }

    const usuario = rows[0];

    // Verificar que el usuario esté activo
    if (usuario.estado_usuario.toLowerCase() !== 'activo') {
      return res.status(401).json({ message: 'La cuenta no está activa' });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Válido por 1 hora

    // Guardar el token en la base de datos
    await pool.query(
      'UPDATE usuario SET reset_password_token = ?, reset_password_expiry = ? WHERE id_usuario = ?',
      [resetToken, resetTokenExpiry, usuario.id_usuario]
    );

    // Crear el enlace de recuperación
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${resetToken}`;

    // Configurar el contenido del email
    const mailOptions = {
      from: `"Tu Aplicación" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Recuperación de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Recuperación de contraseña</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hola <strong>${usuario.nombre_usuario}</strong>,</p>
            
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Restablecer contraseña
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Si no puedes hacer clic en el enlace, copia y pega la siguiente URL en tu navegador:
            </p>
            <p style="font-size: 14px; word-break: break-all; color: #007bff;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999;">
                <strong>Importante:</strong>
              </p>
              <ul style="font-size: 12px; color: #999;">
                <li>Este enlace expirará en 1 hora por seguridad</li>
                <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
              </ul>
            </div>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #999;">
            Este es un email automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `
    };

    // Crear y verificar el transportador
    const transporter = createEmailTransporter();
    
    // Verificar la configuración del transportador
    console.log('Verificando configuración de email...');
    await transporter.verify();
    console.log('Configuración de email verificada exitosamente');

    // Enviar el email
    console.log('Enviando email de recuperación...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);

    console.log('Email de recuperación enviado a:', correo);

    res.json({ 
      message: 'Se ha enviado un enlace de recuperación a tu correo electrónico' 
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    
    // Manejo específico de errores de email
    if (error.code === 'EAUTH') {
      console.error('Error de autenticación del email. Verifica EMAIL_USER y EMAIL_PASSWORD');
      return res.status(500).json({ message: 'Error de autenticación del servicio de email' });
    }
    
    if (error.code === 'ECONNECTION') {
      console.error('Error de conexión al servidor de email');
      return res.status(500).json({ message: 'Error de conexión al servicio de email' });
    }
    
    if (error.response && error.response.includes('Invalid login')) {
      console.error('Credenciales de email inválidas');
      return res.status(500).json({ message: 'Configuración de email inválida' });
    }
    
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { nuevaContrasena } = req.body;

  console.log('Intento de reset de contraseña con token:', token.substring(0, 8) + '...');

  try {
    if (!token || !nuevaContrasena) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    if (nuevaContrasena.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar usuario con el token válido
    const [rows] = await pool.query(
      `SELECT * FROM usuario 
       WHERE reset_password_token = ? 
       AND reset_password_expiry > NOW() 
       AND estado_usuario = 'activo'`,
      [token]
    );

    if (rows.length === 0) {
      console.log('Token inválido o expirado:', token.substring(0, 8) + '...');
      return res.status(400).json({ 
        message: 'El enlace de recuperación es inválido o ha expirado' 
      });
    }

    const usuario = rows[0];

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, saltRounds);

    // Actualizar la contraseña y limpiar el token
    await pool.query(
      `UPDATE usuario 
       SET contrasena = ?, 
           reset_password_token = NULL, 
           reset_password_expiry = NULL 
       WHERE id_usuario = ?`,
      [hashedPassword, usuario.id_usuario]
    );

    console.log('Contraseña restablecida exitosamente para usuario:', usuario.correo);

    // Opcional: Enviar email de confirmación
    try {
      const mailOptions = {
        from: `"Tu Aplicación" <${process.env.EMAIL_USER}>`,
        to: usuario.correo,
        subject: 'Contraseña restablecida exitosamente',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745; text-align: center;">Contraseña restablecida</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Hola <strong>${usuario.nombre_usuario}</strong>,</p>
              
              <p>Tu contraseña ha sido restablecida exitosamente.</p>
              
              <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #999;">
                  Si no realizaste este cambio, contacta con nosotros inmediatamente.
                </p>
              </div>
            </div>
          </div>
        `
      };

      const transporter = createEmailTransporter();
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error enviando email de confirmación:', emailError);
      // No fallar la operación principal si el email falla
    }

    res.json({ 
      message: 'Contraseña restablecida exitosamente' 
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
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