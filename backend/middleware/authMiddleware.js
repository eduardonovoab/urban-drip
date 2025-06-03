// authMiddleware.js
import jwt from 'jsonwebtoken';

// Middleware para autenticar el token
export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // "Bearer token"
  console.log("Token recibido:", token);

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });  // Si no hay token, error 401
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });  // Si el token no es válido, error 403
    }
    console.log("Usuario decodificado:", decoded);
    req.user = decoded; // Decodificamos el token y asignamos los datos del usuario a `req.user`
    next(); // Continuamos con el siguiente middleware
  });
};

// Middleware para verificar si el usuario tiene rol de administrador
export const verifyAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {  // Verificamos que el rol sea 'admin'
    return res.status(403).json({ message: 'Acceso denegado. No eres un administrador' });
  }
  next(); // Si es administrador, continuamos con la siguiente función
};

// Middleware para verificar si el usuario tiene rol de cliente
export const isClient = (req, res, next) => {
  if (req.user?.rol !== 'cliente') {
    return res.status(403).json({ error: 'Acceso denegado, solo para clientes' });
  }
  next(); // Si es cliente, pasamos al siguiente middleware
};
