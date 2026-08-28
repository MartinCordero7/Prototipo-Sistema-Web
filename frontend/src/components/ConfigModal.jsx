import React, { useState, useEffect } from 'react';
import { IconSettings, IconX, IconLock } from './Icons';

const ConfigModal = ({ isOpen, onClose, userData, setUserData, setCustomAlert }) => {
  const [configData, setConfigData] = useState({
    newEmail: '',
    newPassword: '',
    currentPassword: ''
  });
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfigData({ newEmail: '', newPassword: '', currentPassword: '' });
      setConfigError('');
      setConfigSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfigChange = (e) => {
    setConfigData({
      ...configData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setConfigError('');
    setConfigSuccess('');

    if (!configData.currentPassword) {
      setConfigError('Debe ingresar su contraseña actual por seguridad.');
      return;
    }

    setConfigLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          username: userData.username,
          currentPassword: configData.currentPassword,
          newEmail: configData.newEmail,
          newPassword: configData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        if (setCustomAlert) {
          setCustomAlert({ show: true, type: 'success', title: '¡Actualizado!', message: data.message });
        } else {
          setConfigSuccess(data.message);
        }
        
        // Update local user data
        const updatedUser = { ...userData, correo: data.updatedData.correo };
        if (setUserData) setUserData(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        setConfigData({ newEmail: '', newPassword: '', currentPassword: '' });
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        if (setCustomAlert) {
          setCustomAlert({ show: true, type: 'error', title: 'Error al Actualizar', message: data.message || 'Error al actualizar.' });
        } else {
          setConfigError(data.message || 'Error al actualizar.');
        }
      }
    } catch (err) {
      console.error(err);
      if (setCustomAlert) {
        setCustomAlert({ show: true, type: 'error', title: 'Error de Conexión', message: 'Error de conexión con el servidor.' });
      } else {
        setConfigError('Error de conexión con el servidor.');
      }
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <div className="corp-modal-overlay" style={{ zIndex: 1000 }}>
      <div className="corp-modal-card">
        <div className="corp-modal-header">
          <h3 className="corp-modal-title">
            <IconSettings /> Actualizar Datos
          </h3>
          <button onClick={onClose} className="corp-modal-close">
            <IconX />
          </button>
        </div>

        <div className="corp-modal-body">
          {userData?.correo && (
            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '24px', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px' }}>
              <strong>Correo actual registrado:</strong><br/> {userData.correo}
            </div>
          )}

          <form id="form-config" onSubmit={handleUpdateProfile}>
            <div className="corp-form-group">
              <label className="corp-label">Nuevo Correo Electrónico (opcional)</label>
              <input 
                type="email" 
                name="newEmail"
                value={configData.newEmail}
                onChange={handleConfigChange}
                className="corp-input"
                placeholder="ej. nuevo@empresa.com"
              />
            </div>

            <div className="corp-form-group">
              <label className="corp-label">Nueva Contraseña (opcional)</label>
              <input 
                type="password" 
                name="newPassword"
                value={configData.newPassword}
                onChange={handleConfigChange}
                className="corp-input"
                placeholder="Dejar en blanco para no cambiar"
              />
            </div>

            <hr style={{ margin: '24px 0', borderTop: '1px solid #e2e8f0' }} />

            <div className="corp-form-group" style={{ marginBottom: 0 }}>
              <label className="corp-label" style={{ color: '#b91c1c' }}>Contraseña Actual (Obligatoria)</label>
              <div className="corp-input-wrapper">
                <div className="corp-input-icon"><IconLock /></div>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={configData.currentPassword}
                  onChange={handleConfigChange}
                  className="corp-input with-icon"
                  placeholder="Ingrese su clave por seguridad"
                  required
                />
              </div>
            </div>

            {configError && <span style={{ color: '#dc2626', fontSize: '13px', display: 'block', marginTop: '16px', textAlign: 'center', fontWeight: '500' }}>{configError}</span>}
            {configSuccess && <span style={{ display: 'block', marginTop: '16px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>{configSuccess}</span>}
          </form>
        </div>

        <div className="corp-modal-footer">
          <button 
            type="button" 
            onClick={onClose}
            className="corp-btn corp-btn-outline"
            style={{ width: 'auto' }}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="form-config"
            className="corp-btn corp-btn-primary"
            style={{ width: 'auto' }}
            disabled={configLoading}
          >
            {configLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
