import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userData', JSON.stringify(data.data));

        if (data.data.requirePasswordChange) {
          navigate('/change-password');
        } else if (data.data.comercializadora === 'ADMINISTRADOR') {
          navigate('/admin-dashboard');
        } else if (data.data.nombre_estacion === 'AUDITORIA') {
          navigate('/auditor-dashboard');
        } else {
          navigate('/formulario');
        }
      } else {
        setError(data.message || 'Correo o contraseña incorrectos');
        if (response.status === 403) {
          setIsBlocked(true);
        }
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
          <label>Usuario</label>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            placeholder="Nombre de usuario asignado"
            required
          />
        </div>
        <div className="form-group" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            placeholder="Ingrese su contraseña"
            required
          />
        </div>
        {error && <span className="error-text" style={{ display: 'block', marginTop: '1rem' }}>{error}</span>}
        <button
          type="submit"
          className="btn-submit"
          disabled={isBlocked}
          style={{
            marginTop: '1.5rem',
            backgroundColor: isBlocked ? '#d1d5db' : 'var(--accent-color)',
            cursor: isBlocked ? 'not-allowed' : 'pointer'
          }}
        >
          {isBlocked ? 'Acceso Denegado' : 'Iniciar Sesión'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '2.1rem', fontSize: '0.95rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿No tienes una cuenta? <Link to="/registro" style={{ color: 'var(--accent-color)', fontWeight: '600', textDecoration: 'none' }}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
