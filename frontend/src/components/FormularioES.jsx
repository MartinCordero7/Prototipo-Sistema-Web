import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';

// --- Iconos SVG (Corporativos) ---
import {
  IconSettings,
  IconCheckCircle,
  IconAlertTriangle,
  IconInfo,
  IconX,
  IconLock,
  IconClock
} from './Icons';

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

  // Estados de Sincronización de Reloj
  const [horaCierre, setHoraCierre] = useState(12);
  const [isClosed, setIsClosed] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // 1. Obtener la hora de cierre desde el servidor al cargar
  useEffect(() => {
    fetch('http://localhost:3000/api/auth/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHoraCierre(data.horaCierre);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Loop del Timer (1 segundo)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (currentHour >= horaCierre) {
        setIsClosed(true);
        setTimeLeft('Cerrado por hoy');
      } else {
        setIsClosed(false);
        const limitTime = new Date();
        limitTime.setHours(horaCierre, 0, 0, 0);
        
        const diffMs = limitTime - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        setTimeLeft(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [horaCierre]);

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
  
  const [customAlert, setCustomAlert] = useState({ show: false, type: 'success', title: '', message: '' });
  
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

    if (!userData.correo) {
      formErrors.correo = 'Debe configurar su correo electrónico en "Configuración" antes de enviar el formulario.';
    }

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
      // Guardar la fecha y centro localmente para validaciones futuras rápidas
      const selectedDate = formData.fecha.split('T')[0];
      const validationKey = `${formData.centroId}_${selectedDate}`;
      const submittedRecords = JSON.parse(localStorage.getItem('submittedRecords') || '[]');
      
      // Armar la petición al backend
      fetch('http://localhost:3000/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          correoUsuario: userData.correo,
          nombreCentro: userData.nombre_estacion
        })
      })
      .then(async response => {
        const data = await response.json();
        return { status: response.status, data };
      })
      .then(({ status, data }) => {
        if (data.success) {
          submittedRecords.push(validationKey);
          localStorage.setItem('submittedRecords', JSON.stringify(submittedRecords));
          setCustomAlert({ show: true, type: 'success', title: '¡Éxito!', message: 'Datos guardados exitosamente en la base de datos.' });
          
          // Limpiar el formulario
          setFormData({
            centroId: '',
            fecha: '',
            productosSeleccionados: [],
            stocks: {},
            aceptaRealidad: false
          });
        } else {
          if (status === 400 && data.message.includes('duplicados')) {
            setShowDuplicateModal(true);
          } else {
            setCustomAlert({ show: true, type: 'error', title: 'Error al Guardar', message: data.message });
          }
        }
      })
      .catch(error => {
        console.error('Error enviando formulario:', error);
        setCustomAlert({ show: true, type: 'error', title: 'Error de Conexión', message: 'No se pudo contactar con el servidor. Revise su conexión.' });
      });
    }
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
        setCustomAlert({ show: true, type: 'success', title: '¡Actualizado!', message: data.message });
        
        // Actualizar datos locales
        const updatedUser = { ...userData, correo: data.updatedData.correo };
        setUserData(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        // Limpiar campos excepto correo si se quiere
        setConfigData({ newEmail: '', newPassword: '', currentPassword: '' });
        
        setTimeout(() => {
          setShowConfigModal(false);
        }, 2000);
      } else {
        setCustomAlert({ show: true, type: 'error', title: 'Error al Actualizar', message: data.message || 'Error al actualizar.' });
      }
    } catch (err) {
      console.error(err);
      setCustomAlert({ show: true, type: 'error', title: 'Error de Conexión', message: 'Error de conexión con el servidor.' });
    } finally {
      setConfigLoading(false);
    }
  };

  // Si no está autenticado, no renderizar nada para evitar destellos
  if (!localStorage.getItem('isAuthenticated')) return null;

  return (
    <div className="corp-flex-center">
      
      <div className="corp-auth-card" style={{ maxWidth: '650px', width: '100%' }}>
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
              primaryColor: '#0f172a',
              zIndex: 10000,
            }
          }}
        />
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="corp-h1">Ingreso Diario de Operaciones</h2>
          <p className="corp-body">Registro oficial de stock</p>
        </div>
        
        {userData && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '16px'
          }}>
            <div>
              <h3 className="corp-h2" style={{ marginBottom: '4px' }}>{userData.nombre_estacion}</h3>
              <p className="corp-body" style={{ textAlign: 'left', color: '#64748b' }}>
                Comercializadora: <strong style={{ color: '#334155' }}>{userData.comercializadora}</strong>
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: isClosed ? '#fee2e2' : '#f0fdf4',
                color: isClosed ? '#b91c1c' : '#166534',
                fontWeight: '600',
                border: `1px solid ${isClosed ? '#fecaca' : '#bbf7d0'}`
              }}>
                {isClosed ? <IconLock /> : <IconClock />}
                {isClosed ? 'Sistema Cerrado' : `Cierre en: ${timeLeft}`}
              </div>

              <button 
                onClick={() => setShowConfigModal(true)}
                className="corp-btn corp-btn-outline"
                style={{ width: 'auto', height: '36px', padding: '0 16px', fontSize: '13px' }}
              >
                <IconSettings /> Configuración
              </button>
            </div>
          </div>
        )}

        {isClosed && (
          <div className="corp-alert corp-alert-warning" style={{ marginBottom: '24px', backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
            <IconLock />
            El horario de ingreso de información ha finalizado (Límite: {horaCierre}:00). El formulario está bloqueado.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="corp-form-group step-fecha">
            <label htmlFor="fecha" className="corp-label">Fecha y Hora de la Declaración</label>
            <input 
              type="datetime-local" 
              name="fecha" 
              id="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="corp-input"
              min={minFecha}
              max={maxFecha}
              disabled={isClosed}
            />
            {errors.fecha && <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '500' }}>{errors.fecha}</span>}
          </div>

          <div className="corp-form-group step-productos">
            <label className="corp-label" style={{ marginBottom: '12px' }}>Productos (Seleccione al menos uno)</label>
            
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              {PRODUCTOS_DISPONIBLES.map((prod, index) => (
                <div 
                  key={prod} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px 16px', 
                    backgroundColor: formData.productosSeleccionados.includes(prod) ? '#f8fafc' : '#ffffff',
                    borderBottom: index < PRODUCTOS_DISPONIBLES.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}
                >
                  <label className="corp-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontWeight: formData.productosSeleccionados.includes(prod) ? '600' : '400', color: '#0f172a' }}>
                    <input 
                      type="checkbox" 
                      name="productos"
                      value={prod}
                      checked={formData.productosSeleccionados.includes(prod)}
                      onChange={handleChange}
                      className="corp-checkbox"
                      style={{ margin: 0 }}
                      disabled={isClosed}
                    />
                    {prod}
                  </label>
                  
                  {formData.productosSeleccionados.includes(prod) && (
                    <div style={{ width: '160px' }}>
                      <input 
                        type="text"
                        placeholder="Stock (ej. 1500)"
                        value={formData.stocks[prod] || ''}
                        onChange={(e) => handleStockChange(prod, e.target.value)}
                        className="corp-input"
                        style={{ height: '36px', fontSize: '13px' }}
                        disabled={isClosed}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {errors.productos && <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px', display: 'block', fontWeight: '500' }}>{errors.productos}</span>}
            {errors.stocks && <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '500' }}>{errors.stocks}</span>}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '32px 0 24px 0' }} />

          <div className="corp-checkbox-wrapper step-confirmacion" style={{ alignItems: 'flex-start' }}>
            <input 
              type="checkbox" 
              name="aceptaRealidad"
              id="aceptaRealidad"
              checked={formData.aceptaRealidad}
              onChange={handleChange}
              className="corp-checkbox"
              style={{ marginTop: '3px' }}
              disabled={isClosed}
            />
            <label htmlFor="aceptaRealidad" className="corp-checkbox-label" style={{ fontWeight: '500', color: '#1e293b' }}>
              Acepta que los valores registrados corresponden a la realidad operativa del centro de distribución.
            </label>
          </div>
          {errors.aceptaRealidad && <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '500' }}>{errors.aceptaRealidad}</span>}
          
          {errors.correo && (
            <div className="corp-alert corp-alert-warning" style={{ marginTop: '16px' }}>
              <IconAlertTriangle />
              {errors.correo}
            </div>
          )}

          <button 
            type="submit" 
            className="corp-btn corp-btn-primary step-submit" 
            style={{ marginTop: '32px' }}
            disabled={isClosed}
          >
            {isClosed ? 'Sistema Cerrado' : 'Registrar e Informar Datos'}
          </button>
        </form>

        {/* MODAL DE REGISTRO DUPLICADO */}
        {showDuplicateModal && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title">
                  <span style={{ color: '#dc2626' }}><IconAlertTriangle /></span>
                  Registro Bloqueado
                </h3>
                <button onClick={() => setShowDuplicateModal(false)} className="corp-modal-close">
                  <IconX />
                </button>
              </div>
              <div className="corp-modal-body">
                <p style={{ margin: '0 0 16px 0' }}>
                  El stock de ese día <strong>ya fue ingresado</strong>.
                </p>
                <p style={{ margin: 0 }}>
                  En caso de requerir correcciones en el registro oficial, por favor contacte a la mesa de ayuda de la agencia de regulación.
                </p>
              </div>
              <div className="corp-modal-footer">
                <button 
                  className="corp-btn corp-btn-primary" 
                  style={{ backgroundColor: '#b91c1c', width: 'auto' }} 
                  onClick={() => setShowDuplicateModal(false)}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTÓN FLOTANTE DE AYUDA */}
        <button 
          onClick={() => {
            setTourKey(prev => prev + 1);
            setRunTour(true);
          }}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            backgroundColor: '#0f172a',
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 999
          }}
        >
          <IconInfo /> ¿Necesitas ayuda?
        </button>

        {/* Modal de Configuración */}
        {showConfigModal && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card large">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title">
                  <IconSettings /> Actualizar Datos
                </h3>
                <button onClick={() => setShowConfigModal(false)} className="corp-modal-close">
                  <IconX />
                </button>
              </div>

              <div className="corp-modal-body">
                {userData?.correo && (
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px' }}>
                    <strong>Correo actual registrado:</strong><br/> {userData.correo}
                  </div>
                )}

                <form id="form-config" onSubmit={handleUpdateProfile}>
                  <div className="corp-form-group">
                    <label className="corp-label">Nuevo Correo Electrónico (opcional)</label>
                    <input 
                      type="email" 
                      name="newEmail"
                      value={configData.newEmail}
                      onChange={handleConfigChange}
                      className="corp-input"
                      placeholder="ej. nuevo@empresa.com"
                    />
                  </div>

                  <div className="corp-form-group">
                    <label className="corp-label">Nueva Contraseña (opcional)</label>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={configData.newPassword}
                      onChange={handleConfigChange}
                      className="corp-input"
                      placeholder="Dejar en blanco para no cambiar"
                    />
                  </div>

                  <hr style={{ margin: '24px 0', borderTop: '1px solid #e2e8f0' }} />

                  <div className="corp-form-group" style={{ marginBottom: 0 }}>
                    <label className="corp-label" style={{ color: '#b91c1c' }}>Contraseña Actual (Obligatoria)</label>
                    <div className="corp-input-wrapper">
                      <div className="corp-input-icon"><IconLock /></div>
                      <input 
                        type="password" 
                        name="currentPassword"
                        value={configData.currentPassword}
                        onChange={handleConfigChange}
                        className="corp-input with-icon"
                        placeholder="Ingrese su clave por seguridad"
                        required
                      />
                    </div>
                  </div>

                  {configError && <span style={{ color: '#dc2626', fontSize: '13px', display: 'block', marginTop: '16px', textAlign: 'center', fontWeight: '500' }}>{configError}</span>}
                  {configSuccess && <span style={{ display: 'block', marginTop: '16px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>{configSuccess}</span>}
                </form>
              </div>

              <div className="corp-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowConfigModal(false)}
                  className="corp-btn corp-btn-outline"
                  style={{ width: 'auto' }}
                >
                  Cancelar
                </button>
                <button 
                  form="form-config"
                  type="submit" 
                  className="corp-btn corp-btn-primary" 
                  disabled={configLoading}
                  style={{ width: 'auto' }}
                >
                  {configLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CUSTOM ALERT (Feedback) */}
        {customAlert.show && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title">
                  <span style={{ color: customAlert.type === 'success' ? '#16a34a' : '#dc2626' }}>
                    {customAlert.type === 'success' ? <IconCheckCircle /> : <IconAlertTriangle />}
                  </span>
                  {customAlert.title}
                </h3>
                <button onClick={() => setCustomAlert({ ...customAlert, show: false })} className="corp-modal-close">
                  <IconX />
                </button>
              </div>
              <div className="corp-modal-body">
                <p style={{ margin: 0 }}>
                  {customAlert.message}
                </p>
              </div>
              <div className="corp-modal-footer">
                <button 
                  onClick={() => setCustomAlert({ ...customAlert, show: false })}
                  className="corp-btn corp-btn-primary"
                  style={{ backgroundColor: customAlert.type === 'success' ? '#16a34a' : '#dc2626', width: 'auto' }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FormularioES;
