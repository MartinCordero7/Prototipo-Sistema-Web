import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuditorDashboard = () => {
  const [estaciones, setEstaciones] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, completados: 0, pendientes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comercializadora, setComercializadora] = useState('');
  const [filtro, setFiltro] = useState('TODOS');
  const navigate = useNavigate();

  useEffect(() => {
    // Validar autenticación y rol
    const isAuth = localStorage.getItem('isAuthenticated');
    const userStr = localStorage.getItem('userData');
    
    if (!isAuth || !userStr) {
      navigate('/');
      return;
    }
    
    const user = JSON.parse(userStr);
    if (user.nombre_estacion !== 'AUDITORIA') {
      navigate('/formulario');
      return;
    }

    setComercializadora(user.comercializadora);
    fetchData(user.comercializadora);
  }, [navigate]);

  const fetchData = async (comercializadoraName) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/auditor/estado-diario?comercializadora=${encodeURIComponent(comercializadoraName)}`);
      const data = await response.json();
      
      if (data.success) {
        setEstaciones(data.data);
        setKpis(data.kpis);
      } else {
        setError(data.message || 'Error al obtener los datos.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '1.2rem', color: 'var(--accent-color)' }}>Cargando panel de auditoría...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '1rem' }}>
      <style>
        {`
          .kpi-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 1.5rem;
            flex: 1;
            min-width: 250px;
          }
          .kpi-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
          }
          .kpi-content h3 {
            margin: 0;
            font-size: 0.9rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .kpi-content .kpi-value {
            margin: 0.2rem 0 0 0;
            font-size: 2rem;
            font-weight: 800;
            color: var(--text-primary);
          }
        `}
      </style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="form-title" style={{ color: 'var(--primary-color)', margin: 0, fontSize: '2rem' }}>
            Panel de Auditoría - <span style={{ color: 'var(--accent-color)' }}>{comercializadora}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            Monitoreo en tiempo real del registro de inventario diario.
          </p>
        </div>
        <button 
          onClick={() => fetchData(comercializadora)}
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(11, 40, 93, 0.2)'
          }}
        >
          Actualizar Datos
        </button>
      </div>

      {error && <div className="error-text" style={{ marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      {/* Sección de KPIs */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold' }}>TOT</div>
          <div className="kpi-content">
            <h3>Total Estaciones</h3>
            <div className="kpi-value">{kpis.total}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold' }}>OK</div>
          <div className="kpi-content">
            <h3>Completadas Hoy</h3>
            <div className="kpi-value" style={{ color: '#10b981' }}>{kpis.completados}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '1.2rem', fontWeight: 'bold' }}>PND</div>
          <div className="kpi-content">
            <h3>Pendientes</h3>
            <div className="kpi-value" style={{ color: '#ef4444' }}>{kpis.pendientes}</div>
          </div>
        </div>
      </div>

      {/* Tabla de Detalle */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Detalle por Estación de Servicio</h3>
          <div>
            <label style={{ marginRight: '0.5rem', fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Filtrar por estado:</label>
            <select 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', color: 'var(--text-primary)' }}
            >
              <option value="TODOS">Todos</option>
              <option value="COMPLETADO">Completados</option>
              <option value="PENDIENTE">Pendientes</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'white', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase' }}>Centro / Estación</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase' }}>Códigos</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase' }}>Estado de Envío</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#6b7280', fontSize: '0.9rem', textTransform: 'uppercase' }}>Hora de Registro</th>
              </tr>
            </thead>
            <tbody>
              {estaciones
                .filter(est => filtro === 'TODOS' || est.estado === filtro)
                .length > 0 ? (
                estaciones
                  .filter(est => filtro === 'TODOS' || est.estado === filtro)
                  .map((estacion) => (
                  <tr key={estacion.codigo_unico} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{estacion.nombre}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ARCH: <b>{estacion.codigo_arch}</b></div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ÚNICO: <b>{estacion.codigo_unico}</b></div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '9999px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor: estacion.estado === 'COMPLETADO' ? '#d1fae5' : '#fee2e2',
                        color: estacion.estado === 'COMPLETADO' ? '#065f46' : '#991b1b'
                      }}>
                        {estacion.estado === 'COMPLETADO' ? 'COMPLETADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: estacion.hora_registro ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {estacion.hora_registro ? new Date(estacion.hora_registro).toLocaleTimeString() : '---'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No se encontraron estaciones que coincidan con el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditorDashboard;
