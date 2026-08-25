import { getEstaciones, getCentrosDistribucion } from '../models/DataModel.js';

export const getEstacionesHandler = (req, res) => {
  const estaciones = getEstaciones();
  res.json({ success: true, data: estaciones });
};

export const getCentrosHandler = (req, res) => {
  const { estacionId } = req.params;
  const centros = getCentrosDistribucion(parseInt(estacionId));
  res.json({ success: true, data: centros });
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
