import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

// Verifica que el token JWT es válido
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user; // payload del JWT (usualmente contiene id, rol, etc)
    next();
  });
};

// Verifica que el usuario tenga rol "admin"
export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: Solo administradores' });
};

// Verifica que el usuario tenga rol "cliente"
export const isClient = (req, res, next) => {
  if (req.user && req.user.rol === 'cliente') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: Solo clientes' });
};
