import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import {
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertTriangle
} from './Icons';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  
  // UI state only
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="corp-bg corp-flex-center">
      <div className="corp-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="corp-h1">Iniciar Sesión</h2>
          <p className="corp-body">Ingrese sus credenciales corporativas</p>
        </div>
        
        {error && (
          <div className="corp-alert corp-alert-error">
            <IconAlertTriangle />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="corp-form-group">
            <label className="corp-label">Usuario</label>
            <div className="corp-input-wrapper">
              <div className="corp-input-icon"><IconUser /></div>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="corp-input with-icon"
                placeholder="Nombre de usuario asignado"
                required
              />
            </div>
          </div>
          
          <div className="corp-form-group">
            <label className="corp-label">Contraseña</label>
            <div className="corp-input-wrapper">
              <div className="corp-input-icon"><IconLock /></div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="corp-input with-icon with-icon-right"
                placeholder="Ingrese su contraseña"
                required
              />
              <div 
                className="corp-input-icon-right" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="corp-btn corp-btn-primary"
            disabled={isBlocked}
            style={{ marginTop: '24px' }}
          >
            {isBlocked ? 'Acceso Denegado' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p className="corp-body">
            ¿No tienes una cuenta?{' '}
            <Link to="/registro" className="corp-link">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
