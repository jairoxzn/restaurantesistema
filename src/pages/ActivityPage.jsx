import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import { activityService } from '../services/activityService';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardCheck, HiOutlineRefresh, HiOutlineSearch,
  HiOutlineLogin, HiOutlineShoppingBag, HiOutlineCash,
  HiOutlineLockOpen, HiOutlineLockClosed, HiOutlineTrendingDown,
  HiOutlineChevronLeft, HiOutlineChevronRight
} from 'react-icons/hi';

const ACCION_OPTIONS = [
  { value: 'all', label: 'Todas las acciones' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'COMPRA', label: 'Compra' },
  { value: 'COBRO', label: 'Cobro' },
  { value: 'CAJA_APERTURA', label: 'Apertura de Caja' },
  { value: 'CAJA_CIERRE', label: 'Cierre de Caja' },
  { value: 'GASTO', label: 'Gasto' },
];

const ACCION_STYLE = {
  LOGIN: { label: 'Login', icon: HiOutlineLogin, className: 'bg-green-500/15 text-green-400 border-green-500/20' },
  COMPRA: { label: 'Compra', icon: HiOutlineShoppingBag, className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  COBRO: { label: 'Cobro', icon: HiOutlineCash, className: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  CAJA_APERTURA: { label: 'Apertura Caja', icon: HiOutlineLockOpen, className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  CAJA_CIERRE: { label: 'Cierre Caja', icon: HiOutlineLockClosed, className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  GASTO: { label: 'Gasto', icon: HiOutlineTrendingDown, className: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
};

const ActivityPage = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [accion, setAccion] = useState('all');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const loadData = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit: 50 };
      if (search) params.search = search;
      if (accion !== 'all') params.accion = accion;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await activityService.getAll(params);
      setRegistros(res.data.data);
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el registro de actividad');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(1);
  };

  return (
    <Layout title="Registro de Actividad">
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <HiOutlineClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-50">Registro de Actividad</h2>
              <p className="text-sm text-dark-400">Control de accesos, acciones e inicios de sesión</p>
            </div>
          </div>
          <button
            onClick={() => loadData(page)}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="glass-card p-4">
          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HiOutlineSearch className="w-4 h-4" />
            Filtros
          </p>
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por usuario, descripción, IP..."
                className="input-field pl-10 py-2 text-sm"
              />
            </div>
            <select value={accion} onChange={(e) => setAccion(e.target.value)} className="input-field py-2 text-sm w-auto">
              {ACCION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input-field py-2 text-sm w-auto"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input-field py-2 text-sm w-auto"
            />
            <button type="submit" className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
              <HiOutlineSearch className="w-4 h-4" />
              Buscar
            </button>
          </form>
        </div>

        <p className="text-sm text-dark-400">
          {total} registro{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}
          {totalPages > 1 && <span className="text-dark-500"> · Página {page} de {totalPages}</span>}
        </p>

        {/* Tabla */}
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Acción</th>
                  <th className="px-6 py-4 text-left">Usuario</th>
                  <th className="px-6 py-4 text-left">Descripción</th>
                  <th className="px-6 py-4 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
                  </td></tr>
                ) : registros.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-dark-500">
                    <HiOutlineClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hay actividad registrada con estos filtros</p>
                  </td></tr>
                ) : (
                  registros.map((r) => {
                    const style = ACCION_STYLE[r.accion] || { label: r.accion, icon: HiOutlineClipboardCheck, className: 'bg-dark-600/15 text-dark-400 border-dark-500/20' };
                    const Icon = style.icon;
                    return (
                      <tr key={r.id} className="table-row">
                        <td className="px-6 py-4">
                          <span className="text-sm text-dark-300 whitespace-nowrap">
                            {new Date(r.fecha).toLocaleString('es-PE')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge border ${style.className} flex items-center gap-1.5 w-fit text-xs font-bold`}>
                            <Icon className="w-3.5 h-3.5" />
                            {style.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-dark-200">{r.usuario_nombre}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-dark-300">{r.descripcion}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-dark-500">{r.ip || '—'}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => loadData(page - 1)}
              disabled={page <= 1 || loading}
              className="btn-secondary py-2 px-3 flex items-center gap-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <span className="text-sm text-dark-400">Página {page} de {totalPages}</span>
            <button
              onClick={() => loadData(page + 1)}
              disabled={page >= totalPages || loading}
              className="btn-secondary py-2 px-3 flex items-center gap-1 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ActivityPage;
