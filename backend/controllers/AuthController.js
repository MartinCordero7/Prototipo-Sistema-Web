import { getAuthDb } from '../authDb.js';

export const loginHandler = async (req, res) => {
  const { username, password } = req.body;

  try {
    const authDb = await getAuthDb();
    
    // Consulta a la base de datos local SQLite
    const user = await authDb.get(
      'SELECT * FROM usuarios WHERE username = ? AND password = ?',
      [username, password]
    );

    if (user) {
      // Retornar los datos del usuario sin la contraseña
      const { password: dbPassword, ...userData } = user;
      
      // Si la contraseña es la por defecto, obligamos a cambiarla
      if (dbPassword === 'password123') {
        userData.requirePasswordChange = true;
      } else {
        userData.requirePasswordChange = false;
      }
      
      return res.json({ success: true, data: userData, message: 'Autenticación exitosa.' });
    } else {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }
  } catch (error) {
    console.error('Error al consultar SQLite:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const changePasswordHandler = async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
  }

  try {
    const authDb = await getAuthDb();
    
    // Validar contraseña antigua
    const user = await authDb.get(
      'SELECT * FROM usuarios WHERE username = ? AND password = ?',
      [username, oldPassword]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta.' });
    }

    // MODO DEMO: Si el usuario es "temporal123", simulamos éxito sin modificar la BD
    if (username === 'temporal123') {
      return res.json({ success: true, message: 'Simulación exitosa: Contraseña "cambiada" (Modo Demo).' });
    }

    // Actualizar contraseña para usuarios reales
    await authDb.run(
      'UPDATE usuarios SET password = ? WHERE username = ?',
      [newPassword, username]
    );

    return res.json({ success: true, message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error actualizando contraseña en SQLite:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
