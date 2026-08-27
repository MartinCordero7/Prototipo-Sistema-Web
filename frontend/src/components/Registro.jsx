import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import {
  IconBuilding,
  IconHash,
  IconMail,
  IconCheckCircle,
  IconAlertTriangle,
  IconSmallAlert
} from './Icons';

const COMERCIALIZADORAS = [
  'Clyan', 'Comdecsa', 'Copedesa', 'Ecucomsa', 'Energy Lider', 
  'Energygas', 'Ep petroecuador', 'Gaspetrolium', 'Lisroni', 
  'Masgas', 'Pdv Ecuador', 'Petroleos y servicios', 'Petrolrios', 
  'Petromar', 'PetroWorld', 'Primax', 'Rexcomer', 'Servioil', 'Terpel', 'Test'
];

const Registro = () => {
  const [formData, setFormData] = useState({
    comercializadora: '',
    centroSeleccionado: '',
    nombreCentro: '',
    codigoArch: '',
    codigoUnico: '',
    correo: ''
  });
  
  const [centrosDisponibles, setCentrosDisponibles] = useState([]);
  const [loadingCentros, setLoadingCentros] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState('');
  const [loadingRegistro, setLoadingRegistro] = useState(false);
  const [customAlert, setCustomAlert] = useState({ show: false, type: 'success', title: '', message: '' });
  const [aceptaCorreos, setAceptaCorreos] = useState(false);
  const [showCondiciones, setShowCondiciones] = useState(false);
  const navigate = useNavigate();

  // Fetch centros cuando cambia la comercializadora
  useEffect(() => {
    if (formData.comercializadora) {
      setLoadingCentros(true);
      fetch(`http://localhost:3000/api/centros?comercializadora=${formData.comercializadora}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCentrosDisponibles(data.data);
          }
        })
        .catch(err => console.error('Error fetching centros:', err))
        .finally(() => setLoadingCentros(false));
    } else {
      setCentrosDisponibles([]);
    }
    
    // Reset selection if comercializadora changes
    setFormData(prev => ({
      ...prev,
      centroSeleccionado: '',
      nombreCentro: '',
      codigoArch: '',
      codigoUnico: ''
    }));
  }, [formData.comercializadora]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'centroSeleccionado') {
      const centro = centrosDisponibles.find(c => c.id === value);
      if (centro) {
        setFormData(prev => ({
          ...prev,
          centroSeleccionado: value,
          nombreCentro: centro.nombre,
          codigoArch: centro.codigo_arch,
          codigoUnico: centro.codigo_unico
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          centroSeleccionado: '',
          nombreCentro: '',
          codigoArch: '',
          codigoUnico: ''
        }));
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setAceptaCorreos(checked);
    if (checked) {
      setShowCondiciones(true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.centroSeleccionado) {
      setErrorRegistro('Debe seleccionar un Centro de Distribución válido.');
      return;
    }

    if (!aceptaCorreos) {
      setErrorRegistro('Debe aceptar el uso de correo para notificaciones.');
      return;
    }

    setLoadingRegistro(true);
    setErrorRegistro('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comercializadora: formData.comercializadora,
          nombreCentro: formData.nombreCentro,
          codigoArch: formData.codigoArch,
          codigoUnico: formData.codigoUnico,
          correo: formData.correo
        })
      });

      const data = await response.json();

      if (data.success) {
        setCustomAlert({ show: true, type: 'success', title: '¡Registro Exitoso!', message: 'Usuario y contraseña temporal enviados al correo asignado.' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setCustomAlert({ show: true, type: 'error', title: 'Error de Registro', message: data.message });
      }
    } catch (err) {
      console.error(err);
      setCustomAlert({ show: true, type: 'error', title: 'Error de Conexión', message: 'Error de conexión con el servidor.' });
    } finally {
      setLoadingRegistro(false);
    }
  };

  return (
    <div className="corp-bg corp-flex-center">
      <div className="corp-auth-card" style={{ maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="corp-h1">Registro de Estación</h2>
          <p className="corp-body">Ingrese los datos para generar las credenciales</p>
        </div>
        
        {errorRegistro && (
          <div className="corp-alert corp-alert-error">
            <IconSmallAlert />
            {errorRegistro}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          
          <div className="corp-form-group">
            <label className="corp-label">Comercializadora</label>
            <select 
              name="comercializadora" 
              value={formData.comercializadora} 
              onChange={handleChange} 
              className="corp-select"
              required
            >
              <option value="">Seleccione una comercializadora...</option>
              {COMERCIALIZADORAS.map(c => (
                <option key={c} value={c.toUpperCase()}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="corp-form-group">
            <label className="corp-label">Centro de Distribución</label>
            <select 
              name="centroSeleccionado" 
              value={formData.centroSeleccionado} 
              onChange={handleChange} 
              className="corp-select"
              required
              disabled={!formData.comercializadora || loadingCentros}
            >
              <option value="">
                {loadingCentros ? `Cargando centros asociados a ${formData.comercializadora}...` : 'Seleccione el centro de distribución...'}
              </option>
              {centrosDisponibles.map(centro => (
                <option key={centro.id} value={centro.id}>
                  {centro.nombre.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="corp-grid-2">
            <div className="corp-form-group">
              <label className="corp-label">Código ARCH</label>
              <div className="corp-input-wrapper">
                <div className="corp-input-icon"><IconHash /></div>
                <input 
                  type="text" 
                  name="codigoArch"
                  value={formData.codigoArch}
                  className="corp-input with-icon"
                  placeholder="Autocompletado"
                  disabled
                />
              </div>
            </div>

            <div className="corp-form-group">
              <label className="corp-label">Código Único</label>
              <div className="corp-input-wrapper">
                <div className="corp-input-icon"><IconHash /></div>
                <input 
                  type="text" 
                  name="codigoUnico"
                  value={formData.codigoUnico}
                  className="corp-input with-icon"
                  placeholder="Autocompletado"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="corp-form-group">
            <label className="corp-label">Correo Electrónico Oficial</label>
            <div className="corp-input-wrapper">
              <div className="corp-input-icon"><IconMail /></div>
              <input 
                type="email" 
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                className="corp-input with-icon"
                placeholder="ej. contacto@estacion.com"
                required
              />
            </div>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />

          <div className="corp-checkbox-wrapper" style={{ justifyContent: 'center', marginBottom: '24px' }}>
            <input 
              type="checkbox" 
              id="aceptaCorreos" 
              checked={aceptaCorreos}
              onChange={handleCheckboxChange}
              required
              className="corp-checkbox"
            />
            <label htmlFor="aceptaCorreos" className="corp-checkbox-label">
              Acepto condiciones de notificaciones
            </label>
          </div>

          <button 
            type="submit" 
            className="corp-btn corp-btn-primary" 
            disabled={loadingRegistro || !formData.centroSeleccionado || !aceptaCorreos}
          >
            {loadingRegistro ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="corp-body">
            ¿Ya tienes cuenta? <Link to="/login" className="corp-link">Inicia sesión aquí</Link>
          </p>
        </div>

        {/* Modal de Condiciones */}
        {showCondiciones && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title">Términos y Condiciones</h3>
                <button onClick={() => setShowCondiciones(false)} className="corp-modal-close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="corp-modal-body">
                <p style={{ margin: 0 }}>
                  Acepta que el correo ingresado será el único al que se enviará notificaciones, avisos y alertas del sistema.
                  <br /><br />
                  <strong style={{ color: '#b91c1c' }}>IMPORTANTE:</strong> El correo debe corresponder al centro de distribución, NO AL GENÉRICO DE LA COMERCIALIZADORA.
                </p>
              </div>
              <div className="corp-modal-footer">
                <button 
                  onClick={() => setShowCondiciones(false)}
                  className="corp-btn corp-btn-primary"
                  style={{ width: 'auto' }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Feedback */}
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

export default Registro;
