import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del transporter usando las variables de entorno
// (Si no existen, se manejará de forma segura sin romper la aplicación)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.controlhidrocarburos.gob.ec', // Host de Carbonio
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'secret'
  },
  tls: {
    rejectUnauthorized: false // Para entornos de desarrollo o certificados internos
  }
});

/**
 * Envía un correo con las credenciales temporales a la estación
 * @param {string} destinatario - Correo del usuario
 * @param {string} username - Nombre de usuario generado
 * @param {string} password - Contraseña temporal
 * @param {string} nombreCentro - Nombre del centro para personalizar el mensaje
 */
export const enviarCredenciales = async (destinatario, username, password, nombreCentro) => {
  try {
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1f315c; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Sistema de Ingreso de Stock Diario</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #111827; font-size: 20px;">¡Bienvenido/a, ${nombreCentro}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">Su cuenta en la plataforma de control de stock de la Agencia de Regulación y Control de Hidrocarburos ha sido creada exitosamente.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #4b5563;">Sus credenciales temporales de acceso son:</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Usuario:</strong> <span style="color: #3b82f6;">${username}</span></p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Contraseña:</strong> <span style="color: #3b82f6;">${password}</span></p>
          </div>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 20px;">
            <p style="color: #991b1b; margin: 0; font-weight: bold;">⚠️ Acción Requerida</p>
            <p style="color: #991b1b; margin: 5px 0 0 0; font-size: 14px;">Por motivos de seguridad, el sistema le solicitará cambiar esta contraseña obligatoriamente durante su primer inicio de sesión.</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">Este es un mensaje automático, por favor no responda a este correo.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"ARCH Stock Control" <${process.env.SMTP_USER || 'no-reply@controlhidrocarburos.gob.ec'}>`,
      to: destinatario,
      subject: 'Credenciales de Acceso - Sistema de Stock Diario',
      html: htmlTemplate
    };

    // Si estamos en un entorno sin credenciales reales configuradas,
    // solo simulamos el envío para no romper el flujo
    if (!process.env.SMTP_PASS) {
      console.log('----------------------------------------------------');
      console.log('AVISO: Credenciales SMTP no configuradas (.env).');
      console.log(`Simulando envío de correo a: ${destinatario}`);
      console.log(`Usuario: ${username} | Contraseña: ${password}`);
      console.log('----------------------------------------------------');
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo enviado exitosamente a ${destinatario}: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('Error al enviar correo de credenciales:', error);
    // Retornamos falso en vez de lanzar error para no bloquear el registro del usuario
    return false;
  }
};
