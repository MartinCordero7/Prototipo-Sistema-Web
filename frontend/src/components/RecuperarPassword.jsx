import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IconUser, IconLock, IconCheckCircle, IconAlertTriangle } from './Icons';

const RecuperarPassword = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Por favor, ingresa tu usuario.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep(2);
      } else {
        setError(data.message || 'Error al solicitar recuperación.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim() || !newPassword.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token, newPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('¡Contraseña restablecida con éxito!');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(data.message || 'Error al restablecer la contraseña.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="corp-flex-center">
      <div className="corp-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="corp-h1">Recuperar Contraseña</h2>
          <p className="corp-body">
            {step === 1 ? 'Ingresa tu usuario para recibir un código.' : 'Ingresa el código que enviamos a tu correo.'}
          </p>
        </div>

        {error && (
          <div className="corp-alert corp-alert-error" style={{ marginBottom: '24px' }}>
            <IconAlertTriangle />
            {error}
          </div>
        )}

        {success && (
          <div className="corp-alert corp-alert-success" style={{ marginBottom: '24px' }}>
            <IconCheckCircle />
            {success}
          </div>
        )}

        {!success && step === 1 && (
          <form onSubmit={handleRequestCode}>
            <div className="corp-form-group">
              <label className="corp-label">Usuario</label>
              <div className="corp-input-wrapper">
                <div className="corp-input-icon"><IconUser /></div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="corp-input with-icon"
                  placeholder="Ej. mi_usuario"
                  autoFocus
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="corp-btn corp-btn-primary"
              disabled={loading}
              style={{ marginTop: '24px' }}
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        )}

        {!success && step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="corp-form-group">
              <label className="corp-label">Código de 6 dígitos</label>
              <div className="corp-input-wrapper">
                <input
                  type="text"
                  maxLength="6"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="corp-input"
                  style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.25rem', fontWeight: 'bold' }}
                  placeholder="000000"
                  autoFocus
                />
              </div>
            </div>

            <div className="corp-form-group">
              <label className="corp-label">Nueva Contraseña</label>
              <div className="corp-input-wrapper">
                <div className="corp-input-icon"><IconLock /></div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="corp-input with-icon"
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número, 1 símbolo"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="corp-btn corp-btn-primary"
              disabled={loading}
              style={{ marginTop: '24px' }}
            >
              {loading ? 'Procesando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p className="corp-body">
            <Link to="/" className="corp-link">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;
