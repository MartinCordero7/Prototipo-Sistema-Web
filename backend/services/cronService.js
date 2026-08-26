import cron from 'node-cron';
import { getAuthDb } from '../authDb.js';
import { enviarAlertaIncumplimiento } from './emailService.js';

export const startCronJobs = () => {
  // Ejecutar al minuto 5 de cada hora (ej. 12:05, 13:05)
  cron.schedule('5 * * * *', async () => {
    try {
      const db = await getAuthDb();
      
      // Obtener hora de cierre configurada
      const configRow = await db.get("SELECT valor FROM configuracion WHERE llave = 'hora_cierre'");
      const horaCierre = configRow ? parseInt(configRow.valor, 10) : 12;
      
      const currentHour = new Date().getHours();
      
      // Si la hora actual coincide con la hora de cierre, ejecutamos el envío
      if (currentHour === horaCierre) {
        console.log(`[CRON] Iniciando proceso automático de alertas de incumplimiento a las ${horaCierre}:05...`);
        
        // Obtener la fecha de hoy en formato YYYY-MM-DD (hora local)
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const todayDate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

        // 1. Obtener todas las estaciones obligadas (ignorar Admin y Auditoría)
        const estaciones = await db.all(`
          SELECT * FROM usuarios 
          WHERE comercializadora NOT IN ('ADMINISTRADOR') 
            AND nombre_estacion NOT LIKE '%AUDITORIA%'
        `);

        // 2. Obtener los centros que SÍ declararon hoy
        // Agrupamos por correo_usuario o nombre_centro
        const declararonHoy = await db.all(`
          SELECT DISTINCT nombre_centro 
          FROM stock_diario 
          WHERE fecha_stock LIKE ?
        `, [`${todayDate}%`]);
        
        const centrosConDeclaracion = declararonHoy.map(r => r.nombre_centro);

        let enviados = 0;
        let fallidos = 0;

        for (const estacion of estaciones) {
          if (!centrosConDeclaracion.includes(estacion.nombre_estacion)) {
            // Esta estación NO declaró hoy
            if (estacion.correo) {
              try {
                console.log(`[CRON] Enviando alerta a ${estacion.nombre_estacion} (${estacion.correo})...`);
                
                // Enviar correo (usando una función que crearemos en emailService.js)
                await enviarAlertaIncumplimiento(estacion.correo, estacion.nombre_estacion);
                
                // Registrar en el historial de base de datos
                await db.run(`
                  INSERT INTO alertas_diarias (correo_destinatario, nombre_centro, estado) 
                  VALUES (?, ?, 'Enviado')
                `, [estacion.correo, estacion.nombre_estacion]);
                enviados++;
              } catch (error) {
                console.error(`[CRON] Fallo enviando correo a ${estacion.correo}:`, error.message);
                await db.run(`
                  INSERT INTO alertas_diarias (correo_destinatario, nombre_centro, estado) 
                  VALUES (?, ?, 'Fallido')
                `, [estacion.correo, estacion.nombre_estacion]);
                fallidos++;
              }
            }
          }
        }
        
        console.log(`[CRON] Proceso finalizado. Enviados: ${enviados}, Fallidos: ${fallidos}`);
      }
    } catch (error) {
      console.error('[CRON] Error general en el servicio de tareas automáticas:', error);
    }
  });

  console.log('Servicio Cron de alertas inicializado (Ejecución al minuto 5 de cada hora).');
};
