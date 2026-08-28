import { getAuthDb } from '../authDb.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { enviarCredenciales } from '../services/emailService.js';

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

// ==========================================
// GESTIÓN DE DELEGADOS (AUDITORES)
// ==========================================

export const getDelegados = async (req, res) => {
  const { comercializadora } = req.query;
  if (!comercializadora) {
    return res.status(400).json({ success: false, message: 'Se requiere la comercializadora.' });
  }

  try {
    const authDb = await getAuthDb();
    const delegados = await authDb.all(
      `SELECT * FROM delegados_auditoria WHERE comercializadora = ?`,
      [comercializadora]
    );
    
    return res.json({ success: true, data: delegados });
  } catch (error) {
    console.error('Error obteniendo delegados:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const saveDelegado = async (req, res) => {
  const { id, comercializadora, nombre_delegado, correo, oficio, username } = req.body;
  if (!comercializadora || !nombre_delegado || !correo || !oficio || !username) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }

  try {
    const authDb = await getAuthDb();
    const estado = 'ACTIVO'; // Estado por defecto, ya no se gestiona en UI
    
    if (id) {
      // Obtener el username antiguo para saber si lo está cambiando
      let oldUsername = null;
      const oldDelegado = await authDb.get(`SELECT username, correo FROM delegados_auditoria WHERE id = ?`, [id]);
      if (oldDelegado) {
        if (oldDelegado.username) {
          oldUsername = oldDelegado.username;
        } else {
          // fallback para delegados antiguos creados sin username en la tabla
          const u = await authDb.get(`SELECT username FROM usuarios WHERE correo = ? AND es_auditor = 1`, [oldDelegado.correo]);
          if (u) oldUsername = u.username;
        }
      }

      // Validar si el nuevo username ya existe (y no es el mismo que ya tenía)
      if (username !== oldUsername) {
        const existing = await authDb.get(`SELECT id FROM usuarios WHERE username = ?`, [username]);
        if (existing) {
          return res.status(400).json({ success: false, message: 'El usuario ya está en uso. Por favor elija otro.' });
        }
      }

      // Actualizar delegado existente
      await authDb.run(
        `UPDATE delegados_auditoria SET estado = ?, nombre_delegado = ?, correo = ?, oficio = ?, username = ? WHERE id = ?`,
        [estado, nombre_delegado, correo, oficio, username, id]
      );
      
      if (oldUsername) {
        await authDb.run(
          `UPDATE usuarios SET correo = ?, username = ? WHERE username = ? AND es_auditor = 1`,
          [correo, username, oldUsername]
        );
      }
    } else {
      // Validar si el username ya existe
      const existing = await authDb.get(`SELECT id FROM usuarios WHERE username = ?`, [username]);
      if (existing) {
        return res.status(400).json({ success: false, message: 'El usuario ya está en uso. Por favor elija otro.' });
      }

      // Crear nuevo delegado
      await authDb.run(
        `INSERT INTO delegados_auditoria (comercializadora, estado, nombre_delegado, correo, oficio, username) VALUES (?, ?, ?, ?, ?, ?)`,
        [comercializadora, estado, nombre_delegado, correo, oficio, username]
      );

      const tempPass = crypto.randomBytes(4).toString('hex'); // 8 chars
      const hashedPass = bcrypt.hashSync(tempPass, 10);
      
      const userId = 'del_' + Date.now();
      
      await authDb.run(
        `INSERT OR IGNORE INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, cambio_clave_pendiente, correo, es_auditor)
         VALUES (?, ?, ?, 'AUDITORIA', ?, 0, NULL, 1, ?, 1)`,
        [userId, username, hashedPass, comercializadora, correo]
      );
    }

    return res.json({ success: true, message: 'Delegado guardado correctamente.' });
  } catch (error) {
    console.error('Error guardando delegado:', error);
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
    }
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const deleteDelegado = async (req, res) => {
  const { id } = req.params;
  
  try {
    const authDb = await getAuthDb();
    // Obtener correo para borrar usuario
    const del = await authDb.get(`SELECT correo, username FROM delegados_auditoria WHERE id = ?`, [id]);
    if (del) {
      const usernameToDelete = del.username || del.correo;
      await authDb.run(`DELETE FROM usuarios WHERE username = ? OR (correo = ? AND es_auditor = 1)`, [usernameToDelete, del.correo]);
    }
    await authDb.run(`DELETE FROM delegados_auditoria WHERE id = ?`, [id]);

    return res.json({ success: true, message: 'Delegado eliminado correctamente.' });
  } catch (error) {
    console.error('Error eliminando delegado:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const sendDelegadoEmail = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'ID requerido.' });

  try {
    const authDb = await getAuthDb();
    const delegado = await authDb.get(`SELECT * FROM delegados_auditoria WHERE id = ?`, [id]);
    
    if (!delegado) {
      return res.status(404).json({ success: false, message: 'Delegado no encontrado.' });
    }

    // Buscar el usuario asociado
    const user = await authDb.get(`SELECT username FROM usuarios WHERE correo = ? AND es_auditor = 1`, [delegado.correo]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario asociado no encontrado.' });
    }

    // Generar nueva contraseña temporal
    const tempPass = crypto.randomBytes(4).toString('hex');
    const hashedPass = bcrypt.hashSync(tempPass, 10);

    // Actualizar usuario asociado
    await authDb.run(
      `UPDATE usuarios SET password = ?, cambio_clave_pendiente = 1, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE username = ?`,
      [hashedPass, user.username]
    );

    // Enviar correo
    await enviarCredenciales(delegado.correo, user.username, tempPass, delegado.nombre_delegado + ` (Oficio: ${delegado.oficio})`);

    return res.json({ success: true, message: 'Correo enviado correctamente al delegado.' });
  } catch (error) {
    console.error('Error enviando correo:', error);
    return res.status(500).json({ success: false, message: 'Error interno enviando correo.' });
  }
};
