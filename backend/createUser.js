import pool from '../backend/config/db.js';
import bcrypt from 'bcrypt';

async function crearUsuario() {
  const nombre = 'Juan';
  const apellido = 'Perez';
  const correo = 'juan.perez@example.com';
  const passwordPlain = 'tu_password_segura';
  const rol = 'admin'; // o 'cliente'
  const estado = 'A'; // ejemplo
  const rut = '12345678-9';
  const direccion = 'Calle Falsa 123';
  const ciudad = 'Ciudad';
  const region_id = 1;  // Debe existir en tu tabla region
  const comuna_id = 2;  // Debe existir en tu tabla comuna

  try {
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    const [result] = await pool.query(
      `INSERT INTO usuario 
       (nombre, apellido, correo, contrasena, rol, estado, rut, direccion, ciudad, region_id, comuna_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, correo, passwordHash, rol, estado, rut, direccion, ciudad, region_id, comuna_id]
    );

    console.log('Usuario creado con ID:', result.insertId);
  } catch (error) {
    console.error('Error creando usuario:', error);
  }
}

crearUsuario();
