import { getCentrosDistribucionOracle } from '../models/DataModel.js';
import { getAuthDb } from '../authDb.js';

export const getEstadoDiario = async (req, res) => {
  const { comercializadora, fecha } = req.query;

  if (!comercializadora) {
    return res.status(400).json({ success: false, message: 'Se requiere la comercializadora.' });
  }

  try {
    // Definir la fecha a consultar (por defecto hoy en YYYY-MM-DD)
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const targetDate = fecha || (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

    // 1. Obtener TODOS los centros de distribución de esta comercializadora desde Oracle
    const centrosOracle = await getCentrosDistribucionOracle(comercializadora);

    // 2. Obtener los registros reales desde SQLite para la fecha solicitada
    const authDb = await getAuthDb();
    const declaradosHoy = await authDb.all(
      "SELECT DISTINCT nombre_centro, marca_temporal FROM stock_diario WHERE fecha_stock LIKE ?",
      [`${targetDate}%`]
    );

    // Convertir a un mapa para búsqueda rápida
    const mapaDeclaraciones = {};
    for (const dec of declaradosHoy) {
      mapaDeclaraciones[dec.nombre_centro] = dec.marca_temporal;
    }

    // 3. Cruzar datos
    const reporte = centrosOracle.map(centro => {
      // El nombre concatenado es el id en centrosOracle (ej. Test/82PR123/123)
      const marcaTemporal = mapaDeclaraciones[centro.dato_concatenado];
      const completado = !!marcaTemporal;
      
      return {
        ...centro,
        estado: completado ? 'COMPLETADO' : 'PENDIENTE',
        hora_registro: completado ? new Date(marcaTemporal).toISOString() : null
      };
    });

    // Ordenar: primero los pendientes, luego alfabéticamente
    reporte.sort((a, b) => {
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
