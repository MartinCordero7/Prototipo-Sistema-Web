import { getCentrosDistribucionOracle } from '../models/DataModel.js';
import { getAuthDb } from '../authDb.js';

export const getCentrosHandler = async (req, res) => {
  const { comercializadora } = req.query;
  
  if (!comercializadora) {
    return res.status(400).json({ success: false, message: 'Se requiere la comercializadora.' });
  }

  try {
    const centros = await getCentrosDistribucionOracle(comercializadora);
    res.json({ success: true, data: centros });
  } catch (error) {
    console.error('Error obteniendo centros:', error);
    res.status(500).json({ success: false, message: 'Error interno obteniendo los centros de distribución.' });
  }
};

export const submitFormHandler = async (req, res) => {
  const formData = req.body;

  if (!formData.centroId || !formData.fecha || !formData.correoUsuario || !formData.nombreCentro) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos en el formulario.' });
  }

  if (!formData.productosSeleccionados || formData.productosSeleccionados.length === 0) {
    return res.status(400).json({ success: false, message: 'Debe seleccionar al menos un producto.' });
  }

  try {
    const authDb = await getAuthDb();
    
    // Iterar sobre los productos seleccionados y guardar una fila por cada uno
    for (const producto of formData.productosSeleccionados) {
      const cantidad = formData.stocks[producto];
      if (cantidad && parseInt(cantidad, 10) > 0) {
        await authDb.run(`
          INSERT INTO stock_diario (fecha_stock, correo_usuario, nombre_centro, producto, cantidad, acepta_envio)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          formData.fecha, 
          formData.correoUsuario, 
          formData.nombreCentro, 
          producto, 
          parseInt(cantidad, 10), 
          formData.aceptaRealidad ? 1 : 0
        ]);
      }
    }

    return res.json({ success: true, message: 'Stock guardado exitosamente.' });
  } catch (error) {
    console.error('Error guardando stock:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al guardar.' });
  }
};
