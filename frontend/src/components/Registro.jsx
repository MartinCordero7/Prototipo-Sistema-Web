import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombreCentro: '',
    codigoArch: '',
    codigoUnico: '',
    correo: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    // Por el momento no lo almacenamos en ningún lado, 
    // solo mostramos alerta y redirigimos al login
    alert('Registro exitoso (Simulado)\\n\\n' + JSON.stringify(formData, null, 2));
    navigate('/login');
  };

  return (
    <div className="form-card form-card-large" style={{ maxWidth: '520px', margin: '0 auto' }}>
      <h2 className="form-title">Registro de Centro</h2>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Nombre del Centro de Distribución</label>
          <input 
            type="text" 
            name="nombreCentro"
            value={formData.nombreCentro}
            onChange={handleChange}
            className="form-control"
            placeholder="Ej. Centro Norte"
            required
          />
        </div>

        <div className="form-group">
          <label>Código ARCH</label>
          <input 
            type="text" 
            name="codigoArch"
            value={formData.codigoArch}
            onChange={handleChange}
            className="form-control"
            placeholder="82#####"
            required
          />
        </div>

        <div className="form-group">
          <label>Código Único</label>
          <input 
            type="text" 
            name="codigoUnico"
            value={formData.codigoUnico}
            onChange={handleChange}
            className="form-control"
            placeholder="Ej. 123"
            required
          />
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

        <div className="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-control"
            placeholder="Contraseña"
            required
          />
        </div>

        <button type="submit" className="btn-submit">Registrarse</button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '2.1rem', fontSize: '0.95rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: '600', textDecoration: 'none' }}>Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;
