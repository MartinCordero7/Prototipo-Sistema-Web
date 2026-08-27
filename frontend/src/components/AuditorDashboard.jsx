import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Iconos SVG (Monocromáticos, Línea pura) ---
import {
  IconRefresh,
  IconBuilding,
  IconCheckCircle,
  IconClock,
  IconSearch,
  IconDownload,
  IconChevronUp,
  IconChevronDown
} from './Icons';

const AuditorDashboard = () => {
  const navigate = useNavigate();

  // Estados Base
  const [estaciones, setEstaciones] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, completados: 0, pendientes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comercializadora, setComercializadora] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  
  // Estados de Filtro y Búsqueda
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const localISODate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(localISODate);
  const [fechaHasta, setFechaHasta] = useState(localISODate);
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Paginación y Orden
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  useEffect(() => {
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
    fetchData(user.comercializadora, fechaDesde, fechaHasta);
  }, [navigate, fechaDesde, fechaHasta]);

  const fetchData = async (comercializadoraName, desde, hasta) => {
    try {
      setLoading(true);
      const url = `http://localhost:3000/api/auditor/estado-diario?comercializadora=${encodeURIComponent(comercializadoraName)}&fechaDesde=${desde}&fechaHasta=${hasta}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEstaciones(data.data);
        setKpis(data.kpis);
        setUltimaActualizacion(new Date());
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

  // 1. Filtrar Datos
  const filteredData = useMemo(() => {
    return estaciones.filter(est => {
      const matchEstado = estadoFiltro === 'TODOS' || est.estado === estadoFiltro;
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        est.nombre.toLowerCase().includes(term) ||
        est.codigo_arch.toLowerCase().includes(term) ||
        est.codigo_unico.toLowerCase().includes(term);
      return matchEstado && matchSearch;
    });
  }, [estaciones, estadoFiltro, searchTerm]);

  // 2. Ordenar Datos
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Manejo de nulos (ej. hora_registro)
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 3. Paginar Datos
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportExcel = () => {
    // Exportación básica a CSV compatible con Excel
    const headers = ['Fecha Reporte', 'Centro/Estación', 'Código ARCH', 'Código Único', 'Estado de Envío', 'Hora de Registro'];
    const rows = sortedData.map(est => [
      `"${est.fecha_objetivo}"`,
      `"${est.nombre}"`,
      `"${est.codigo_arch}"`,
      `"${est.codigo_unico}"`,
      `"${est.estado}"`,
      `"${est.hora_registro ? new Date(est.hora_registro).toLocaleTimeString() : 'N/A'}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(',') + '\n' 
      + rows.map(e => e.join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Auditoria_${comercializadora}_${fechaDesde}_a_${fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && estaciones.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'Inter, sans-serif', color: '#64748b' }}>
        Cargando Panel de Auditoría...
      </div>
    );
  }

  return (
    <div className="corp-layout corp-responsive-pad">
      <style>
        {`
          .corp-layout {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            flex: 1;
            padding: 28px 32px;
            color: #0f172a;
            box-sizing: border-box;
            width: 100%;
          }

          /* Tipografía Corporativa */
          .corp-h1 { font-size: 24px; font-weight: 700; margin: 0; color: #0f172a; letter-spacing: -0.01em; }
          .corp-h2 { font-size: 16px; font-weight: 600; margin: 0; color: #1e293b; }
          .corp-body { font-size: 14px; font-weight: 400; color: #475569; margin: 0; line-height: 1.5; }
          .corp-caption { font-size: 12px; font-weight: 500; color: #64748b; }

          /* Header */
          .corp-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
          }

          .corp-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
            height: 36px;
          }
          .corp-btn-outline { background-color: #ffffff; color: #334155; border-color: #cbd5e1; }
          .corp-btn-outline:hover { background-color: #f1f5f9; color: #0f172a; border-color: #94a3b8; }
          .corp-btn-export { background-color: #ffffff; color: #16a34a; border-color: #bbf7d0; }
          .corp-btn-export:hover { background-color: #f0fdf4; border-color: #86efac; }

          /* KPIs Estilo Stat Bar Horizontal */
          .corp-kpi-container {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }
          .corp-kpi-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
            min-width: 260px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .corp-kpi-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 6px;
          }
          /* Opacidades al 5-8% mediante tintes o rgba */
          .icon-total { background-color: rgba(15, 23, 42, 0.05); color: #0f172a; }
          .icon-ok { background-color: rgba(22, 163, 74, 0.08); color: #16a34a; }
          .icon-pending { background-color: rgba(217, 119, 6, 0.08); color: #d97706; }

          .corp-kpi-content { display: flex; flex-direction: column; gap: 2px; }
          .corp-kpi-title { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          .corp-kpi-value { font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1; }

          /* Toolbar y Filtros */
          .corp-table-wrapper {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
          }
          .corp-table-toolbar {
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
          }
          .corp-filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
          
          .corp-input-wrapper { position: relative; display: flex; align-items: center; }
          .corp-input-icon { position: absolute; left: 10px; color: #94a3b8; pointer-events: none; }
          .corp-input {
            height: 36px;
            padding: 0 12px;
            font-size: 13px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            outline: none;
            color: #0f172a;
            font-family: inherit;
            transition: border-color 0.2s ease;
          }
          .corp-input.with-icon { padding-left: 32px; width: 240px; }
          .corp-input:focus { border-color: #2563eb; }

          /* Tabla de Datos */
          .corp-table-container { overflow-x: auto; width: 100%; }
          .corp-table { width: 100%; border-collapse: collapse; text-align: left; }
          .corp-table th {
            padding: 12px 20px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            user-select: none;
          }
          .corp-table th:hover { background-color: #f1f5f9; }
          .th-content { display: flex; align-items: center; gap: 6px; }
          
          .corp-table td {
            padding: 12px 20px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
            vertical-align: middle;
            color: #1e293b;
          }
          .corp-table tr:last-child td { border-bottom: none; }
          .corp-table tbody tr:hover { background-color: #f8fafc; }

          /* Badges (Etiquetas de Estado) */
          .corp-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.03em;
          }
          .badge-ok { background-color: #f0fdf4; color: #166534; }
          /* PENDIENTE migrado a tono Ámbar neutro en vez de rojo intenso */
          .badge-pending { background-color: #fffbeb; color: #b45309; }

          /* Paginación */
          .corp-pagination {
            padding: 12px 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            color: #475569;
          }
          .corp-pagination-controls { display: flex; gap: 8px; align-items: center; }
          .corp-page-btn {
            padding: 4px 10px;
            border: 1px solid #cbd5e1;
            background-color: #ffffff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
          }
          .corp-page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .corp-page-btn:hover:not(:disabled) { background-color: #f1f5f9; }

          @media (max-width: 768px) {
            .corp-header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .corp-pagination { flex-direction: column; gap: 16px; align-items: flex-start; }
            .corp-pagination-controls { flex-wrap: wrap; }
          }
        `}
      </style>

      {/* Header y Acciones */}
      <div className="corp-header">
        <div>
          <h1 className="corp-h1">Panel de Auditoría Operativa</h1>
          <p className="corp-body" style={{ marginTop: '4px' }}>
            Agencia de Regulación y Control - <strong style={{ color: '#0f172a' }}>{comercializadora}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {ultimaActualizacion && (
            <span className="corp-caption">
              Última actualización: {ultimaActualizacion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="corp-btn corp-btn-outline" onClick={() => fetchData(comercializadora, fechaDesde, fechaHasta)}>
            <IconRefresh /> Actualizar Datos
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Tarjetas KPI (Stat bars) */}
      <div className="corp-kpi-container">
        <div className="corp-kpi-card">
          <div className="corp-kpi-icon icon-total"><IconBuilding /></div>
          <div className="corp-kpi-content">
            <span className="corp-kpi-title">Total Estaciones</span>
            <span className="corp-kpi-value">{kpis.total}</span>
          </div>
        </div>

        <div className="corp-kpi-card">
          <div className="corp-kpi-icon icon-ok"><IconCheckCircle /></div>
          <div className="corp-kpi-content">
            <span className="corp-kpi-title">Completadas Hoy</span>
            <span className="corp-kpi-value">{kpis.completados}</span>
          </div>
        </div>

        <div className="corp-kpi-card">
          <div className="corp-kpi-icon icon-pending"><IconClock /></div>
          <div className="corp-kpi-content">
            <span className="corp-kpi-title">Pendientes</span>
            <span className="corp-kpi-value">{kpis.pendientes}</span>
          </div>
        </div>
      </div>

      {/* Contenedor Principal de la Tabla */}
      <div className="corp-table-wrapper">
        <div className="corp-table-toolbar">
          <div className="corp-filters">
            <div className="corp-input-wrapper">
              <div className="corp-input-icon"><IconSearch /></div>
              <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                className="corp-input with-icon"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="corp-caption">Desde:</label>
              <input 
                type="date" 
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="corp-input"
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="corp-caption">Hasta:</label>
              <input 
                type="date" 
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="corp-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="corp-caption">Estado:</label>
              <select 
                value={estadoFiltro} 
                onChange={(e) => { setEstadoFiltro(e.target.value); setCurrentPage(1); }}
                className="corp-input"
              >
                <option value="TODOS">Todos</option>
                <option value="COMPLETADO">Completados</option>
                <option value="PENDIENTE">Pendientes</option>
              </select>
            </div>
          </div>
          
          <button className="corp-btn corp-btn-export" onClick={handleExportExcel}>
            <IconDownload /> Exportar Excel
          </button>
        </div>

        <div className="corp-table-container">
          <table className="corp-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('fecha_objetivo')} style={{ width: '12%' }}>
                  <div className="th-content">
                    Fecha Reporte
                    {sortConfig.key === 'fecha_objetivo' && (sortConfig.direction === 'asc' ? <IconChevronUp /> : <IconChevronDown />)}
                  </div>
                </th>
                <th onClick={() => requestSort('nombre')}>
                  <div className="th-content">
                    Centro / Estación
                    {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? <IconChevronUp /> : <IconChevronDown />)}
                  </div>
                </th>
                <th onClick={() => requestSort('codigo_arch')}>
                  <div className="th-content">
                    Código ARCH
                    {sortConfig.key === 'codigo_arch' && (sortConfig.direction === 'asc' ? <IconChevronUp /> : <IconChevronDown />)}
                  </div>
                </th>
                <th onClick={() => requestSort('codigo_unico')}>
                  <div className="th-content">
                    Código Único
                    {sortConfig.key === 'codigo_unico' && (sortConfig.direction === 'asc' ? <IconChevronUp /> : <IconChevronDown />)}
                  </div>
                </th>
                <th onClick={() => requestSort('estado')}>
                  <div className="th-content">
                    Estado de Envío
                    {sortConfig.key === 'estado' && (sortConfig.direction === 'asc' ? <IconChevronUp /> : <IconChevronDown />)}
                  </div>
                </th>
                <th onClick={() => requestSort('hora_registro')}>
                  <div className="th-content">
                    Hora de Registro
                    {sortConfig.key === 'hora_registro' && (sortConfig.direction === 'asc' ? <IconChevronUp /> : <IconChevronDown />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((estacion) => (
                  <tr key={`${estacion.codigo_unico}_${estacion.fecha_objetivo}`}>
                    <td>
                      <div style={{ fontWeight: '500', color: '#64748b' }}>{estacion.fecha_objetivo}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{estacion.nombre}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{estacion.codigo_arch}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{estacion.codigo_unico}</div>
                    </td>
                    <td>
                      <span className={`corp-badge ${estacion.estado === 'COMPLETADO' ? 'badge-ok' : 'badge-pending'}`}>
                        {estacion.estado === 'COMPLETADO' ? 'COMPLETADO' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td style={{ color: estacion.hora_registro ? '#1e293b' : '#94a3b8' }}>
                      {estacion.hora_registro ? new Date(estacion.hora_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    No se encontraron estaciones que coincidan con los criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="corp-pagination">
          <div>
            Mostrando {filteredData.length === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1} a {Math.min(currentPage * rowsPerPage, filteredData.length)} de {filteredData.length} registros
          </div>
          <div className="corp-pagination-controls">
            <span style={{ marginRight: '8px' }}>
              Filas por página: 
              <select 
                value={rowsPerPage} 
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ marginLeft: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </span>
            <button 
              className="corp-page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Anterior
            </button>
            <span style={{ margin: '0 8px', fontWeight: '500' }}>
              {currentPage} de {totalPages || 1}
            </span>
            <button 
              className="corp-page-btn" 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditorDashboard;
