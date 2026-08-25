import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';

const PRODUCTOS_DISPONIBLES = [
  'Diésel Premium',
  'Gasolina Extra',
  'Gasolina Extra con Etanol',
  'Gasolina Súper',
  'Gasolina Pesca Artesanal'
];

const MOCK_CENTROS = [
  { id: 101, nombre: 'Centro Distribución Norte A' }, 
  { id: 102, nombre: 'Centro Distribución Norte B' },
  { id: 201, nombre: 'Centro Distribución Sur A' },
  { id: 301, nombre: 'Centro Central Principal' }
];

const FormularioES = () => {
  const navigate = useNavigate();

  // Verificar sesión al cargar
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      navigate('/login');
    }
  }, [navigate]);

  // Form State
  const [formData, setFormData] = useState({
    centroId: '',
    fecha: '',
    productosSeleccionados: [],
    stocks: {},
    aceptaRealidad: false
  });

  const [errors, setErrors] = useState({});
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const tourSteps = [
    {
      target: '.step-centro',
      content: 'Selecciona el centro desde donde estás reportando la operación.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-fecha',
      content: 'Ingresa la fecha de la operación (solo datos de hasta 10 días atrás).',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-productos',
      content: 'Marca los productos operados e ingresa su respectivo stock. Mayor a 0 y máximo 50,000.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-confirmacion',
      content: 'Es obligatorio marcar la casilla aceptando que los valores reflejan la realidad operativa.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-submit',
      content: 'Finalmente, haz clic aquí para enviar tus datos. Solo se permite un registro por centro al día.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  const hoyDate = new Date();
  const hace10DiasDate = new Date(hoyDate);
  hace10DiasDate.setDate(hoyDate.getDate() - 10);
  
  const formatDateTime = (date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  };

  const maxFecha = formatDateTime(hoyDate);
  const minFecha = formatDateTime(hace10DiasDate);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'aceptaRealidad') {
        setFormData({ ...formData, aceptaRealidad: checked });
      } else {
        let nuevosProductos = [...formData.productosSeleccionados];
        if (checked) {
          nuevosProductos.push(value);
        } else {
          nuevosProductos = nuevosProductos.filter(p => p !== value);
        }
        setFormData({ ...formData, productosSeleccionados: nuevosProductos });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStockChange = (producto, value) => {
    const regex = /^[0-9]*$/;
    if (regex.test(value) || value === '') {
      const numValue = parseInt(value, 10);
      if (value !== '' && numValue > 50000) {
        return; 
      }
      setFormData({
        ...formData,
        stocks: {
          ...formData.stocks,
          [producto]: value
        }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let formErrors = {};

    if (!formData.centroId) formErrors.centroId = 'Seleccione un centro de distribución';
    if (!formData.fecha) formErrors.fecha = 'Seleccione fecha y hora';
    if (formData.productosSeleccionados.length === 0) formErrors.productos = 'Debe seleccionar al menos un producto';
    
    formData.productosSeleccionados.forEach(prod => {
      const stockValue = formData.stocks[prod];
      if (!stockValue) {
        formErrors.stocks = 'Debe ingresar el stock para los productos seleccionados';
      } else if (parseInt(stockValue, 10) === 0) {
        formErrors.stocks = 'La opción de producto seleccionada no puede ser 0';
      }
    });

    if (!formData.aceptaRealidad) formErrors.aceptaRealidad = 'Debe aceptar los términos';

    // === VALIDACIÓN: Bloqueo por día y centro ===
    if (formData.fecha && formData.centroId) {
      const selectedDate = formData.fecha.split('T')[0];
      const validationKey = `${formData.centroId}_${selectedDate}`;
      const submittedRecords = JSON.parse(localStorage.getItem('submittedRecords') || '[]');
      
      if (submittedRecords.includes(validationKey)) {
        setShowDuplicateModal(true);
        return; // Detiene el envío
      }
    }

    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      // Guardar la fecha y centro como completado
      const selectedDate = formData.fecha.split('T')[0];
      const validationKey = `${formData.centroId}_${selectedDate}`;
      const submittedRecords = JSON.parse(localStorage.getItem('submittedRecords') || '[]');
      
      submittedRecords.push(validationKey);
      localStorage.setItem('submittedRecords', JSON.stringify(submittedRecords));

      alert('Formulario enviado correctamente:\\n' + JSON.stringify(formData, null, 2));
      
      // Limpiar el formulario
      setFormData({
        centroId: '',
        fecha: '',
        productosSeleccionados: [],
        stocks: {},
        aceptaRealidad: false
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  // Si no está autenticado, no renderizar nada para evitar destellos
  if (!localStorage.getItem('isAuthenticated')) return null;

  return (
    <div className="form-card">
      <Joyride 
        key={tourKey}
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: 'Terminar',
          next: 'Siguiente',
          skip: 'Saltar guía'
        }}
        styles={{
          options: {
            primaryColor: '#1f315c',
            zIndex: 10000,
          }
        }}
      />
      
      <h2 className="form-title">Ingreso Diario de Operaciones</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group step-centro">
          <label>Centro de Distribución</label>
          <select name="centroId" value={formData.centroId} onChange={handleChange} className="form-control">
            <option value="">-- Seleccione un Centro --</option>
            {MOCK_CENTROS.map(cen => (
              <option key={cen.id} value={cen.id}>{cen.nombre}</option>
            ))}
          </select>
          {errors.centroId && <span className="error-text">{errors.centroId}</span>}
        </div>

        <div className="form-group step-fecha">
          <label>Fecha y Hora</label>
          <input 
            type="datetime-local" 
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="form-control"
            min={minFecha}
            max={maxFecha}
          />
          {errors.fecha && <span className="error-text">{errors.fecha}</span>}
        </div>

        <div className="form-group step-productos">
          <label>Productos (Seleccione al menos uno)</label>
          <div className="checkbox-group">
            {PRODUCTOS_DISPONIBLES.map(prod => (
              <div key={prod} className="checkbox-item">
                <label>
                  <input 
                    type="checkbox" 
                    name="productos"
                    value={prod}
                    checked={formData.productosSeleccionados.includes(prod)}
                    onChange={handleChange}
                  />
                  {prod}
                </label>
                {formData.productosSeleccionados.includes(prod) && (
                  <input 
                    type="text"
                    placeholder="Stock (ej. 1500)"
                    value={formData.stocks[prod] || ''}
                    onChange={(e) => handleStockChange(prod, e.target.value)}
                    className="stock-input form-control"
                  />
                )}
              </div>
            ))}
          </div>
          {errors.productos && <span className="error-text">{errors.productos}</span>}
          {errors.stocks && <span className="error-text">{errors.stocks}</span>}
        </div>

        <div className="acceptance-container step-confirmacion">
          <input 
            type="checkbox" 
            name="aceptaRealidad"
            id="aceptaRealidad"
            checked={formData.aceptaRealidad}
            onChange={handleChange}
          />
          <label htmlFor="aceptaRealidad">
            Acepta que los valores registrados corresponden a la realidad operativa.
          </label>
        </div>
        {errors.aceptaRealidad && <span className="error-text">{errors.aceptaRealidad}</span>}

        <button type="submit" className="btn-submit step-submit">Enviar Datos</button>
      </form>

      {/* MODAL DE REGISTRO DUPLICADO */}
      {showDuplicateModal && (
        <div className="modal-overlay">
          <div className="modal-content form-card">
            <h2 className="form-title" style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '1.5rem' }}>
              Registro Bloqueado
            </h2>
            <p style={{ textAlign: 'center', lineHeight: '1.6', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              El stock de ese día <strong>ya fue ingresado</strong>. <br/><br/>
              En caso de querer hacer alguna corrección, por favor ponerse en contacto con la agencia de regulación.
            </p>
            <button 
              className="btn-submit" 
              style={{ backgroundColor: 'var(--danger-color)', marginTop: '1rem' }} 
              onClick={() => setShowDuplicateModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE DE AYUDA */}
      <button 
        className="btn-help-float" 
        onClick={() => {
          setTourKey(prev => prev + 1);
          setRunTour(true);
        }}
      >
        ¿Necesitas ayuda?
      </button>
    </div>
  );
};

export default FormularioES;
