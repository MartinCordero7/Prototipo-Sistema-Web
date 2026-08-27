import { getAuthDb } from '../authDb.js';
import { enviarCredenciales } from '../services/emailService.js';

export const loginHandler = async (req, res) => {
  const { username, password } = req.body;

  try {
    const authDb = await getAuthDb();
    
    // 1. Buscar al usuario primero para saber si es administrador
    const user = await authDb.get(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

    // 2. Obtener la hora de cierre configurada y validar horario (EXCEPTO ADMINISTRADOR)
    if (user.comercializadora !== 'ADMINISTRADOR') {
      const configRow = await authDb.get("SELECT valor FROM configuracion WHERE llave = 'hora_cierre'");
      const horaCierre = configRow ? parseInt(configRow.valor, 10) : 12;
      
      const currentHour = new Date().getHours();
      if (currentHour >= horaCierre) {
        return res.status(403).json({ 
          success: false, 
          message: `Se ha excedido el tiempo permitido para el ingreso de stock (Límite: ${horaCierre}:00). Intente mañana.` 
        });
      }
    }

    // 3. Verificar si la cuenta está bloqueada por fuerza bruta
    if (user.bloqueado_hasta) {
      const lockDate = new Date(user.bloqueado_hasta);
      if (new Date() < lockDate) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cuenta bloqueada por múltiples intentos fallidos. Intente nuevamente en 12 horas.' 
        });
      }
    }

    // 4. Validar la contraseña
    if (user.password !== password) {
      const intentosActuales = (user.intentos_fallidos || 0) + 1;
      
      if (intentosActuales >= 3) {
        // Bloquear por 12 horas
        const lockUntil = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
        await authDb.run(
          'UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE username = ?',
          [intentosActuales, lockUntil, username]
        );
        return res.status(403).json({ 
          success: false, 
          message: 'Cuenta bloqueada por múltiples intentos fallidos. Intente nuevamente en 12 horas.' 
        });
      } else {
        // Registrar el intento fallido
        await authDb.run(
          'UPDATE usuarios SET intentos_fallidos = ? WHERE username = ?',
          [intentosActuales, username]
        );
        return res.status(401).json({ 
          success: false, 
          message: `Contraseña incorrecta. Intento ${intentosActuales}/3` 
        });
      }
    }

    // Si el login fue exitoso, limpiar intentos y bloqueos anteriores
    if (user.intentos_fallidos > 0 || user.bloqueado_hasta !== null) {
      await authDb.run(
        'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE username = ?',
        [username]
      );
    }

    // Retornar los datos del usuario sin la contraseña ni la data sensible de bloqueo
    const { password: dbPassword, intentos_fallidos, bloqueado_hasta, ...userData } = user;
    
    // Verificamos si tiene el cambio de clave pendiente
    userData.requirePasswordChange = (user.cambio_clave_pendiente === 1);
    
    return res.json({ success: true, data: userData, message: 'Autenticación exitosa.' });
    
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

    // MODO DEMO: Si el usuario es "test_user", simulamos éxito sin modificar la BD
    if (username === 'test_user') {
      return res.json({ success: true, message: 'Simulación exitosa: Contraseña "cambiada" (Modo Demo).' });
    }

    // Actualizar contraseña y quitar la bandera de pendiente para usuarios reales
    await authDb.run(
      'UPDATE usuarios SET password = ?, cambio_clave_pendiente = 0 WHERE username = ?',
      [newPassword, username]
    );

    return res.json({ success: true, message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error actualizando contraseña en SQLite:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const registerHandler = async (req, res) => {
  const { nombreCentro, codigoArch, codigoUnico, correo, comercializadora } = req.body;

  if (!nombreCentro || !codigoArch || !codigoUnico || !correo || !comercializadora) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }

  try {
    const authDb = await getAuthDb();
    const cleanName = nombreCentro.replace(/[^a-zA-Z]/g, '').toLowerCase().substring(0, 6);
    const generatedUsername = `${cleanName}${codigoUnico.substring(codigoUnico.length - 4)}`;

    // Check if user already exists
    const existingUser = await authDb.get('SELECT * FROM usuarios WHERE username = ?', [generatedUsername]);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Este centro de distribución ya tiene un usuario registrado.' });
    }

    // Generate temporal password
    const tempPassword = Math.random().toString(36).slice(-8);

    const newId = `ES_${codigoArch}_${Date.now()}`;
    const concatName = `${nombreCentro}/${codigoArch}/${codigoUnico}`;
    await authDb.run(`
      INSERT INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, correo, cambio_clave_pendiente)
      VALUES (?, ?, ?, ?, ?, 0, NULL, ?, 1)
    `, [newId, generatedUsername, tempPassword, concatName, comercializadora, correo]);

    // Enviar correo con las credenciales usando Carbonio (SMTP)
    await enviarCredenciales(correo, generatedUsername, tempPassword, nombreCentro);

    // Funcionalidad didáctica: Si es comercializadora Test, eliminar después de 5 minutos
    if (comercializadora.toUpperCase() === 'TEST') {
      setTimeout(async () => {
        try {
          const db = await getAuthDb();
          await db.run('DELETE FROM usuarios WHERE username = ?', [generatedUsername]);
          console.log(`[Auto-Limpieza] Usuario de prueba '${generatedUsername}' eliminado tras 5 minutos.`);
        } catch (err) {
          console.error('Error en auto-limpieza de usuario de prueba:', err);
        }
      }, 5 * 60 * 1000); // 5 minutos
    }

    return res.status(201).json({ success: true, message: `Registro exitoso. Se enviaron las credenciales al correo: ${correo}`, username: generatedUsername });

  } catch (error) {
    console.error('Error al registrar usuario en SQLite:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al registrar.' });
  }
};

export const updateProfileHandler = async (req, res) => {
  const { username, currentPassword, newEmail, newPassword } = req.body;

  if (!username || !currentPassword || (!newEmail && !newPassword)) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
  }

  try {
    const authDb = await getAuthDb();
    
    // Validar contraseña actual
    const user = await authDb.get(
      'SELECT * FROM usuarios WHERE username = ? AND password = ?',
      [username, currentPassword]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta.' });
    }

    if (username === 'test_user') {
      return res.json({ success: true, message: 'Simulación exitosa: Datos "actualizados" (Modo Demo).', updatedData: { correo: newEmail || user.correo } });
    }

    let updateQuery = '';
    let params = [];

    if (newEmail && newPassword) {
      updateQuery = 'UPDATE usuarios SET correo = ?, password = ? WHERE username = ?';
      params = [newEmail, newPassword, username];
    } else if (newEmail) {
      updateQuery = 'UPDATE usuarios SET correo = ? WHERE username = ?';
      params = [newEmail, username];
    } else if (newPassword) {
      updateQuery = 'UPDATE usuarios SET password = ? WHERE username = ?';
      params = [newPassword, username];
    }

    await authDb.run(updateQuery, params);

    // Retornamos el nuevo correo para actualizar el estado del frontend si es necesario
    return res.json({ 
      success: true, 
      message: 'Datos actualizados exitosamente.',
      updatedData: {
        correo: newEmail || user.correo
      }
    });

  } catch (error) {
    console.error('Error actualizando perfil en SQLite:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const getConfiguracionHandler = async (req, res) => {
  try {
    const authDb = await getAuthDb();
    const configRow = await authDb.get("SELECT valor FROM configuracion WHERE llave = 'hora_cierre'");
    const horaCierre = configRow ? parseInt(configRow.valor, 10) : 12;
    res.json({ success: true, horaCierre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
