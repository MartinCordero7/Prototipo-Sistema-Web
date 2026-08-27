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

        // Obtener correos de los auditores por comercializadora
        const auditores = await db.all(`
          SELECT comercializadora, correo FROM usuarios 
          WHERE nombre_estacion = 'AUDITORIA'
        `);
        const correosAuditores = {};
        for (const aud of auditores) {
          correosAuditores[aud.comercializadora] = aud.correo;
        }

        // 2. Obtener los centros que SÍ declararon hoy
        const declararonHoy = await db.all(`
          SELECT DISTINCT nombre_centro 
          FROM stock_diario 
          WHERE fecha_stock LIKE ?
        `, [`${todayDate}%`]);
        
        const centrosConDeclaracion = declararonHoy.map(r => r.nombre_centro);

        // 3. Identificar infractores y agrupar por Comercializadora
        const infractoresPorComercializadora = {};

        for (const estacion of estaciones) {
          if (!centrosConDeclaracion.includes(estacion.nombre_estacion)) {
            if (!infractoresPorComercializadora[estacion.comercializadora]) {
              infractoresPorComercializadora[estacion.comercializadora] = [];
            }
            infractoresPorComercializadora[estacion.comercializadora].push(estacion);
          }
        }

        // 4. Enviar un correo por cada Comercializadora con archivo adjunto
        let enviados = 0;
        let fallidos = 0;

        for (const [org, infractores] of Object.entries(infractoresPorComercializadora)) {
          const correoDestino = correosAuditores[org];
          
          if (!correoDestino) {
            console.log(`[CRON] No hay correo configurado para el auditor de ${org}. Omitiendo alerta.`);
            continue;
          }

          try {
            console.log(`[CRON] Enviando alerta consolidada a la comercializadora ${org} (${correoDestino}) con ${infractores.length} centros...`);
            
            // Generar contenido del CSV en memoria
            const csvHeaders = "Comercializadora,Centro de Distribucion,Codigo Unico,Fecha de Incumplimiento\n";
            const csvRows = infractores.map(est => {
              // Parsear el ID que usamos como código único, o extraerlo del nombre
              return `"${est.comercializadora}","${est.nombre_estacion}","${est.id}","${todayDate}"`;
            }).join("\n");
            
            const csvContent = "\uFEFF" + csvHeaders + csvRows; // \uFEFF para BOM UTF-8

            // Enviar correo
            await enviarAlertaIncumplimiento(correoDestino, org, todayDate, csvContent);
            
            // Registrar historial por cada estación reportada
            for (const est of infractores) {
              await db.run(`
                INSERT INTO alertas_diarias (correo_destinatario, nombre_centro, estado) 
                VALUES (?, ?, 'Enviado')
              `, [correoDestino, est.nombre_estacion]);
            }
            enviados++;
          } catch (error) {
            console.error(`[CRON] Fallo enviando correo a ${org}:`, error.message);
            for (const est of infractores) {
              await db.run(`
                INSERT INTO alertas_diarias (correo_destinatario, nombre_centro, estado) 
                VALUES (?, ?, 'Fallido')
              `, [correoDestino, est.nombre_estacion]);
            }
            fallidos++;
          }
        }
        
        console.log(`[CRON] Proceso finalizado. Correos de Comercializadoras Enviados: ${enviados}, Fallidos: ${fallidos}`);
      }
    } catch (error) {
      console.error('[CRON] Error general en el servicio de tareas automáticas:', error);
    }
  });

  console.log('Servicio Cron de alertas inicializado (Ejecución al minuto 5 de cada hora).');
};
