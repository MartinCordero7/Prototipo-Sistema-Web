import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const COMERCIALIZADORAS = [
  'Clyan', 'Comdecsa', 'Copedesa', 'Ecucomsa', 'Energy Lider', 
  'Energygas', 'Ep petroecuador', 'Gaspetrolium', 'Lisroni', 
  'Masgas', 'Pdv Ecuador', 'Petroleos y servicios', 'Petrolrios', 
  'Petromar', 'PetroWorld', 'Primax', 'Rexcomer', 'Servioil', 'Terpel'
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
        alert('Usuario y contraseña temporal enviados al correo asignado.');
        navigate('/login');
      } else {
        setErrorRegistro(data.message || 'Error al registrar.');
      }
    } catch (error) {
      console.error(error);
      setErrorRegistro('Error de conexión con el servidor.');
    } finally {
      setLoadingRegistro(false);
    }
  };

  return (
    <div className="form-card form-card-large" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="form-title">Registro de Cuenta</h2>
      
      {errorRegistro && <div className="error-text" style={{ marginBottom: '1rem', textAlign: 'center' }}>{errorRegistro}</div>}
      
      <form onSubmit={handleRegister}>
        
        <div className="form-group">
          <label>Comercializadora</label>
          <select 
            name="comercializadora" 
            value={formData.comercializadora} 
            onChange={handleChange} 
            className="form-control"
            required
          >
            <option value="">Seleccione una comercializadora...</option>
            {COMERCIALIZADORAS.map(c => (
              <option key={c} value={c.toUpperCase()}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Centro de Distribución</label>
          <select 
            name="centroSeleccionado" 
            value={formData.centroSeleccionado} 
            onChange={handleChange} 
            className="form-control"
            required
            disabled={!formData.comercializadora || loadingCentros}
          >
            <option value="">
              {loadingCentros ? `Cargando centros de distribución asociados a ${formData.comercializadora}...` : 'Seleccione el centro de distribución...'}
            </option>
            {centrosDisponibles.map(centro => (
              <option key={centro.id} value={centro.id}>
                {centro.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Código ARCH</label>
            <input 
              type="text" 
              name="codigoArch"
              value={formData.codigoArch}
              className="form-control"
              placeholder="Autocompletado"
              disabled
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Código Único</label>
            <input 
              type="text" 
              name="codigoUnico"
              value={formData.codigoUnico}
              className="form-control"
              placeholder="Autocompletado"
              disabled
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            className="form-control"
            placeholder="ej. contacto@empresa.com"
            required
          />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <input 
            type="checkbox" 
            id="aceptaCorreos" 
            checked={aceptaCorreos}
            onChange={handleCheckboxChange}
            required
            style={{ width: 'auto', cursor: 'pointer', margin: 0 }}
          />
          <label htmlFor="aceptaCorreos" style={{ margin: 0, fontSize: '0.95rem', cursor: 'pointer', fontWeight: '600', color: 'var(--accent-color)', display: 'inline-block' }}>
            Acepto condiciones
          </label>
        </div>

        <button type="submit" className="btn-submit" disabled={loadingRegistro || !formData.centroSeleccionado || !aceptaCorreos}>
          {loadingRegistro ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '2.1rem', fontSize: '0.95rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '600', textDecoration: 'none' }}>Inicia sesión aquí</Link>
        </p>
      </div>

      {showCondiciones && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-color)' }}>Términos y Condiciones</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Acepta que el correo ingresado será el único al que se enviará notificaciones, avisos y alertas del sistema.
            </p>
            <button 
              onClick={() => setShowCondiciones(false)}
              className="btn-submit"
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registro;
