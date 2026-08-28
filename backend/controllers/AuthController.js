import { getAuthDb } from '../authDb.js';
import { enviarCredenciales, enviarCodigoRecuperacion } from '../services/emailService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper function para validar contraseña segura
const isStrongPassword = (pwd) => {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/;
  return regex.test(pwd);
};

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
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
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
    
    // Determinar el rol
    let role = 'ESTACION';
    if (username === 'admin_arch' || username === 'test_user') {
      role = 'ADMIN';
    } else if (user.es_auditor === 1) {
      role = 'AUDITOR';
    }
    userData.role = role;

    // Firmar JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_2026',
      { expiresIn: '8h' }
    );
    
    return res.json({ success: true, data: userData, token, message: 'Autenticación exitosa.' });
    
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
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta.' });
    }

    // Exigir contraseña segura
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'La nueva contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un signo especial.' 
      });
    }

    // MODO DEMO: Si el usuario es "test_user", simulamos éxito sin modificar la BD
    if (username === 'test_user') {
      return res.json({ success: true, message: 'Simulación exitosa: Contraseña "cambiada" (Modo Demo).' });
    }

    // Actualizar contraseña y quitar la bandera de pendiente para usuarios reales
    const newHash = await bcrypt.hash(newPassword, 10);
    await authDb.run(
      'UPDATE usuarios SET password = ?, cambio_clave_pendiente = 0 WHERE username = ?',
      [newHash, username]
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
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!"; // Asegurar que cumple reglas base temporalmente
    const tempHash = await bcrypt.hash(tempPassword, 10);

    const newId = `ES_${codigoArch}_${Date.now()}`;
    const concatName = `${nombreCentro}/${codigoArch}/${codigoUnico}`;
    await authDb.run(`
      INSERT INTO usuarios (id, username, password, nombre_estacion, comercializadora, intentos_fallidos, bloqueado_hasta, correo, cambio_clave_pendiente)
      VALUES (?, ?, ?, ?, ?, 0, NULL, ?, 1)
    `, [newId, generatedUsername, tempHash, concatName, comercializadora, correo]);

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
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta.' });
    }

    if (username === 'test_user') {
      return res.json({ success: true, message: 'Simulación exitosa: Datos "actualizados" (Modo Demo).', updatedData: { correo: newEmail || user.correo } });
    }

    let updateQuery = '';
    let params = [];

    if (newPassword) {
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({ 
          success: false, 
          message: 'La nueva contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un signo especial.' 
        });
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      
      if (newEmail) {
        updateQuery = 'UPDATE usuarios SET correo = ?, password = ? WHERE username = ?';
        params = [newEmail, newHash, username];
      } else {
        updateQuery = 'UPDATE usuarios SET password = ? WHERE username = ?';
        params = [newHash, username];
      }
    } else if (newEmail) {
      updateQuery = 'UPDATE usuarios SET correo = ? WHERE username = ?';
      params = [newEmail, username];
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

export const forgotPasswordHandler = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });

  try {
    const authDb = await getAuthDb();
    const user = await authDb.get('SELECT * FROM usuarios WHERE username = ?', [username]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'El usuario ingresado no existe.' });
    }
    
    if (!user.correo) {
      return res.status(400).json({ success: false, message: 'Este usuario no tiene un correo configurado para recuperar la contraseña. Contacte al administrador.' });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await authDb.run(
      'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE username = ?',
      [codigo, expires, username]
    );

    await enviarCodigoRecuperacion(user.correo, codigo, username);

    return res.json({ success: true, message: `Código de recuperación enviado correctamente al correo registrado del usuario ${username}.` });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

export const resetPasswordHandler = async (req, res) => {
  const { username, token, newPassword } = req.body;
  if (!username || !token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
  }

  // Regex sacada de isStrongPassword
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/;
  if (!regex.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo especial.' });
  }

  try {
    const authDb = await getAuthDb();
    const user = await authDb.get('SELECT * FROM usuarios WHERE username = ? AND reset_token = ?', [username, token]);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Código de recuperación inválido o usuario incorrecto.' });
    }

    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ success: false, message: 'El código de recuperación ha expirado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await authDb.run(
      'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE username = ?',
      [hashedPassword, username]
    );

    return res.json({ success: true, message: 'Contraseña restablecida exitosamente.' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
