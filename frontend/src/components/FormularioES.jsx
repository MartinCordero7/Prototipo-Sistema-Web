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

const FormularioES = () => {
  const navigate = useNavigate();

  // Verificar sesión y obtener datos del usuario
  const [userData, setUserData] = useState(null);
  const [centros, setCentros] = useState([]);
  const [loadingCentros, setLoadingCentros] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    if (!isAuth) {
      navigate('/login');
    } else {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // Bloquear acceso al formulario si se requiere cambio de contraseña
        if (parsedUser.requirePasswordChange) {
          navigate('/change-password');
          return;
        }

        setUserData(parsedUser);
        // Actualizamos formData con el centro automáticamente
        setFormData(prev => ({ ...prev, centroId: parsedUser.nombre_estacion }));
      }
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

  // Estados para el Modal de Configuración
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configData, setConfigData] = useState({
    newEmail: '',
    newPassword: '',
    currentPassword: ''
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');
  
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const tourSteps = [
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

  const handleConfigChange = (e) => {
    setConfigData({
      ...configData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setConfigError('');
    setConfigSuccess('');

    if (!configData.currentPassword) {
      setConfigError('Debe ingresar su contraseña actual por seguridad.');
      return;
    }

    setConfigLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          currentPassword: configData.currentPassword,
          newEmail: configData.newEmail,
          newPassword: configData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setConfigSuccess(data.message);
        
        // Actualizar datos locales
        const updatedUser = { ...userData, correo: data.updatedData.correo };
        setUserData(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        // Limpiar campos excepto correo si se quiere
        setConfigData({ newEmail: '', newPassword: '', currentPassword: '' });
        
        setTimeout(() => {
          setShowConfigModal(false);
          setConfigSuccess('');
        }, 2000);
      } else {
        setConfigError(data.message || 'Error al actualizar.');
      }
    } catch (err) {
      console.error(err);
      setConfigError('Error de conexión con el servidor.');
    } finally {
      setConfigLoading(false);
    }
  };

  // Si no está autenticado, no renderizar nada para evitar destellos
  if (!localStorage.getItem('isAuthenticated')) return null;

  return (
    <div className="form-card" style={{ maxWidth: '650px', margin: '0 auto' }}>
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
      
      {userData && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#e9f2ff', borderRadius: '8px', border: '1px solid #b8d4ff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1f315c', fontSize: '1.1rem' }}>{userData.nombre_estacion}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#4a5568', fontSize: '0.9rem' }}>Comercializadora: <strong>{userData.comercializadora}</strong></p>
          </div>
          <button 
            onClick={() => setShowConfigModal(true)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--accent-color)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', 
              fontSize: '0.9rem', fontWeight: '600' 
            }}
          >
            ⚙️ Configuración
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* El centro de distribución ya viene por la sesión (userData.nombre_estacion) */}

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
      {/* Modal de Configuración */}
      {showConfigModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            maxWidth: '400px', width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>Actualizar Datos</h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>

            {userData?.correo && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '6px' }}>
                <strong>Correo actual registrado:</strong><br/> {userData.correo}
              </p>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Nuevo Correo Electrónico (opcional)</label>
                <input 
                  type="email" 
                  name="newEmail"
                  value={configData.newEmail}
                  onChange={handleConfigChange}
                  className="form-control"
                  placeholder="ej. nuevo@empresa.com"
                />
              </div>

              <div className="form-group">
                <label>Nueva Contraseña (opcional)</label>
                <input 
                  type="password" 
                  name="newPassword"
                  value={configData.newPassword}
                  onChange={handleConfigChange}
                  className="form-control"
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>

              <hr style={{ margin: '1.5rem 0', borderTop: '1px solid #e5e7eb' }} />

              <div className="form-group">
                <label style={{ color: '#dc2626' }}>Contraseña Actual (Obligatoria)</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={configData.currentPassword}
                  onChange={handleConfigChange}
                  className="form-control"
                  placeholder="Ingrese su clave por seguridad"
                  required
                />
              </div>

              {configError && <span className="error-text" style={{ display: 'block', marginBottom: '1rem', textAlign: 'center' }}>{configError}</span>}
              {configSuccess && <span style={{ display: 'block', marginBottom: '1rem', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{configSuccess}</span>}

              <button type="submit" className="btn-submit" disabled={configLoading}>
                {configLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormularioES;
