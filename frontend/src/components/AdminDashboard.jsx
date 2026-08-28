import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Joyride, STATUS } from 'react-joyride';

import {
  IconShield,
  IconClock,
  IconMail,
  IconRefresh,
  IconCheck,
  IconWarn,
  IconUnlock,
  IconClose,
  IconInbox,
  IconBuilding,
  IconUser,
  IconSettings,
  IconInfo
} from './Icons';

import ConfigModal from './ConfigModal';

const TABS = [
  { id: 'horarios', label: 'Horarios del Sistema', icon: <IconClock />, stepClass: 'step-nav-horarios' },
  { id: 'bloqueos', label: 'Cuentas Bloqueadas',   icon: <IconShield />, stepClass: 'step-nav-bloqueos' },
  { id: 'alertas',  label: 'Historial de Alertas', icon: <IconMail />, stepClass: 'step-nav-alertas' },
  { id: 'auditores',label: 'Gestión de Auditores', icon: <IconBuilding />, stepClass: 'step-nav-auditores' },
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
  
  // Perfil / Config
  const [userData, setUserData] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customAlert, setCustomAlert] = useState({ show: false, type: 'info', title: '', message: '' });
  
  // Auditoria
  const [comercializadoraAuditor, setComercializadoraAuditor] = useState('');
  const [comercializadorasList, setComercializadorasList] = useState([]);
  const [delegados, setDelegados] = useState([]);
  const [loadingAuditores, setLoadingAuditores] = useState(false);
  
  const [editingDelegado, setEditingDelegado] = useState(null);
  const [editForm, setEditForm] = useState({ nombre_delegado: '', username: '', correo: '', oficio: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const navigate = useNavigate();

  // Joyride state
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const tourSteps = [
    {
      target: '.step-nav-horarios',
      content: 'En esta sección podrás configurar la hora máxima en la que las estaciones pueden enviar reportes.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-nav-bloqueos',
      content: 'Aquí verás y podrás desbloquear las estaciones que hayan superado los intentos de acceso fallidos.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-nav-alertas',
      content: 'Finalmente, aquí puedes monitorear los correos automáticos enviados a los infractores.',
      skipBeacon: true,
      closeButtonAction: 'skip',
    },
    {
      target: '.step-nav-auditores',
      content: 'En esta sección puedes asignar el rol de Auditor a una estación registrada de cada comercializadora.',
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

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    const userStr = localStorage.getItem('userData');
    if (!isAuth || !userStr) { navigate('/'); return; }
    const user = JSON.parse(userStr);
    if (user.comercializadora !== 'ADMINISTRADOR') { navigate('/formulario'); return; }
    setUserData(user);
    fetchBlockedUsers(); fetchConfig(); fetchAlertasHistory(); fetchComercializadorasList();
  }, [navigate]);

  const fetchComercializadorasList = async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/comercializadoras`);
      const d = await r.json();
      if (d.success) setComercializadorasList(d.data);
    } catch (e) { console.error('Error al cargar comercializadoras', e); }
  };

  const fetchAlertasHistory = async () => {
    try { setLoading(true); const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/alertas`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); const d = await r.json(); if (d.success) setAlertasHistory(d.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const fetchConfig = async () => {
    try { const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); const d = await r.json(); if (d.success) setHoraCierre(d.horaCierre); }
    catch (e) { console.error(e); }
  };
  const handleUpdateConfig = async () => {
    try {
      setUpdatingConfig(true); setConfigSuccess(''); setError('');
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ horaCierre: parseInt(horaCierre, 10) }) });
      const d = await r.json();
      if (d.success) { setConfigSuccess(d.message); setTimeout(() => setConfigSuccess(''), 3000); } else setError(d.message || 'Error actualizando horario.');
    } catch (e) { setError('Error al conectar.'); } finally { setUpdatingConfig(false); }
  };
  const fetchBlockedUsers = async () => {
    try { setLoading(true); const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/blocked-users`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); const d = await r.json(); if (d.success) setBlockedUsers(d.data); else setError(d.message || 'Error.'); }
    catch (e) { setError('Error al conectar.'); } finally { setLoading(false); }
  };
  const confirmUnblock = async () => {
    if (!unlockTarget) return;
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/unblock`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ username: unlockTarget }) });
      const d = await r.json();
      if (d.success) { setSuccessMessage(d.message); setUnlockTarget(null); fetchBlockedUsers(); }
      else { setError(d.message || 'Error.'); setUnlockTarget(null); }
    } catch (e) { setError('Error al conectar.'); setUnlockTarget(null); }
  };

  const fetchDelegados = async (comercializadora) => {
    if (!comercializadora) {
      setDelegados([]);
      return;
    }
    try {
      setLoadingAuditores(true);
      setError('');
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/delegados?comercializadora=${comercializadora}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const d = await r.json();
      if (d.success) setDelegados(d.data);
      else setError(d.message || 'Error obteniendo delegados.');
    } catch (e) {
      setError('Error de conexión al cargar delegados.');
    } finally {
      setLoadingAuditores(false);
    }
  };

  const handleComercializadoraChange = (e) => {
    const val = e.target.value;
    setComercializadoraAuditor(val);
    fetchDelegados(val);
    setEditingDelegado(null);
  };

  const handleSaveDelegado = async (id) => {
    try {
      if (!editForm.nombre_delegado || !editForm.correo || !editForm.oficio || !editForm.username) {
        setError('Todos los campos son requeridos para el delegado.');
        return;
      }
      setLoadingAuditores(true);
      const payload = { ...editForm, comercializadora: comercializadoraAuditor };
      if (id !== 'new') payload.id = id;

      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/delegados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (d.success) {
        setSuccessMessage(d.message);
        setEditingDelegado(null);
        fetchDelegados(comercializadoraAuditor);
      } else {
        setError(d.message || 'Error al guardar delegado.');
      }
    } catch (e) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoadingAuditores(false);
    }
  };

  const handleDeleteDelegado = async (id) => {
    setConfirmDeleteId(null);
    try {
      setLoadingAuditores(true);
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/delegados/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const d = await r.json();
      if (d.success) {
        setSuccessMessage(d.message);
        fetchDelegados(comercializadoraAuditor);
      } else {
        setError(d.message || 'Error al eliminar.');
      }
    } catch (e) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoadingAuditores(false);
    }
  };

  const handleSendEmailDelegado = async (id) => {
    try {
      setLoadingAuditores(true);
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/delegados/enviar-correo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ id })
      });
      const d = await r.json();
      if (d.success) {
        setSuccessMessage(d.message);
      } else {
        setError(d.message || 'Error al enviar correo.');
      }
    } catch (e) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoadingAuditores(false);
    }
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
  // RENDER: Gestión de Auditores
  // ──────────────────────────────────────────────────────────────────────────────
  const renderGestionesAuditores = () => (
    <div style={{ animation: 'adminFadeIn 0.25s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Gestión de Auditores</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            Selecciona una comercializadora y designa qué estación de servicio actuará como auditora.
          </p>
        </div>
      </div>

      {error && activeTab === 'auditores' && (
        <div className="corp-alert corp-alert-error" style={{ marginBottom: '24px' }}><IconWarn /> {error}</div>
      )}

      <div style={{ marginBottom: '24px', backgroundColor: 'white', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <label className="corp-label" style={{ display: 'block', marginBottom: '8px' }}>Filtrar por Comercializadora</label>
        <select 
          className="corp-select" 
          value={comercializadoraAuditor} 
          onChange={handleComercializadoraChange}
          style={{ maxWidth: '400px' }}
        >
          <option value="">-- Seleccione Comercializadora --</option>
          {comercializadorasList.map(c => (
            <option key={c} value={c.toUpperCase()}>{c.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {!comercializadoraAuditor ? (
        <div style={{ textAlign: 'center', padding: '60px 40px', backgroundColor: 'white', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><IconBuilding /></div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Seleccione una red</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Elija una comercializadora para gestionar sus delegados.
          </p>
        </div>
      ) : loadingAuditores && delegados.length === 0 && editingDelegado !== 'new' ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          Cargando delegados...
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Delegados (Auditores)</h3>
            <button 
              onClick={() => { setEditingDelegado('new'); setEditForm({ nombre_delegado: '', username: '', correo: '', oficio: '' }); }} 
              className="corp-btn corp-btn-primary" 
              style={{ padding: '8px 16px', height: 'auto', fontSize: '13px', width: 'auto' }}
              disabled={editingDelegado === 'new'}
            >
              + Añadir Delegado
            </button>
          </div>
          <div className="corp-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 24px', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre del Delegado</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Usuario</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correo</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', color: '#475569', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Oficio</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right', color: '#475569', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {editingDelegado === 'new' && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <input type="text" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} placeholder="Nombre" value={editForm.nombre_delegado} onChange={e => setEditForm({...editForm, nombre_delegado: e.target.value})} />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <input type="text" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} placeholder="Usuario" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <input type="email" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} placeholder="Correo" value={editForm.correo} onChange={e => setEditForm({...editForm, correo: e.target.value})} />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <input type="text" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} placeholder="Oficio Nro." value={editForm.oficio} onChange={e => setEditForm({...editForm, oficio: e.target.value})} />
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingDelegado(null)} className="corp-btn corp-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}>Cancelar</button>
                      <button onClick={() => handleSaveDelegado('new')} className="corp-btn corp-btn-primary" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', backgroundColor: '#16a34a' }}>Guardar</button>
                    </td>
                  </tr>
                )}
                
                {delegados.length === 0 && editingDelegado !== 'new' ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay delegados registrados.</td>
                  </tr>
                ) : delegados.map((del) => (
                  <tr key={del.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    
                    {editingDelegado === del.id ? (
                      <>
                        <td style={{ padding: '16px 24px' }}>
                          <input type="text" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} placeholder="Nombre" value={editForm.nombre_delegado} onChange={e => setEditForm({...editForm, nombre_delegado: e.target.value})} />
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <input type="text" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} placeholder="Usuario" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <input type="email" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} value={editForm.correo} onChange={e => setEditForm({...editForm, correo: e.target.value})} />
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <input type="text" className="corp-input" style={{ padding: '6px 10px', fontSize: '13px' }} value={editForm.oficio} onChange={e => setEditForm({...editForm, oficio: e.target.value})} />
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingDelegado(null)} className="corp-btn corp-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}>Cancelar</button>
                          <button onClick={() => handleSaveDelegado(del.id)} className="corp-btn corp-btn-primary" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', backgroundColor: '#16a34a' }}>Guardar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>{del.nombre_delegado}</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{del.username || '-'}</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{del.correo}</td>
                        <td style={{ padding: '16px 24px', color: '#475569' }}>{del.oficio}</td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => { setEditingDelegado(del.id); setEditForm(del); }}
                              className="corp-btn corp-btn-outline"
                              style={{ padding: '4px 10px', fontSize: '11px', width: 'auto' }}
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleSendEmailDelegado(del.id)}
                              className="corp-btn corp-btn-outline"
                              style={{ padding: '4px 10px', fontSize: '11px', width: 'auto', color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
                            >
                              <IconMail /> Enviar Correo
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(del.id)}
                              className="corp-btn corp-btn-outline"
                              style={{ padding: '4px 10px', fontSize: '11px', width: 'auto', color: '#dc2626', borderColor: '#fecaca', backgroundColor: '#fef2f2' }}
                            >
                              <IconClose />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
            <button key={tab.id} className={`adm-nav-btn ${tab.stepClass} ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 16px 0' }} />
          <p style={{ margin: '0 0 8px 0', padding: '0 4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Cuenta</p>
          <button 
            className="adm-nav-btn" 
            onClick={() => setShowConfigModal(true)}
          >
            <IconSettings /> Configuración
          </button>
        </div>
      </aside>

      {/* ── Área principal ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '48px 56px', boxSizing: 'border-box' }}>
        {activeTab === 'horarios' && renderScheduleConfig()}
        {activeTab === 'bloqueos' && renderBlockedUsers()}
        {activeTab === 'alertas'  && renderAlertasHistory()}
        {activeTab === 'auditores' && renderGestionesAuditores()}

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

        {/* Modal: Confirmar Eliminar Delegado */}
        {confirmDeleteId && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title"><span style={{ color: '#dc2626' }}><IconWarn /></span> Eliminar Delegado</h3>
                <button onClick={() => setConfirmDeleteId(null)} className="corp-modal-close"><IconClose /></button>
              </div>
              <div className="corp-modal-body">
                <p style={{ margin: 0 }}>¿Está seguro de eliminar este delegado? Se borrará también su acceso al sistema de forma permanente.</p>
              </div>
              <div className="corp-modal-footer">
                <button onClick={() => setConfirmDeleteId(null)} className="corp-btn corp-btn-outline" style={{ width: 'auto' }}>Cancelar</button>
                <button onClick={() => handleDeleteDelegado(confirmDeleteId)} className="corp-btn corp-btn-primary" style={{ width: 'auto', backgroundColor: '#dc2626' }}>Eliminar</button>
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
          <IconInfo /> ¿Necesitas ayuda?
        </button>
        <ConfigModal 
          isOpen={showConfigModal} 
          onClose={() => setShowConfigModal(false)}
          userData={userData}
          setUserData={setUserData}
          setCustomAlert={setCustomAlert}
        />

        {/* MODAL CUSTOM ALERT (Feedback de configuración) */}
        {customAlert.show && (
          <div className="corp-modal-overlay">
            <div className="corp-modal-card">
              <div className="corp-modal-header">
                <h3 className="corp-modal-title">
                  {customAlert.type === 'error' && <span style={{ color: '#dc2626' }}><IconWarn /></span>}
                  {customAlert.type === 'success' && <span style={{ color: '#16a34a' }}><IconCheck /></span>}
                  {customAlert.title}
                </h3>
                <button onClick={() => setCustomAlert({ show: false, type: 'info', title: '', message: '' })} className="corp-modal-close"><IconClose /></button>
              </div>
              <div className="corp-modal-body">
                <p style={{ margin: 0 }}>{customAlert.message}</p>
              </div>
              <div className="corp-modal-footer">
                <button 
                  onClick={() => setCustomAlert({ show: false, type: 'info', title: '', message: '' })} 
                  className="corp-btn corp-btn-primary" 
                  style={{ width: 'auto', backgroundColor: customAlert.type === 'error' ? '#dc2626' : '#16a34a' }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
