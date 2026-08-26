import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userData', JSON.stringify(data.data));
        
        if (data.data.requirePasswordChange) {
          navigate('/change-password');
        } else {
          navigate('/formulario');
        }
      } else {
        setError(data.message || 'Correo o contraseña incorrectos');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    }
  };

  return (
    <div className="form-card form-card-large" style={{ maxWidth: '520px', margin: '0 auto' }}>
      <h2 className="form-title">Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Usuario </label>
          <input 
            type="text" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            placeholder="Ingrese su usuario asignado"
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
