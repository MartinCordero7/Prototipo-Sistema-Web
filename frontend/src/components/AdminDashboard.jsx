import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('bloqueos'); // 'bloqueos', 'horarios', 'alertas'
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [alertasHistory, setAlertasHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [horaCierre, setHoraCierre] = useState(12);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si es administrador
    const isAuth = localStorage.getItem('isAuthenticated');
    const userStr = localStorage.getItem('userData');
    
    if (!isAuth || !userStr) {
      navigate('/');
      return;
    }
    
    const user = JSON.parse(userStr);
    if (user.comercializadora !== 'ADMINISTRADOR') {
      navigate('/formulario');
      return;
    }

    fetchBlockedUsers();
    fetchConfig();
    fetchAlertasHistory();
  }, [navigate]);

  const fetchAlertasHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/alertas');
      const data = await response.json();
      if (data.success) {
        setAlertasHistory(data.data);
      }
    } catch (err) {
      console.error('Error obteniendo historial de alertas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/config');
      const data = await response.json();
      if (data.success) {
        setHoraCierre(data.horaCierre);
      }
    } catch (err) {
      console.error('Error obteniendo config:', err);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      setUpdatingConfig(true);
      setConfigSuccess('');
      setError('');
      
      const response = await fetch('http://localhost:3000/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horaCierre: parseInt(horaCierre, 10) })
      });
      const data = await response.json();
      
      if (data.success) {
        setConfigSuccess(data.message);
        setTimeout(() => setConfigSuccess(''), 3000);
      } else {
        setError(data.message || 'Error actualizando horario.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/blocked-users');
      const data = await response.json();
      
      if (data.success) {
        setBlockedUsers(data.data);
      } else {
        setError(data.message || 'Error al obtener usuarios bloqueados.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const confirmUnblock = async () => {
    if (!unlockTarget) return;

    try {
      const response = await fetch('http://localhost:3000/api/admin/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: unlockTarget })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(data.message);
        setUnlockTarget(null);
        fetchBlockedUsers();
      } else {
        setError(data.message || 'Error al desbloquear usuario.');
        setUnlockTarget(null);
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
      setUnlockTarget(null);
    }
  };

  const renderScheduleConfig = () => (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <h2 className="form-title" style={{ color: 'var(--primary-color)' }}>Configuración Global del Sistema</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Ajusta los parámetros operativos generales de la plataforma.</p>
      
      {error && activeTab === 'horarios' && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⏱️ Horario Límite de Ingreso
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Define la hora máxima (en formato 24h) hasta la cual las estaciones de servicio pueden registrar su información diaria. 
          Ejemplo: Si estableces <b>12</b>, el sistema bloqueará el acceso a partir de las 12:00 PM hasta el día siguiente.
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Hora de cierre:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="number" 
                min="0" 
                max="23" 
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', width: '100px', fontSize: '1.2rem', textAlign: 'center', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <span style={{ color: '#4b5563', fontSize: '1.2rem', fontWeight: 'bold' }}>: 00 hrs</span>
            </div>
          </div>
          <button 
            onClick={handleUpdateConfig}
            disabled={updatingConfig}
            style={{
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              border: 'none',
              padding: '0.9rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              height: 'fit-content',
              transition: 'background-color 0.2s, transform 0.1s',
              boxShadow: '0 4px 6px rgba(11, 40, 93, 0.2)'
            }}
            onMouseOver={(e) => !updatingConfig && (e.target.style.backgroundColor = '#0f2042')}
            onMouseOut={(e) => !updatingConfig && (e.target.style.backgroundColor = 'var(--accent-color)')}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            {updatingConfig ? 'Guardando...' : 'Guardar Horario'}
          </button>
        </div>
        {configSuccess && <div style={{ color: '#10b981', marginTop: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✓ {configSuccess}</div>}
      </div>
    </div>
  );

  const renderBlockedUsers = () => (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="form-title" style={{ color: 'var(--danger-color)', margin: 0 }}>Cuentas Bloqueadas por Seguridad</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Monitorea y gestiona las estaciones bloqueadas por múltiples intentos fallidos.</p>
        </div>
        <button 
          onClick={fetchBlockedUsers} 
          style={{
            backgroundColor: 'white',
            color: 'var(--accent-color)',
            border: '1px solid var(--accent-color)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--accent-color)'; e.target.style.color = 'white'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.color = 'var(--accent-color)'; }}
        >
          ↻ Actualizar Lista
        </button>
      </div>

      {error && activeTab === 'bloqueos' && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando datos...</div>
      ) : blockedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Sistema Seguro</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay usuarios bloqueados en este momento. Todas las estaciones operan con normalidad.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#4b5563', fontWeight: '600' }}>Comercializadora</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#4b5563', fontWeight: '600' }}>Usuario / Estación</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#4b5563', fontWeight: '600' }}>Bloqueado Hasta</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: '#4b5563', fontWeight: '600' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {blockedUsers.map((user) => (
                  <tr key={user.username} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.1s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)' }}>{user.comercializadora}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{user.username}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.nombre_estacion}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--danger-color)', fontWeight: '600', fontSize: '0.95rem' }}>
                      {new Date(user.bloqueado_hasta).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => setUnlockTarget(user.username)}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'background-color 0.2s, transform 0.1s',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlertasHistory = () => (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="form-title" style={{ color: 'var(--primary-color)', margin: 0 }}>Historial de Alertas de Incumplimiento</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Registro automático de los correos enviados a las estaciones que no declararon su stock a tiempo.</p>
        </div>
        <button 
          onClick={fetchAlertasHistory} 
          style={{
            backgroundColor: 'white',
            color: 'var(--accent-color)',
            border: '1px solid var(--accent-color)',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--accent-color)'; e.target.style.color = 'white'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.color = 'var(--accent-color)'; }}
        >
          ↻ Actualizar Historial
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Cargando historial...</div>
      ) : alertasHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Bandeja Limpia</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Aún no se han enviado alertas automáticas de incumplimiento.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#4b5563', fontWeight: '600' }}>Fecha y Hora</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#4b5563', fontWeight: '600' }}>Centro de Distribución</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#4b5563', fontWeight: '600' }}>Correo Destinatario</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: '#4b5563', fontWeight: '600' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {alertasHistory.map((alerta) => (
                  <tr key={alerta.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.1s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {new Date(alerta.fecha_emision).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                      {alerta.nombre_centro}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {alerta.correo_destinatario}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor: alerta.estado === 'Enviado' ? '#d1fae5' : '#fee2e2',
                        color: alerta.estado === 'Enviado' ? '#065f46' : '#991b1b'
                      }}>
                        {alerta.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', margin: '-2rem' }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .sidebar-btn {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            text-align: left;
            font-size: 1rem;
            font-weight: 600;
            color: #9ca3af;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 4px solid transparent;
          }
          .sidebar-btn:hover {
            background-color: var(--accent-hover);
            color: white;
          }
          .sidebar-btn.active {
            background-color: var(--accent-hover);
            color: white;
            border-left-color: white;
          }
        `}
      </style>

      {/* Sidebar (Menú Lateral) */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: 'var(--accent-color)', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--accent-color)' }}>
            A
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>Admin Portal</h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>Control de Seguridad</p>
        </div>

        <nav style={{ flex: 1, paddingTop: '1.5rem' }}>
          <button 
            className={`sidebar-btn ${activeTab === 'bloqueos' ? 'active' : ''}`}
            onClick={() => setActiveTab('bloqueos')}
          >
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            Cuentas Bloqueadas
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'horarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('horarios')}
          >
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
            Horarios del Sistema
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'alertas' ? 'active' : ''}`}
            onClick={() => setActiveTab('alertas')}
          >
            <span style={{ fontSize: '1.2rem' }}>✉️</span>
            Historial de Alertas
          </button>
        </nav>
      </aside>

      {/* Main Content (Área Principal) */}
      <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        {activeTab === 'bloqueos' && renderBlockedUsers()}
        {activeTab === 'horarios' && renderScheduleConfig()}
        {activeTab === 'alertas' && renderAlertasHistory()}
      </main>

      {/* Modal de Confirmación */}
      {unlockTarget && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="form-card modal-content" style={{ textAlign: 'center', padding: '2.5rem', borderRadius: '16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.4rem' }}>Confirmar Acción</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              ¿Estás seguro de que deseas desbloquear la cuenta <strong>{unlockTarget}</strong> y resetear sus intentos fallidos?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button 
                onClick={() => setUnlockTarget(null)}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmUnblock}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
                }}
              >
                Sí, Desbloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {successMessage && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="form-card modal-content" style={{ textAlign: 'center', padding: '2.5rem', borderRadius: '16px' }}>
            <div style={{ fontSize: '3.5rem', color: '#10b981', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '1.4rem' }}>Operación Exitosa</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage('')}
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(11, 40, 93, 0.2)'
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
