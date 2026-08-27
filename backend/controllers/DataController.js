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
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos en el formulario (incluyendo el correo electrónico).' });
  }

  if (!formData.productosSeleccionados || formData.productosSeleccionados.length === 0) {
    return res.status(400).json({ success: false, message: 'Debe seleccionar al menos un producto.' });
  }

  try {
    const authDb = await getAuthDb();
    
    const ecuadorTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Guayaquil"}));
    
    // Formatear a YYYY-MM-DD HH:MM:SS
    const pad = (n) => n.toString().padStart(2, '0');
    const marcaTemporal = `${ecuadorTime.getFullYear()}-${pad(ecuadorTime.getMonth() + 1)}-${pad(ecuadorTime.getDate())} ${pad(ecuadorTime.getHours())}:${pad(ecuadorTime.getMinutes())}:${pad(ecuadorTime.getSeconds())}`;

    // Validar si ya existe un registro para ese usuario en esa fecha
    const existingStock = await authDb.get(
      'SELECT id FROM stock_diario WHERE correo_usuario = ? AND fecha_stock = ?',
      [formData.correoUsuario, formData.fecha]
    );

    if (existingStock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya ha reportado el stock para esta fecha. No se permiten registros duplicados.' 
      });
    }

    // Extraer cantidades por producto
    const getStock = (nombreProd) => {
      if (formData.productosSeleccionados.includes(nombreProd) && formData.stocks[nombreProd]) {
        const val = parseInt(formData.stocks[nombreProd], 10);
        if (val < 0 || val > 50000) {
          throw new Error(`El valor del stock para ${nombreProd} debe estar entre 0 y 50,000.`);
        }
        return val;
      }
      return 0;
    };

    let dieselPremium, gasolinaExtra, gasolinaExtraEtanol, gasolinaSuper, gasolinaPesca;
    
    try {
      dieselPremium = getStock('Diésel Premium');
      gasolinaExtra = getStock('Gasolina Extra');
      gasolinaExtraEtanol = getStock('Gasolina Extra con Etanol');
      gasolinaSuper = getStock('Gasolina Súper');
      gasolinaPesca = getStock('Gasolina Pesca Artesanal');
    } catch (validationError) {
      return res.status(400).json({ success: false, message: validationError.message });
    }

    await authDb.run(`
      INSERT INTO stock_diario (
        marca_temporal, fecha_stock, correo_usuario, nombre_centro,
        diesel_premium, gasolina_extra, gasolina_extra_etanol, gasolina_super, gasolina_pesca_artesanal,
        acepta_envio
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      marcaTemporal,
      formData.fecha, // Fecha exacta elegida por el usuario
      formData.correoUsuario,
      formData.nombreCentro,
      dieselPremium,
      gasolinaExtra,
      gasolinaExtraEtanol,
      gasolinaSuper,
      gasolinaPesca,
      formData.aceptaRealidad ? 1 : 0
    ]);

    return res.json({ success: true, message: 'Stock guardado exitosamente.' });
  } catch (error) {
    console.error('Error guardando stock:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor al guardar.' });
  }
};
