import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.controlhidrocarburos.gob.ec',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmail() {
  console.log('Iniciando prueba de conexión SMTP (puerto 587)...');
  try {
    console.log('Verificando conexión...');
    await transporter.verify();
    console.log('Conexión SMTP exitosa. El servidor está listo para recibir mensajes.');
  } catch (error) {
    console.error('Error de conexión SMTP:', error);
  }
}

testEmail();
