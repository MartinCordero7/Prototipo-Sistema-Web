import { getCentrosDistribucionOracle } from '../models/DataModel.js';

export const getEstadoDiario = async (req, res) => {
  const { comercializadora } = req.query;

  if (!comercializadora) {
    return res.status(400).json({ success: false, message: 'Se requiere la comercializadora.' });
  }

  try {
    // 1. Obtener TODOS los centros de distribución de esta comercializadora desde Oracle
    const centrosOracle = await getCentrosDistribucionOracle(comercializadora);

    // 2. Simular el cruce con SQLite (Ya que aún no hay persistencia)
    // Para motivos de demostración, marcaremos aleatoriamente algunas como completadas
    const reporte = centrosOracle.map(centro => {
      // Simulamos que un 30% ha completado el formulario hoy
      const completado = Math.random() > 0.7;
      
      return {
        ...centro,
        estado: completado ? 'COMPLETADO' : 'PENDIENTE',
        hora_registro: completado ? new Date(new Date().setHours(Math.floor(Math.random() * 10) + 6, Math.floor(Math.random() * 59))).toISOString() : null
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
