import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
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
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: left; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563;">
            <p style="margin: 0 0 5px 0;">Saludos cordiales,</p>
            <p style="margin: 0 0 2px 0; color: #111827;"><strong>Dirección Tecnica de Monitoreo, Estudios, Informacion y Estadistica</strong></p>
            <p style="margin: 0 0 2px 0;">Calle Estadio N10-285 y Manuela Cañizares</p>
            <p style="margin: 0 0 2px 0;">(593) 399-6500</p>
            <p style="margin: 0 0 2px 0;">Codigo postal: 170803 / Quito - Ecuador</p>
            <p style="margin: 0 0 15px 0;"><a href="https://www.controlhidrocarburos.gob.ec" style="color: #3b82f6; text-decoration: none;">www.controlhidrocarburos.gob.ec</a></p>
            <img src="cid:logoarch" alt="Logo Institucional" style="max-height: 70px;" />
          </div>
        </div>
      </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"ARCH Stock Control" <${process.env.SMTP_USER || 'no-reply@controlhidrocarburos.gob.ec'}>`,
      to: destinatario,
      subject: 'Credenciales de Acceso - Sistema de Stock Diario',
      html: htmlTemplate,
      attachments: [
        {
          filename: 'logo.png',
          path: path.resolve(process.cwd(), '../frontend/Images/Logo ARCH Jun 2026.png'),
          cid: 'logoarch'
        }
      ]
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

export const enviarAlertaIncumplimiento = async (correo, nombreCentro) => {
  const mailOptions = {
    from: `"Control de Hidrocarburos" <${process.env.SMTP_USER}>`,
    to: correo,
    subject: '⚠️ Alerta de Incumplimiento: Ingreso de Stock Diario',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f9f9f9;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #d32f2f; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Alerta de Incumplimiento</h2>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9; color: #333;">
          <p style="font-size: 16px;">Estimado usuario del centro <strong>${nombreCentro}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5;">
            El sistema ha detectado que ha finalizado el horario establecido para el registro de inventario diario y <strong>no hemos recibido su declaración de stock</strong>.
          </p>
          <p style="font-size: 16px; line-height: 1.5;">
            Le recordamos que el ingreso de esta información es obligatorio. Por favor, regularice su situación a la brevedad posible.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
            Este es un correo automático. Si ya realizó su registro, por favor ignore este mensaje.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: left; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563;">
            <p style="margin: 0 0 5px 0;">Saludos cordiales,</p>
            <p style="margin: 0 0 2px 0; color: #111827;"><strong>Dirección Técnica de Monitoreo, Estudios, Información y Estadística</strong></p>
            <p style="margin: 0 0 2px 0;">Calle Estadio N10-285 y Manuela Cañizares</p>
            <p style="margin: 0 0 2px 0;">(593) 399-6500</p>
            <p style="margin: 0 0 2px 0;">Código postal: 170803 / Quito - Ecuador</p>
            <p style="margin: 0 0 15px 0;"><a href="https://www.controlhidrocarburos.gob.ec" style="color: #3b82f6; text-decoration: none;">www.controlhidrocarburos.gob.ec</a></p>
            <img src="cid:logoarch" alt="Logo Institucional" style="max-height: 70px;" />
          </div>
        </div>
      </div>
      </body>
      </html>
    `
  };

  // Agregar los attachments si no estaban
  mailOptions.attachments = [
    {
      filename: 'logo.png',
      path: path.resolve(process.cwd(), '../frontend/Images/Logo ARCH Jun 2026.png'),
      cid: 'logoarch'
    }
  ];

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo de alerta enviado a ${correo}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error al enviar correo de alerta a ${correo}:`, error);
    throw error;
  }
};
