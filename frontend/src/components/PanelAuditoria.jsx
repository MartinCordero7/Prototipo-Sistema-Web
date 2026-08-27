import React, { useState } from 'react';
import { 
  Search, Download, RefreshCw, 
  CheckCircle, Clock, AlertTriangle, Building,
  ChevronDown, Plus
} from 'lucide-react';

// Datos de prueba (mock)
const mockData = [
  { id: 1, centro: 'Estación Norte', archId: 'ARCH-001', unicoId: 'UNI-9982', estado: 'COMPLETADO', hora: '08:30 AM' },
  { id: 2, centro: 'Estación Sur', archId: 'ARCH-002', unicoId: 'UNI-9983', estado: 'PENDIENTE', hora: '-' },
  { id: 3, centro: 'Estación Este', archId: 'ARCH-003', unicoId: 'UNI-9984', estado: 'ERROR', hora: '09:15 AM' },
  { id: 4, centro: 'Estación Oeste', archId: 'ARCH-004', unicoId: 'UNI-9985', estado: 'COMPLETADO', hora: '10:00 AM' },
  { id: 5, centro: 'Estación Central', archId: 'ARCH-005', unicoId: 'UNI-9986', estado: 'PENDIENTE', hora: '-' }
];

export default function PanelAuditoria() {
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // KPIs
  const total = 145;
  const completadas = 92;
  const pendientes = 53;

  return (
    <div className="font-sans text-[#111827] bg-[#f9fafb] min-h-screen p-6 md:p-8">
      
      {/* Header y Acciones Principales */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          {/* H1 - 24-28px */}
          <h1 className="text-[26px] font-semibold tracking-tight text-gray-900 mb-1">
            Panel de Auditoría
          </h1>
          <p className="text-[14px] text-gray-500">
            Sistema de Ingreso de Stock Diario - ARCH
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center text-[12px] text-gray-500 mr-2">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Última actualización: 09:35 AM
          </div>
          
          {/* Acción Secundaria (Outline) */}
          <button className="flex items-center px-4 py-2 text-[14px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1f315c] focus:ring-offset-1 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2 text-gray-500" />
            Actualizar Datos
          </button>
          
          {/* Acción Principal (Sólida con color corporativo #1f315c) */}
          <button className="flex items-center px-4 py-2 text-[14px] font-medium text-white bg-[#1f315c] rounded-lg shadow-sm hover:bg-[#162446] focus:outline-none focus:ring-2 focus:ring-[#1f315c] focus:ring-offset-1 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Tarjetas KPI (Stat Bars horizontales, fondo 5-8% opacidad) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Total Estaciones */}
        <div className="bg-[#1f315c]/[0.06] border border-[#1f315c]/10 rounded-[10px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-[#1f315c]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-[#1f315c]/80 uppercase tracking-wider mb-0.5">Total Estaciones</p>
              <p className="text-[20px] font-semibold text-[#1f315c]">{total}</p>
            </div>
          </div>
        </div>

        {/* Completadas */}
        <div className="bg-emerald-600/[0.06] border border-emerald-600/10 rounded-[10px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-emerald-700/80 uppercase tracking-wider mb-0.5">Completadas</p>
              <p className="text-[20px] font-semibold text-emerald-800">{completadas}</p>
            </div>
          </div>
          <div className="text-[12px] font-semibold text-emerald-700 bg-emerald-600/10 px-2 py-1 rounded-md">
            {Math.round((completadas/total)*100)}%
          </div>
        </div>

        {/* Pendientes (Ámbar Neutro) */}
        <div className="bg-amber-600/[0.06] border border-amber-600/10 rounded-[10px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-amber-700/80 uppercase tracking-wider mb-0.5">Pendientes</p>
              <p className="text-[20px] font-semibold text-amber-900">{pendientes}</p>
            </div>
          </div>
          <div className="text-[12px] font-semibold text-amber-700 bg-amber-600/10 px-2 py-1 rounded-md">
            {Math.round((pendientes/total)*100)}%
          </div>
        </div>
      </div>

      {/* Sección de Tabla */}
      <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
        
        {/* Controles de Tabla */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-200 gap-4">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por estación o ID..."
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-[#1f315c] focus:border-[#1f315c] transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center text-[14px] text-gray-600 mr-2">
              <span className="mr-2 hidden sm:inline">Mostrar:</span>
              <select 
                className="border border-gray-300 rounded-md py-1 pl-2 pr-6 focus:ring-[#1f315c] focus:border-[#1f315c] bg-white cursor-pointer"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <button className="flex items-center px-3 py-2 text-[14px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 sm:mr-2 text-gray-500" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Tabla de Datos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center">
                    Centro / Estación
                    <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                {/* IDs separados en columnas propias */}
                <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center">
                    ID ARCH
                    <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center">
                    ID ÚNICO
                    <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center">
                    Estado de Envío
                  </div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center">
                    Hora Registro
                  </div>
                </th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[14px]">
              {mockData.map((row) => (
                // Hover states en filas
                <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.centro}</td>
                  
                  {/* Tipografía monoespaciada para IDs para mayor legibilidad */}
                  <td className="px-6 py-4 text-gray-600 font-mono text-[13px]">{row.archId}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-[13px]">{row.unicoId}</td>
                  
                  <td className="px-6 py-4">
                    {/* Badges de estado con contraste AA y soporte de ícono */}
                    {row.estado === 'COMPLETADO' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Completado
                      </span>
                    )}
                    {row.estado === 'PENDIENTE' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                        <Clock className="w-3 h-3 mr-1.5" />
                        Pendiente
                      </span>
                    )}
                    {row.estado === 'ERROR' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-red-50 text-red-700 border border-red-200/60">
                        <AlertTriangle className="w-3 h-3 mr-1.5" />
                        Error
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{row.hora}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#1f315c] hover:text-[#162446] font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/30">
          <p className="text-[14px] text-gray-500">
            Mostrando <span className="font-medium text-gray-900">1</span> a <span className="font-medium text-gray-900">5</span> de <span className="font-medium text-gray-900">{total}</span> resultados
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-[14px] font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Anterior
            </button>
            <button className="px-3 py-1.5 text-[14px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              Siguiente
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
