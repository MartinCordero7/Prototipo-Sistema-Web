import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../Images/Logo ARCH Jun 2026.png';

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
    <div className="form-card form-card-large" style={{ maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="form-title" style={{ marginBottom: '0.5rem' }}>Actualización Requerida</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Por motivos de seguridad, debes cambiar tu contraseña predeterminada para 
          <strong style={{ color: 'var(--accent-color)' }}> {userData.nombre_estacion}</strong> antes de continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Contraseña Actual 
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '6px' }}>
              (Asignada por la ARCH)
            </span>
          </label>
          <input 
            type="password" 
            name="oldPassword"
            value={formData.oldPassword} 
            onChange={handleChange} 
            className="form-control"
            required 
          />
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Nueva Contraseña</label>
          <input 
            type="password" 
            name="newPassword"
            value={formData.newPassword} 
            onChange={handleChange} 
            className="form-control"
            required 
          />
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Confirmar Nueva Contraseña</label>
          <input 
            type="password" 
            name="confirmPassword"
            value={formData.confirmPassword} 
            onChange={handleChange} 
            className="form-control"
            required 
          />
        </div>

        {error && <span className="error-text" style={{ display: 'block', marginTop: '1rem' }}>{error}</span>}

        <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '1.5rem' }}>
          {loading ? 'Actualizando...' : 'Cambiar Contraseña y Entrar'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
