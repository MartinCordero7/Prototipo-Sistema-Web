import { getCentrosDistribucionOracle } from '../models/DataModel.js';

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

export const submitFormHandler = (req, res) => {
  const formData = req.body;

  // Basic Validation (You can expand this as needed)
  if (!formData.estacionId || !formData.centroId || !formData.fecha) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' });
  }

  // Password hardcoded validation
  if (formData.password !== '12345') {
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
  }

  if (!formData.productos || formData.productos.length === 0) {
    return res.status(400).json({ success: false, message: 'Debe seleccionar al menos un producto.' });
  }

  console.log("Datos recibidos correctamente:", formData);

  res.json({ success: true, message: 'Datos guardados correctamente', data: formData });
};
