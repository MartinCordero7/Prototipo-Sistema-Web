import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';
import { IconInfo } from './Icons';

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

  // Joyride state
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const tourSteps = [
    {
      target: '.step-user',
      content: 'Ingresa aquí tu nombre de usuario o código asignado por la agencia.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-pass',
      content: 'Escribe tu contraseña. Puedes usar el icono del ojo para visualizarla.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-login',
      content: 'Una vez completados los datos, haz clic aquí para entrar a tu panel.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-register',
      content: '¡IMPORTANTE! Si es la primera vez que ingresas al sistema, es obligatorio registrarte primero usando tu código ARCH.',
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
      <Joyride 
        key={tourKey}
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        locale={{ back: 'Atrás', close: 'Cerrar', last: 'Terminar', next: 'Siguiente', skip: 'Saltar' }}
        styles={{ options: { primaryColor: '#0f172a', zIndex: 10000 } }}
      />
      
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
            <div className="corp-input-wrapper step-user">
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
            <div className="corp-input-wrapper step-pass">
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
            className="corp-btn corp-btn-primary step-login"
            disabled={isBlocked}
            style={{ marginTop: '24px' }}
          >
            {isBlocked ? 'Acceso Denegado' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p className="corp-body">
            ¿No tienes una cuenta?{' '}
            <Link to="/registro" className="corp-link step-register">
              Registrate
            </Link>
          </p>
        </div>
        
        {/* BOTÓN FLOTANTE DE AYUDA */}
        <button 
          onClick={() => {
            setTourKey(prev => prev + 1);
            setRunTour(true);
          }}
          style={{
            position: 'fixed', bottom: '32px', right: '32px', backgroundColor: '#0f172a', color: 'white',
            border: 'none', borderRadius: '9999px', padding: '12px 24px', fontSize: '14px', fontWeight: '600',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '8px', zIndex: 999
          }}
        >
          <IconInfo /> ¿Ingresas por primera vez? Haz clic aquí
        </button>
      </div>
    </div>
  );
};

export default Login;
