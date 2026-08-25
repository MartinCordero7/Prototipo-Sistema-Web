import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'prueba@empresa.com' && password === '12345') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/formulario');
    } else {
      setError('Correo o contraseña incorrectos');
    }
  };

  return (
    <div className="form-card form-card-large" style={{ maxWidth: '520px', margin: '0 auto' }}>
      <h2 className="form-title">Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            placeholder="ej. prueba@empresa.com"
          />
        </div>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Contraseña</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            placeholder="Contraseña"
          />
        </div>
        {error && <span className="error-text" style={{ display: 'block', marginTop: '1rem' }}>{error}</span>}
        <button type="submit" className="btn-submit" style={{ marginTop: '1.5rem' }}>Ingresar</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '2.1rem', fontSize: '0.95rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿No tienes cuenta? <Link to="/registro" style={{ color: 'var(--accent-color)', fontWeight: '600', textDecoration: 'none' }}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
