import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  IconShield,
  IconClock,
  IconMail,
  IconRefresh,
  IconCheck,
  IconWarn,
  IconUnlock,
  IconClose,
  IconInbox
} from './Icons';

const TABS = [
  { id: 'horarios', label: 'Horarios del Sistema', icon: <IconClock /> },
  { id: 'bloqueos', label: 'Cuentas Bloqueadas',   icon: <IconShield /> },
  { id: 'alertas',  label: 'Historial de Alertas', icon: <IconMail /> },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab]         = useState('horarios');
  const [blockedUsers, setBlockedUsers]   = useState([]);
  const [alertasHistory, setAlertasHistory] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [horaCierre, setHoraCierre]       = useState(12);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const [unlockTarget, setUnlockTarget]   = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    const userStr = localStorage.getItem('userData');
    if (!isAuth || !userStr) { navigate('/'); return; }
    const user = JSON.parse(userStr);
    if (user.comercializadora !== 'ADMINISTRADOR') { navigate('/formulario'); return; }
    fetchBlockedUsers(); fetchConfig(); fetchAlertasHistory();
  }, [navigate]);

  const fetchAlertasHistory = async () => {
    try { setLoading(true); const r = await fetch('http://localhost:3000/api/admin/alertas'); const d = await r.json(); if (d.success) setAlertasHistory(d.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchConfig = async () => {
    try { const r = await fetch('http://localhost:3000/api/admin/config'); const d = await r.json(); if (d.success) setHoraCierre(d.horaCierre); }
    catch (e) { console.error(e); }
  };
  const handleUpdateConfig = async () => {
    try {
      setUpdatingConfig(true); setConfigSuccess(''); setError('');
      const r = await fetch('http://localhost:3000/api/admin/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ horaCierre: parseInt(horaCierre, 10) }) });
      const d = await r.json();
      if (d.success) { setConfigSuccess(d.message); setTimeout(() => setConfigSuccess(''), 3000); } else setError(d.message || 'Error actualizando horario.');
    } catch (e) { setError('Error al conectar.'); } finally { setUpdatingConfig(false); }
  };
  const fetchBlockedUsers = async () => {
    try { setLoading(true); const r = await fetch('http://localhost:3000/api/admin/blocked-users'); const d = await r.json(); if (d.success) setBlockedUsers(d.data); else setError(d.message || 'Error.'); }
    catch (e) { setError('Error al conectar.'); } finally { setLoading(false); }
  };
  const confirmUnblock = async () => {
    if (!unlockTarget) return;
    try {
      const r = await fetch('http://localhost:3000/api/admin/unblock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: unlockTarget }) });
      const d = await r.json();
      if (d.success) { setSuccessMessage(d.message); setUnlockTarget(null); fetchBlockedUsers(); }
      else { setError(d.message || 'Error.'); setUnlockTarget(null); }
    } catch (e) { setError('Error al conectar.'); setUnlockTarget(null); }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Horarios
  // ──────────────────────────────────────────────────────────────────────────────
  const renderScheduleConfig = () => (
    <div style={{ animation: 'adminFadeIn 0.25s ease-out' }}>
      {/* Page title */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Horarios del Sistema</h2>
        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b' }}>
          Configura el horario límite diario para el ingreso de información de las estaciones.
        </p>
      </div>

      {error && activeTab === 'horarios' && (
        <div className="corp-alert corp-alert-error" style={{ marginBottom: '24px' }}><IconWarn /> {error}</div>
      )}

      {/* Main config card — unificada */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '36px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
          
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Configuración de Cierre</h3>
            </div>
            <p style={{ margin: '0', fontSize: '14px', color: '#64748b', lineHeight: 1.6, maxWidth: '500px' }}>
              Define la hora máxima (formato 24h) hasta la cual las estaciones de servicio pueden
              registrar su información diaria. Pasada esta hora, el sistema se bloqueará
              automáticamente y se enviará una alerta a los infractores.
            </p>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
             <div>
               <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                 Hora Límite
               </label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <input
                   type="number" min="0" max="23" value={horaCierre}
                   onChange={(e) => setHoraCierre(e.target.value)}
                   className="corp-input"
                   style={{ width: '90px', textAlign: 'center', fontSize: '24px', fontWeight: '800', height: '52px', letterSpacing: '-0.02em', backgroundColor: 'white' }}
                 />
                 <span style={{ fontSize: '20px', color: '#94a3b8', fontWeight: '400' }}>: 00</span>
                 <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>hrs</span>
               </div>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '160px' }}>
               <button onClick={handleUpdateConfig} disabled={updatingConfig}
                 className="corp-btn corp-btn-primary" style={{ height: '48px', padding: '0 24px', fontSize: '14px', width: '100%' }}>
                 {updatingConfig ? 'Guardando...' : 'Guardar Horario'}
               </button>
               {configSuccess && (
                 <div style={{ color: '#16a34a', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
                   <IconCheck /> Guardado con éxito
                 </div>
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Cuentas bloqueadas
  // ──────────────────────────────────────────────────────────────────────────────
  const renderBlockedUsers = () => (
    <div style={{ animation: 'adminFadeIn 0.25s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Cuentas Bloqueadas</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            Gestiona las estaciones bloqueadas por múltiples intentos fallidos de acceso.
          </p>
        </div>
        <button onClick={fetchBlockedUsers} className="corp-btn corp-btn-outline" style={{ width: 'auto', height: '40px', padding: '0 20px', fontSize: '13px', gap: '6px', flexShrink: 0 }}>
          <IconRefresh /> Actualizar
        </button>
      </div>

      {error && activeTab === 'bloqueos' && (
        <div className="corp-alert corp-alert-error" style={{ marginBottom: '24px' }}><IconWarn /> {error}</div>
      )}

      {loading ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          Cargando datos...
        </div>
      ) : blockedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', backgroundColor: 'white', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Sistema Seguro</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '340px', marginInline: 'auto', lineHeight: 1.6 }}>
            No hay usuarios bloqueados en este momento. Todas las estaciones operan con normalidad.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div className="corp-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Comercializadora', 'Usuario / Estación', 'Bloqueado Hasta', 'Acción'].map((h, i) => (
                    <th key={h} style={{ padding: '14px 24px', textAlign: i === 3 ? 'right' : 'left', color: '#475569', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockedUsers.map((user) => (
                  <tr key={user.username} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px', color: '#1e293b', fontWeight: '500' }}>{user.comercializadora}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{user.username}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{user.nombre_estacion}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                        {new Date(user.bloqueado_hasta).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button onClick={() => setUnlockTarget(user.username)}
                        style={{ backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <IconUnlock /> Desbloquear
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

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER: Historial alertas
  // ──────────────────────────────────────────────────────────────────────────────
  const renderAlertasHistory = () => (
    <div style={{ animation: 'adminFadeIn 0.25s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Historial de Alertas</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            Registro de correos automáticos enviados a estaciones que no declararon su stock a tiempo.
          </p>
        </div>
        <button onClick={fetchAlertasHistory} className="corp-btn corp-btn-outline" style={{ width: 'auto', height: '40px', padding: '0 20px', fontSize: '13px', gap: '6px', flexShrink: 0 }}>
          <IconRefresh /> Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          Cargando historial...
        </div>
      ) : alertasHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', backgroundColor: 'white', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><IconInbox /></div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Bandeja Limpia</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '320px', marginInline: 'auto', lineHeight: 1.6 }}>
            Aún no se han enviado alertas automáticas de incumplimiento.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div className="corp-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Fecha y Hora', 'Centro de Distribución', 'Correo Destinatario', 'Estado'].map((h, i) => (
                    <th key={h} style={{ padding: '14px 24px', textAlign: i === 3 ? 'center' : 'left', color: '#475569', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alertasHistory.map((alerta) => (
                  <tr key={alerta.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px', color: '#1e293b', fontWeight: '500' }}>{new Date(alerta.fecha_emision).toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '600' }}>{alerta.nombre_centro}</td>
                    <td style={{ padding: '16px 24px', color: '#64748b' }}>{alerta.correo_destinatario}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: alerta.estado === 'Enviado' ? '#f0fdf4' : '#fef2f2', color: alerta.estado === 'Enviado' ? '#16a34a' : '#dc2626', border: `1px solid ${alerta.estado === 'Enviado' ? '#bbf7d0' : '#fecaca'}` }}>
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

  // ──────────────────────────────────────────────────────────────────────────────
  // LAYOUT ROOT
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="corp-responsive-layout" style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
      <style>{`
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .adm-nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          border: none;
          border-radius: 7px;
          background: none;
          text-align: left;
          font-size: 13.5px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .adm-nav-btn:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .adm-nav-btn.active {
          background-color: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }
        .adm-nav-btn.active svg { stroke: #2563eb; }
      `}</style>

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside style={{
        width: '256px',
        minWidth: '256px',
        backgroundColor: 'white',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 16px',
        boxSizing: 'border-box',
        alignSelf: 'stretch',  /* se extiende a la altura del contenido principal */
      }}>
        {/* Brand */}
        <div style={{ marginBottom: '32px', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#1f315c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Panel Admin</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Control del sistema</p>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 16px 0' }} />

        <p style={{ margin: '0 0 8px 0', padding: '0 4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Gestión</p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {TABS.map(tab => (
            <button key={tab.id} className={`adm-nav-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Área principal ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '48px 56px', boxSizing: 'border-box' }}>
        {activeTab === 'horarios' && renderScheduleConfig()}
        {activeTab === 'bloqueos' && renderBlockedUsers()}
        {activeTab === 'alertas'  && renderAlertasHistory()}

        {/* Modal: Confirmar Desbloqueo */}
        {unlockTarget && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title"><span style={{ color: '#d97706' }}><IconWarn /></span> Confirmar Desbloqueo</h3>
                <button onClick={() => setUnlockTarget(null)} className="corp-modal-close"><IconClose /></button>
              </div>
              <div className="corp-modal-body">
                <p style={{ margin: 0 }}>¿Confirmas que deseas desbloquear la cuenta <strong>{unlockTarget}</strong> y resetear sus intentos fallidos?</p>
              </div>
              <div className="corp-modal-footer">
                <button onClick={() => setUnlockTarget(null)} className="corp-btn corp-btn-outline" style={{ width: 'auto' }}>Cancelar</button>
                <button onClick={confirmUnblock} className="corp-btn corp-btn-primary" style={{ width: 'auto', backgroundColor: '#dc2626' }}>Sí, Desbloquear</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Éxito */}
        {successMessage && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title"><span style={{ color: '#16a34a' }}><IconCheck /></span> Operación Exitosa</h3>
                <button onClick={() => setSuccessMessage('')} className="corp-modal-close"><IconClose /></button>
              </div>
              <div className="corp-modal-body">
                <p style={{ margin: 0 }}>{successMessage}</p>
              </div>
              <div className="corp-modal-footer">
                <button onClick={() => setSuccessMessage('')} className="corp-btn corp-btn-primary" style={{ width: 'auto' }}>Aceptar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
