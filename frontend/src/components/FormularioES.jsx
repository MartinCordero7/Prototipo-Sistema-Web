import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';

// --- Iconos SVG (Corporativos) ---
import {
  IconInfo,
  IconLock,
  IconClock,
  IconCheckCircle,
  IconX,
  IconAlertTriangle,
  IconSettings
} from './Icons';
import ConfigModal from './ConfigModal';
import HistorialEstacion from './HistorialEstacion';

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

  // Tabs
  const [activeTab, setActiveTab] = useState('formulario');

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
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/config`)
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
        
        setTimeLeft(`${diffHrs}h ${diffMins}m ${diffSecs}s`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [horaCierre]);

  // Estados para el Modal de Configuración
  const [showConfigModal, setShowConfigModal] = useState(false);
  
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
      fetch(`${import.meta.env.VITE_API_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
            centroId: userData.nombre_estacion,
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
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="corp-h1">Ingreso Diario de Operaciones</h2>
          <p className="corp-body" style={{ marginBottom: '16px' }}>Registro oficial de stock</p>
          
          {/* Timer at the top */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: isClosed ? '#fee2e2' : '#f0fdf4',
              color: isClosed ? '#b91c1c' : '#166534',
              fontWeight: '700',
              fontSize: '15px',
              border: `1px solid ${isClosed ? '#fecaca' : '#bbf7d0'}`
            }}>
              {isClosed ? <IconLock /> : <IconClock />}
              {isClosed ? 'Sistema Cerrado' : `La plataforma de ingreso se cerrará en: ${timeLeft}`}
            </div>
          </div>
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
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div>
              <h3 className="corp-h2" style={{ marginBottom: '4px' }}>{userData.nombre_estacion}</h3>
              <p className="corp-body" style={{ textAlign: 'left', color: '#64748b' }}>
                Comercializadora: <strong style={{ color: '#334155' }}>{userData.comercializadora}</strong>
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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

        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <button 
            className={`corp-tab ${activeTab === 'formulario' ? 'active' : ''}`}
            onClick={() => setActiveTab('formulario')}
            style={{ 
              padding: '12px 24px', 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'formulario' ? '2px solid #1f315c' : '2px solid transparent',
              color: activeTab === 'formulario' ? '#1f315c' : '#64748b',
              fontWeight: activeTab === 'formulario' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Declaración de Stock
          </button>
          <button 
            className={`corp-tab ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => setActiveTab('historial')}
            style={{ 
              padding: '12px 24px', 
              background: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === 'historial' ? '2px solid #1f315c' : '2px solid transparent',
              color: activeTab === 'historial' ? '#1f315c' : '#64748b',
              fontWeight: activeTab === 'historial' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Mi Historial
          </button>
        </div>

        {activeTab === 'historial' && (
          <HistorialEstacion />
        )}

        {activeTab === 'formulario' && (
          <>
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
                    borderBottom: index < PRODUCTOS_DISPONIBLES.length - 1 ? '1px solid #e2e8f0' : 'none',
                    flexWrap: 'wrap',
                    gap: '12px'
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
                    <div style={{ width: '100%', maxWidth: '160px', minWidth: '120px' }}>
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
        </>
      )}

      {/* BOTÓN FLOTANTE DE AYUDA */}
        <button 
          onClick={() => {
            if (activeTab !== 'formulario') {
              setActiveTab('formulario');
              setTimeout(() => {
                setTourKey(prev => prev + 1);
                setRunTour(true);
              }, 150);
            } else {
              setTourKey(prev => prev + 1);
              setRunTour(true);
            }
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
        <ConfigModal 
          isOpen={showConfigModal} 
          onClose={() => setShowConfigModal(false)}
          userData={userData}
          setUserData={setUserData}
          setCustomAlert={setCustomAlert}
        />

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
