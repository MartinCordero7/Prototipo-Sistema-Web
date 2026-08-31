import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  // Ahora el token vendrá en las cookies, no en la cabecera Authorization
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acceso no autorizado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { id, username, role, ... }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. No tienes permisos para esta acción.' });
    }
    next();
  };
};
