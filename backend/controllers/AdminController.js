import { getAuthDb } from '../authDb.js';

export const getBlockedUsers = async (req, res) => {
  try {
    const authDb = await getAuthDb();
    const blockedUsers = await authDb.all(
      'SELECT id, username, nombre_estacion, comercializadora, bloqueado_hasta FROM usuarios WHERE bloqueado_hasta IS NOT NULL'
    );
    return res.json({ success: true, data: blockedUsers });
  } catch (error) {
    console.error('Error obteniendo usuarios bloqueados:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const unblockUser = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Falta el nombre de usuario.' });
  }

  try {
    const authDb = await getAuthDb();
    
    // Verificar si el usuario existe y está bloqueado
    const user = await authDb.get('SELECT * FROM usuarios WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    if (!user.bloqueado_hasta) {
      return res.status(400).json({ success: false, message: 'El usuario no está bloqueado.' });
    }

    // Desbloquear al usuario
    await authDb.run(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE username = ?',
      [username]
    );

    return res.json({ success: true, message: `Usuario ${username} desbloqueado exitosamente.` });
  } catch (error) {
    console.error('Error desbloqueando usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const getConfigHandler = async (req, res) => {
  try {
    const authDb = await getAuthDb();
    const configRow = await authDb.get("SELECT valor FROM configuracion WHERE llave = 'hora_cierre'");
    
    if (configRow) {
      return res.json({ success: true, horaCierre: parseInt(configRow.valor, 10) });
    } else {
      return res.json({ success: true, horaCierre: 12 });
    }
  } catch (error) {
    console.error('Error obteniendo configuracion:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const updateConfigHandler = async (req, res) => {
  const { horaCierre } = req.body;

  if (horaCierre === undefined || horaCierre < 0 || horaCierre > 23) {
    return res.status(400).json({ success: false, message: 'Hora de cierre inválida (debe estar entre 0 y 23).' });
  }

  try {
    const authDb = await getAuthDb();
    await authDb.run(
      "INSERT OR REPLACE INTO configuracion (llave, valor) VALUES ('hora_cierre', ?)",
      [horaCierre.toString()]
    );

    return res.json({ success: true, message: 'Horario de cierre actualizado exitosamente.' });
  } catch (error) {
    console.error('Error actualizando configuracion:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const getAlertasHistory = async (req, res) => {
  try {
    const authDb = await getAuthDb();
    const alertas = await authDb.all(
      'SELECT id, fecha_emision, correo_destinatario, nombre_centro, estado FROM alertas_diarias ORDER BY fecha_emision DESC'
    );
    return res.json({ success: true, data: alertas });
  } catch (error) {
    console.error('Error obteniendo historial de alertas:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
