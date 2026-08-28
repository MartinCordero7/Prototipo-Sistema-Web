import React, { useState, useEffect } from 'react';
import { IconAlertTriangle } from './Icons';

const HistorialEstacion = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      } else {
        setError(data.message || 'Error al cargar el historial.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando historial...</div>;
  }

  if (error) {
    return (
      <div className="corp-alert corp-alert-error">
        <IconAlertTriangle /> {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        No tienes declaraciones registradas aún.
      </div>
    );
  }

  return (
    <div>
      <h3 className="corp-h2" style={{ marginBottom: '16px' }}>Tus últimas declaraciones</h3>
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Fecha Declarada</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Diésel</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Extra</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Súper</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Pesca</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Fecha de Envío</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>
                  {record.fecha_stock}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                  {record.diesel_premium > 0 ? record.diesel_premium : '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                  {(record.gasolina_extra + record.gasolina_extra_etanol) > 0 ? (record.gasolina_extra + record.gasolina_extra_etanol) : '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                  {record.gasolina_super > 0 ? record.gasolina_super : '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                  {record.gasolina_pesca_artesanal > 0 ? record.gasolina_pesca_artesanal : '-'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8' }}>
                  {new Date(record.marca_temporal).toLocaleString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialEstacion;
