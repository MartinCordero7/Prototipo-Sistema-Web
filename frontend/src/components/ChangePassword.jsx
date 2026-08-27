import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertTriangle
} from './Icons';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUserData(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getPasswordStrength = (pass) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1; // Débil
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return 3; // Fuerte
    return 2; // Media
  };

  const strength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Actualizar userData local quitando la bandera de requirePasswordChange
        const updatedUser = { ...userData, requirePasswordChange: false };
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        // Redirigir según el rol
        if (updatedUser.comercializadora === 'ADMINISTRADOR') {
          navigate('/admin-dashboard');
        } else if (updatedUser.nombre_estacion === 'AUDITORIA') {
          navigate('/auditor-dashboard');
        } else {
          navigate('/formulario');
        }
      } else {
        setError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      console.error(err);
      setError('Error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return null;

  return (
    <div className="corp-bg corp-flex-center">
      <div className="corp-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="corp-h1">Actualización Requerida</h2>
          <p className="corp-body" style={{ marginTop: '8px' }}>
            Por motivos de seguridad, debes cambiar tu contraseña predeterminada para 
            <strong style={{ color: '#0f172a' }}> {userData.nombre_estacion}</strong> antes de continuar.
          </p>
        </div>

        {error && (
          <div className="corp-alert corp-alert-error">
            <IconAlertTriangle />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="corp-form-group">
            <label className="corp-label">
              Contraseña Actual 
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>
                (Asignada por la ARCH)
              </span>
            </label>
            <div className="corp-input-wrapper">
              <div className="corp-input-icon"><IconLock /></div>
              <input 
                type={showOld ? "text" : "password"}
                name="oldPassword"
                value={formData.oldPassword} 
                onChange={handleChange} 
                className="corp-input with-icon with-icon-right"
                required 
              />
              <div className="corp-input-icon-right" onClick={() => setShowOld(!showOld)}>
                {showOld ? <IconEyeOff /> : <IconEye />}
              </div>
            </div>
          </div>

          <div className="corp-form-group">
            <label className="corp-label">Nueva Contraseña</label>
            <div className="corp-input-wrapper">
              <div className="corp-input-icon"><IconLock /></div>
              <input 
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword} 
                onChange={handleChange} 
                className="corp-input with-icon with-icon-right"
                required 
              />
              <div className="corp-input-icon-right" onClick={() => setShowNew(!showNew)}>
                {showNew ? <IconEyeOff /> : <IconEye />}
              </div>
            </div>
            
            {/* Visual Password Strength Indicator */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '4px', height: '4px' }}>
              <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strength >= 1 ? (strength === 1 ? '#ef4444' : (strength === 2 ? '#eab308' : '#22c55e')) : '#e2e8f0' }}></div>
              <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strength >= 2 ? (strength === 2 ? '#eab308' : '#22c55e') : '#e2e8f0' }}></div>
              <div style={{ flex: 1, borderRadius: '2px', backgroundColor: strength >= 3 ? '#22c55e' : '#e2e8f0' }}></div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
              {strength === 0 && ' '}
              {strength === 1 && 'Débil'}
              {strength === 2 && 'Media'}
              {strength === 3 && 'Fuerte'}
            </div>
          </div>

          <div className="corp-form-group">
            <label className="corp-label">Confirmar Nueva Contraseña</label>
            <div className="corp-input-wrapper">
              <div className="corp-input-icon"><IconLock /></div>
              <input 
                type={showNew ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword} 
                onChange={handleChange} 
                className="corp-input with-icon"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="corp-btn corp-btn-primary" 
            disabled={loading} 
            style={{ marginTop: '24px' }}
          >
            {loading ? 'Actualizando...' : 'Cambiar Contraseña y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
