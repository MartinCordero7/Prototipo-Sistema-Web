import { getCentrosDistribucionOracle } from '../models/DataModel.js';
import { getAuthDb } from '../authDb.js';

export const getEstadoDiario = async (req, res) => {
  const { comercializadora, fechaDesde, fechaHasta } = req.query;

  if (!comercializadora) {
    return res.status(400).json({ success: false, message: 'Se requiere la comercializadora.' });
  }

  try {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    
    const targetDesde = fechaDesde || today;
    const targetHasta = fechaHasta || today;

    // Obtener array de fechas
    const getDatesInRange = (startStr, endStr) => {
      const dates = [];
      let currentDate = new Date(startStr + 'T00:00:00');
      const end = new Date(endStr + 'T00:00:00');
      
      // Límite de seguridad: máximo 31 días
      let days = 0;
      while (currentDate <= end && days <= 31) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
        days++;
      }
      return dates;
    };

    const dates = getDatesInRange(targetDesde, targetHasta);

    // 1. Obtener TODOS los centros de distribución de esta comercializadora desde Oracle
    const centrosOracle = await getCentrosDistribucionOracle(comercializadora);

    // 2. Obtener los registros reales desde SQLite para el rango solicitado
    const authDb = await getAuthDb();
    const declaradosRango = await authDb.all(
      "SELECT nombre_centro, marca_temporal, fecha_stock, diesel_premium, gasolina_extra, gasolina_extra_etanol, gasolina_super, gasolina_pesca_artesanal FROM stock_diario WHERE fecha_stock >= ? AND fecha_stock <= ?",
      [`${targetDesde}T00:00`, `${targetHasta}T23:59`]
    );

    // Convertir a un mapa para búsqueda rápida: mapa[nombre_centro][fecha]
    const mapaDeclaraciones = {};
    for (const dec of declaradosRango) {
      const datePart = dec.fecha_stock.split('T')[0];
      if (!mapaDeclaraciones[dec.nombre_centro]) {
        mapaDeclaraciones[dec.nombre_centro] = {};
      }
      mapaDeclaraciones[dec.nombre_centro][datePart] = dec;
    }

    // 3. Cruzar datos (Centros x Fechas)
    const reporte = [];
    for (const date of dates) {
      for (const centro of centrosOracle) {
        const declaracion = mapaDeclaraciones[centro.dato_concatenado]?.[date];
        const completado = !!declaracion;
        
        reporte.push({
          ...centro,
          fecha_objetivo: date, // Nuevo campo
          estado: completado ? 'COMPLETADO' : 'PENDIENTE',
          hora_registro: completado ? new Date(declaracion.marca_temporal).toISOString() : null,
          stocks: completado ? {
            diesel_premium: declaracion.diesel_premium,
            gasolina_extra: declaracion.gasolina_extra,
            gasolina_extra_etanol: declaracion.gasolina_extra_etanol,
            gasolina_super: declaracion.gasolina_super,
            gasolina_pesca_artesanal: declaracion.gasolina_pesca_artesanal
          } : null
        });
      }
    }

    // Ordenar: primero fechas más recientes, luego pendientes, luego alfabéticamente
    reporte.sort((a, b) => {
      if (a.fecha_objetivo !== b.fecha_objetivo) return b.fecha_objetivo.localeCompare(a.fecha_objetivo);
      if (a.estado === b.estado) return a.nombre.localeCompare(b.nombre);
      return a.estado === 'PENDIENTE' ? -1 : 1;
    });

    // Calcular KPIs
    const total = reporte.length;
    const completados = reporte.filter(c => c.estado === 'COMPLETADO').length;
    const pendientes = total - completados;

    res.json({ 
      success: true, 
      data: reporte,
      kpis: {
        total,
        completados,
        pendientes
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado diario de auditoría:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al procesar la auditoría.' });
  }
};
