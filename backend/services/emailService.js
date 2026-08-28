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
          <p style="color: #4b5563; line-height: 1.6;">Su cuenta en la plataforma de control de stock de la Agencia de Regulaci&oacute;n y Control de Hidrocarburos ha sido creada exitosamente.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #4b5563;">Sus credenciales temporales de acceso son:</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Usuario:</strong> <span style="color: #3b82f6;">${username}</span></p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Contrase&ntilde;a:</strong> <span style="color: #3b82f6;">${password}</span></p>
          </div>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 20px;">
            <p style="color: #991b1b; margin: 0; font-weight: bold;">&#9888; Acci&oacute;n Requerida</p>
            <p style="color: #991b1b; margin: 5px 0 0 0; font-size: 14px;">Por motivos de seguridad, el sistema le solicitar&aacute; cambiar esta contrase&ntilde;a obligatoriamente durante su primer inicio de sesi&oacute;n.</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">Este es un mensaje autom&aacute;tico, por favor no responda a este correo.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: left; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563;">
            <p style="margin: 0 0 5px 0;">Saludos cordiales,</p>
            <p style="margin: 0 0 2px 0; color: #111827;"><strong>Direcci&oacute;n T&eacute;cnica de Monitoreo, Estudios, Informaci&oacute;n y Estad&iacute;stica</strong></p>
            <p style="margin: 0 0 2px 0;">Calle Estadio N10-285 y Manuela Ca&ntilde;izares</p>
            <p style="margin: 0 0 2px 0;">(593) 399-6500</p>
            <p style="margin: 0 0 2px 0;">C&oacute;digo postal: 170803 / Quito - Ecuador</p>
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

export const enviarAlertaIncumplimiento = async (correo, nombreComercializadora, fecha, csvContent) => {
  // Formatear la fecha para que se lea mejor en el correo (Ej: "19 de Agosto de 2026")
  const dateObj = new Date(fecha + 'T00:00:00');
  const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
  const fechaFormateada = dateObj.toLocaleDateString('es-ES', opcionesFecha);

  const mailOptions = {
    from: `"Control de Hidrocarburos" <${process.env.SMTP_USER || 'no-reply@controlhidrocarburos.gob.ec'}>`,
    to: correo,
    subject: 'Seguimiento y monitoreo del ingreso de informacion de los niveles de stock de las Estaciones de Servicio',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f9f9f9;">
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          
          <!-- Banner Superior -->
          <div style="background-color: #1f315c; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 500;">Agencia de Regulaci&oacute;n y Control de Hidrocarburos</h2>
          </div>

          <!-- Contenido del Mensaje -->
          <div style="padding: 30px; background-color: #ffffff; color: #111827; text-align: justify; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Estimada <strong>${nombreComercializadora}</strong>, saludos</p>
            
            <p style="font-size: 15px;">
              La Agencia de Regulaci&oacute;n y Control de Hidrocarburos, en el &aacute;mbito de sus competencias de regulaci&oacute;n y control del abastecimiento de combustibles a nivel nacional, se encuentra realizando el seguimiento y monitoreo de los niveles de stock, para lo cual mediante Oficio Nro. ARCH-DE-2026-0238-OF de 04 de junio de 2026 de la Direcci&oacute;n Ejecutiva dispone:
            </p>

            <blockquote style="margin: 20px 0; padding: 15px 20px; background-color: #f3f4f6; border-left: 4px solid #1f315c; font-style: italic; color: #374151;">
              "El registro deber&aacute; efectuarse una (1) vez al d&iacute;a, a las 12h00, en el link habilitado por la ARCH a cada comercializadora, reportando las existencias actualizadas a esa hora. La carga de la informaci&oacute;n deber&aacute; completarse hasta las 13h00 del mismo d&iacute;a."
            </blockquote>

            <p style="font-size: 15px; background-color: #fef2f2; padding: 12px; border-radius: 6px; border: 1px solid #fecaca; color: #991b1b;">
              Con estos antecedentes se pone en conocimiento que los Centros de Distribuci&oacute;n que se encuentran en el documento adjunto no registran ingreso de informaci&oacute;n en la fecha <strong>${fechaFormateada}</strong>.
            </p>

            <p style="font-size: 15px;">
              Finalmente se recuerda la responsabilidad directa de cada comercializadora respecto del ingreso y veracidad de la informaci&oacute;n correspondiente a su representada y a la totalidad de su red de distribuci&oacute;n, y atribuyen al Director Ejecutivo de la ARCH la potestad de sancionar el incumplimiento de las disposiciones del Instructivo, conforme a la Ley de Hidrocarburos y dem&aacute;s normativa aplicable.
            </p>
            
            <!-- Pie de firma -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: left; font-size: 13px; color: #4b5563;">
              <p style="margin: 0 0 5px 0;">Saludos cordiales,</p>
              <p style="margin: 0 0 2px 0; color: #111827;"><strong>Direcci&oacute;n T&eacute;cnica de Monitoreo, Estudios, Informaci&oacute;n y Estad&iacute;stica</strong></p>
              <p style="margin: 0 0 2px 0;">Calle Estadio N10-285 y Manuela Ca&ntilde;izares</p>
              <p style="margin: 0 0 2px 0;">(593) 399-6500</p>
              <p style="margin: 0 0 2px 0;">C&oacute;digo postal: 170803 / Quito - Ecuador</p>
              <p style="margin: 0 0 15px 0;"><a href="https://www.controlhidrocarburos.gob.ec" style="color: #3b82f6; text-decoration: none;">www.controlhidrocarburos.gob.ec</a></p>
              <img src="cid:logoarch" alt="Logo Institucional" style="max-height: 70px;" />
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: 'logo.png',
        path: path.resolve(process.cwd(), '../frontend/Images/Logo ARCH Jun 2026.png'),
        cid: 'logoarch'
      },
      {
        filename: `Incumplimientos_${nombreComercializadora}_${fecha}.csv`,
        content: csvContent
      }
    ]
  };

  // Si estamos en desarrollo sin SMTP_PASS
  if (!process.env.SMTP_PASS) {
    console.log('----------------------------------------------------');
    console.log(`AVISO: Simulando envío de alerta a: ${correo}`);
    console.log(`Comercializadora: ${nombreComercializadora} | Archivo Adjunto Generado: Sí`);
    console.log('----------------------------------------------------');
    return true;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo de alerta enviado a ${correo}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error al enviar correo de alerta a ${correo}:`, error);
    throw error;
  }
};

export const enviarCodigoRecuperacion = async (destinatario, codigo, username) => {
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
            <h1 style="color: white; margin: 0; font-size: 24px;">Recuperaci&oacute;n de Contrase&ntilde;a</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #111827; font-size: 20px;">Hola, ${username}</h2>
            <p style="color: #4b5563; line-height: 1.6;">Hemos recibido una solicitud para restablecer la contrase&ntilde;a de tu cuenta en la plataforma de control de stock de la ARCH.</p>
            
            <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">Tu c&oacute;digo de recuperaci&oacute;n es:</p>
              <h1 style="margin: 5px 0; font-size: 32px; letter-spacing: 5px; color: #1f315c;">${codigo}</h1>
            </div>

            <p style="color: #4b5563; line-height: 1.6;">Este c&oacute;digo es v&aacute;lido por <strong>15 minutos</strong>. Ingr&eacute;salo en la aplicaci&oacute;n junto con tu nueva contrase&ntilde;a para recuperar el acceso.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: left; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563;">
              <p style="margin: 0 0 5px 0;">Saludos cordiales,</p>
              <p style="margin: 0 0 2px 0; color: #111827;"><strong>Agencia de Regulaci&oacute;n y Control de Hidrocarburos</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"ARCH Soporte" <${process.env.SMTP_USER || 'no-reply@controlhidrocarburos.gob.ec'}>`,
      to: destinatario,
      subject: 'Código de Recuperación de Contraseña',
      html: htmlTemplate
    };

    if (!process.env.SMTP_PASS) {
      console.log('----------------------------------------------------');
      console.log(`AVISO: Simulando correo de recuperacion a: ${destinatario}`);
      console.log(`Codigo: ${codigo}`);
      console.log('----------------------------------------------------');
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo de recuperacion enviado a ${destinatario}: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('Error al enviar correo de recuperacion:', error);
    return false;
  }
};
