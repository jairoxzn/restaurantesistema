import { useState, useEffect, Fragment } from 'react';
import Layout from '../components/Layout/Layout';
import { cajaService } from '../services/cajaService';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineCash, HiOutlineLockOpen, HiOutlineLockClosed, 
  HiOutlineMinusCircle, HiOutlineDocumentText, HiOutlineCreditCard,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineDownload
} from 'react-icons/hi';
import { exportCajaReportExcel, exportCajaReportPDF } from '../utils/exportReports';
import toast from 'react-hot-toast';

const CajaPage = () => {
  const { settings } = useSettings();
  const { isAdmin } = useAuth();
  const [caja, setCaja] = useState(null);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('actual'); // 'actual' | 'historial'
  const [historial, setHistorial] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  // Forms states
  const [montoApertura, setMontoApertura] = useState('');
  const [gastoData, setGastoData] = useState({ concepto: '', monto: '' });
  
  // Closing form state by payment method
  const [declaradoDesglose, setDeclaradoDesglose] = useState({
    efectivo: '',
    yape: '',
    plin: '',
    tarjeta: ''
  });

  const moneda = settings?.moneda || 'S/';

  useEffect(() => {
    loadEstadoCaja();
  }, []);

  const loadEstadoCaja = async () => {
    try {
      setLoading(true);
      const res = await cajaService.getEstado();
      if (res.data.abierta) {
        setCaja(res.data.caja);
        loadGastos(res.data.caja.id);
      } else {
        setCaja(null);
      }
    } catch (error) {
      toast.error('Error al cargar el estado de caja');
    } finally {
      setLoading(false);
    }
  };

  const loadGastos = async (caja_id) => {
    try {
      const res = await cajaService.getGastos(caja_id);
      setGastos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadHistorial = async () => {
    try {
      const res = await cajaService.getHistorial();
      setHistorial(res.data);
    } catch (error) {
      toast.error('Error al cargar historial');
    }
  };

  useEffect(() => {
    if (activeTab === 'historial') {
      loadHistorial();
    }
  }, [activeTab]);

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    try {
      await cajaService.abrirCaja({ monto_apertura: Number(montoApertura) || 0 });
      toast.success('Caja abierta exitosamente');
      setMontoApertura('');
      loadEstadoCaja();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al abrir caja');
    }
  };

  const handleAgregarGasto = async (e) => {
    e.preventDefault();
    try {
      await cajaService.agregarGasto({
        concepto: gastoData.concepto,
        monto: Number(gastoData.monto)
      });
      toast.success('Gasto registrado');
      setGastoData({ concepto: '', monto: '' });
      loadEstadoCaja();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar gasto');
    }
  };

  const handleCerrarCaja = async (e) => {
    e.preventDefault();
    if (!window.confirm('¿Está seguro de que desea cerrar la caja actual?')) return;

    const desgloseNums = {
      efectivo: Number(declaradoDesglose.efectivo) || 0,
      yape: Number(declaradoDesglose.yape) || 0,
      plin: Number(declaradoDesglose.plin) || 0,
      tarjeta: Number(declaradoDesglose.tarjeta) || 0
    };

    const totalDeclarado = Object.values(desgloseNums).reduce((a, b) => a + b, 0);

    try {
      const res = await cajaService.cerrarCaja(caja.id, {
        monto_declarado: totalDeclarado,
        desglose_declarado: desgloseNums
      });
      
      const diff = res.data.diferencia;
      if (diff === 0) {
        toast.success('Caja cerrada. ¡Cuadre exacto!');
      } else if (diff > 0) {
        toast.success(`Caja cerrada. Sobrante total de ${moneda} ${diff.toFixed(2)}`);
      } else {
        toast.error(`Caja cerrada. Faltante total de ${moneda} ${Math.abs(diff).toFixed(2)}`);
      }
      
      setDeclaradoDesglose({ efectivo: '', yape: '', plin: '', tarjeta: '' });
      loadEstadoCaja();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cerrar caja');
    }
  };

  const totalDeclaradoCalculado = Object.values(declaradoDesglose)
    .reduce((sum, val) => sum + (Number(val) || 0), 0);

  if (loading) {
    return (
      <Layout title="Control de Caja">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Caja y Arqueo de Dinero">
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/5 pb-2">
        <button 
          onClick={() => setActiveTab('actual')}
          className={`pb-2 px-1 border-b-2 font-medium transition-colors ${activeTab === 'actual' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
        >
          Caja Actual
        </button>
        {isAdmin() && (
          <button 
            onClick={() => setActiveTab('historial')}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${activeTab === 'historial' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Historial de Cierres
          </button>
        )}
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'actual' ? (
          !caja ? (
            /* Pantalla de Apertura de Caja */
            <div className="max-w-md mx-auto mt-12 glass-card p-8 text-center border-t-4 border-t-primary-500">
              <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineLockClosed className="w-8 h-8 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">La Caja está Cerrada</h2>
              <p className="text-dark-400 mb-8 text-sm">Debes abrir la caja con un monto inicial (sencillo) para poder realizar ventas.</p>
              
              <form onSubmit={handleAbrirCaja} className="space-y-4">
                <div className="text-left">
                  <label className="label-field">Monto Inicial en Caja ({moneda})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    className="input-field text-center text-lg font-bold"
                    placeholder="0.00"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg">
                  <HiOutlineLockOpen className="w-5 h-5" />
                  Abrir Caja
                </button>
              </form>
            </div>
          ) : (
            /* Dashboard de Caja Abierta */
            <div className="space-y-6">
              
              {/* Tarjetas de Métodos de Pago */}
              <div>
                <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Arqueo por Medio de Pago</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="stat-card">
                    <p className="text-xs text-dark-400 font-medium flex items-center gap-1">
                      <HiOutlineCash className="text-green-400" />
                      Efectivo en Caja
                    </p>
                    <p className="text-xl font-bold text-white mt-1">{moneda} {(caja.desglose_esperado?.efectivo || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-dark-500 mt-1">
                      Inicial: {moneda}{Number(caja.monto_apertura).toFixed(2)} | Ventas: +{moneda}{(caja.ventas_efectivo || 0).toFixed(2)} | Gastos: -{moneda}{(caja.gastos || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="stat-card">
                    <p className="text-xs text-dark-400 font-medium flex items-center gap-1">
                      <HiOutlineCreditCard className="text-purple-400" />
                      Total Yape
                    </p>
                    <p className="text-xl font-bold text-purple-400 mt-1">{moneda} {(caja.desglose_esperado?.yape || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-dark-500 mt-1">Pagos digitales por Yape</p>
                  </div>

                  <div className="stat-card">
                    <p className="text-xs text-dark-400 font-medium flex items-center gap-1">
                      <HiOutlineCreditCard className="text-teal-400" />
                      Total Plin
                    </p>
                    <p className="text-xl font-bold text-teal-400 mt-1">{moneda} {(caja.desglose_esperado?.plin || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-dark-500 mt-1">Pagos digitales por Plin</p>
                  </div>

                  <div className="stat-card">
                    <p className="text-xs text-dark-400 font-medium flex items-center gap-1">
                      <HiOutlineCreditCard className="text-blue-400" />
                      Total Tarjeta / POS
                    </p>
                    <p className="text-xl font-bold text-blue-400 mt-1">{moneda} {(caja.desglose_esperado?.tarjeta || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-dark-500 mt-1">Transacciones por POS</p>
                  </div>

                  <div className="stat-card bg-primary-500/10 border-primary-500/30">
                    <p className="text-xs text-primary-200 font-medium">Total General Esperado</p>
                    <p className="text-2xl font-bold text-primary-400 mt-1">{moneda} {(caja.saldo_esperado || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-primary-300 mt-1">Suma de todos los canales</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Formulario de Gastos */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <HiOutlineMinusCircle className="text-red-400" />
                    Registrar Salida / Gasto de Caja
                  </h3>
                  <form onSubmit={handleAgregarGasto} className="space-y-4">
                    <div>
                      <label className="label-field">Concepto / Motivo</label>
                      <input
                        type="text"
                        required
                        value={gastoData.concepto}
                        onChange={(e) => setGastoData({...gastoData, concepto: e.target.value})}
                        className="input-field"
                        placeholder="Ej. Compra de insumos, Pago de servicio..."
                      />
                    </div>
                    <div>
                      <label className="label-field">Monto ({moneda})</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={gastoData.monto}
                        onChange={(e) => setGastoData({...gastoData, monto: e.target.value})}
                        className="input-field"
                        placeholder="0.00"
                      />
                    </div>
                    <button type="submit" className="btn-danger w-full">
                      Registrar Gasto de Efectivo
                    </button>
                  </form>

                  {/* Lista de Gastos */}
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-dark-300 mb-3 uppercase tracking-wider">Gastos de hoy</h4>
                    {gastos.length === 0 ? (
                      <p className="text-sm text-dark-500 text-center py-4 bg-dark-900/50 rounded-xl">No hay gastos registrados en esta sesión.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {gastos.map(g => (
                          <div key={g.id} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-xl border border-white/5">
                            <div>
                              <p className="text-sm text-white font-medium">{g.concepto}</p>
                              <p className="text-xs text-dark-400">{new Date(g.fecha).toLocaleTimeString()}</p>
                            </div>
                            <span className="text-red-400 font-bold">-{moneda} {Number(g.monto).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cierre de Caja Desglosado */}
                <div className="glass-card p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                    <HiOutlineLockClosed className="text-primary-500" />
                    Cierre de Turno y Cuadre por Plataforma
                  </h3>
                  <p className="text-xs text-dark-300 mb-4">
                    Declara el monto contado o revisado en cada plataforma para generar el reporte de cuadre exacto.
                  </p>

                  <form onSubmit={handleCerrarCaja} className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-field text-xs text-green-400">
                          Efectivo Físico ({moneda})
                          <span className="block text-[10px] text-dark-400 font-normal">Esperado: {moneda} {(caja.desglose_esperado?.efectivo || 0).toFixed(2)}</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={declaradoDesglose.efectivo}
                          onChange={(e) => setDeclaradoDesglose({...declaradoDesglose, efectivo: e.target.value})}
                          className="input-field text-sm font-bold bg-dark-950 border-green-500/30"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="label-field text-xs text-purple-400">
                          Total Yape ({moneda})
                          <span className="block text-[10px] text-dark-400 font-normal">Esperado: {moneda} {(caja.desglose_esperado?.yape || 0).toFixed(2)}</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={declaradoDesglose.yape}
                          onChange={(e) => setDeclaradoDesglose({...declaradoDesglose, yape: e.target.value})}
                          className="input-field text-sm font-bold bg-dark-950 border-purple-500/30"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="label-field text-xs text-teal-400">
                          Total Plin ({moneda})
                          <span className="block text-[10px] text-dark-400 font-normal">Esperado: {moneda} {(caja.desglose_esperado?.plin || 0).toFixed(2)}</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={declaradoDesglose.plin}
                          onChange={(e) => setDeclaradoDesglose({...declaradoDesglose, plin: e.target.value})}
                          className="input-field text-sm font-bold bg-dark-950 border-teal-500/30"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="label-field text-xs text-blue-400">
                          Total Tarjeta / POS ({moneda})
                          <span className="block text-[10px] text-dark-400 font-normal">Esperado: {moneda} {(caja.desglose_esperado?.tarjeta || 0).toFixed(2)}</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={declaradoDesglose.tarjeta}
                          onChange={(e) => setDeclaradoDesglose({...declaradoDesglose, tarjeta: e.target.value})}
                          className="input-field text-sm font-bold bg-dark-950 border-blue-500/30"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Resumen Total Declarado vs Esperado */}
                    <div className="bg-dark-900/80 p-3 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between text-xs text-dark-300">
                        <span>Total Declarado:</span>
                        <span className="font-bold text-white">{moneda} {totalDeclaradoCalculado.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-dark-300">
                        <span>Total Esperado:</span>
                        <span className="font-bold text-primary-400">{moneda} {(caja.saldo_esperado || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-white/5 font-bold">
                        <span>Diferencia Total:</span>
                        <span className={totalDeclaradoCalculado - (caja.saldo_esperado || 0) === 0 ? 'text-green-400' : totalDeclaradoCalculado - (caja.saldo_esperado || 0) > 0 ? 'text-blue-400' : 'text-red-400'}>
                          {totalDeclaradoCalculado - (caja.saldo_esperado || 0) > 0 ? '+' : ''}{moneda} {(totalDeclaradoCalculado - (caja.saldo_esperado || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full text-base py-3 shadow-primary-500/40">
                      Confirmar y Cerrar Caja
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )
        ) : (
          /* Pestaña: Historial de Cierres */
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <HiOutlineDocumentText className="text-primary-500 w-6 h-6" />
              Historial de Sesiones y Arqueo por Plataforma
            </h3>
            
            <div className="table-container">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Apertura</th>
                    <th className="p-4">Esperado</th>
                    <th className="p-4">Declarado</th>
                    <th className="p-4">Diferencia</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => {
                    const diff = Number(h.monto_cierre_declarado) - Number(h.monto_cierre_esperado);
                    const isExpanded = expandedRow === h.id;
                    return (
                      <Fragment key={h.id}>
                        <tr className="table-row">
                          <td className="p-4 whitespace-nowrap">
                            <p className="text-white font-medium">{new Date(h.fecha_apertura).toLocaleDateString()}</p>
                            <p className="text-xs text-dark-400">{new Date(h.fecha_apertura).toLocaleTimeString()}</p>
                          </td>
                          <td className="p-4 text-dark-200">{h.usuario_nombre}</td>
                          <td className="p-4 text-dark-200">{moneda} {Number(h.monto_apertura).toFixed(2)}</td>
                          <td className="p-4 text-dark-200">
                            {h.monto_cierre_esperado !== null ? `${moneda} ${Number(h.monto_cierre_esperado).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-4 text-white font-medium">
                            {h.monto_cierre_declarado !== null ? `${moneda} ${Number(h.monto_cierre_declarado).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-4">
                            {h.estado === 'CERRADA' ? (
                              <span className={`font-bold ${diff === 0 ? 'text-green-400' : diff > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                {diff > 0 ? '+' : ''}{moneda} {diff.toFixed(2)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`badge ${h.estado === 'ABIERTA' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-dark-700 text-dark-300'}`}>
                              {h.estado}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {h.desglose_esperado && (
                              <button 
                                onClick={() => setExpandedRow(isExpanded ? null : h.id)}
                                className="text-primary-400 hover:text-primary-300 p-1"
                              >
                                {isExpanded ? <HiOutlineChevronUp className="w-5 h-5" /> : <HiOutlineChevronDown className="w-5 h-5" />}
                              </button>
                            )}
                          </td>
                        </tr>

                        {isExpanded && h.desglose_esperado && (
                          <tr key={`exp-${h.id}`} className="bg-dark-900/80">
                            <td colSpan="8" className="p-4 border-b border-dark-700">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-dark-950 rounded-xl border border-white/5">
                                  <p className="text-green-400 font-bold mb-1">Efectivo</p>
                                  <p className="text-dark-300">Esperado: {moneda} {(h.desglose_esperado.efectivo || 0).toFixed(2)}</p>
                                  <p className="text-white">Declarado: {moneda} {(h.desglose_declarado?.efectivo || 0).toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-dark-950 rounded-xl border border-white/5">
                                  <p className="text-purple-400 font-bold mb-1">Yape</p>
                                  <p className="text-dark-300">Esperado: {moneda} {(h.desglose_esperado.yape || 0).toFixed(2)}</p>
                                  <p className="text-white">Declarado: {moneda} {(h.desglose_declarado?.yape || 0).toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-dark-950 rounded-xl border border-white/5">
                                  <p className="text-teal-400 font-bold mb-1">Plin</p>
                                  <p className="text-dark-300">Esperado: {moneda} {(h.desglose_esperado.plin || 0).toFixed(2)}</p>
                                  <p className="text-white">Declarado: {moneda} {(h.desglose_declarado?.plin || 0).toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-dark-950 rounded-xl border border-white/5">
                                  <p className="text-blue-400 font-bold mb-1">Tarjeta / POS</p>
                                  <p className="text-dark-300">Esperado: {moneda} {(h.desglose_esperado.tarjeta || 0).toFixed(2)}</p>
                                  <p className="text-white">Declarado: {moneda} {(h.desglose_declarado?.tarjeta || 0).toFixed(2)}</p>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                                <button 
                                  onClick={() => exportCajaReportExcel(h, [], moneda)}
                                  className="btn-secondary text-xs py-1.5 px-3 border-green-500/30 text-green-400 hover:bg-green-500/10 flex items-center gap-1"
                                >
                                  <HiOutlineDownload className="w-3.5 h-3.5" />
                                  Excel (.xlsx)
                                </button>
                                <button 
                                  onClick={() => exportCajaReportPDF(h, [], moneda)}
                                  className="btn-secondary text-xs py-1.5 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1"
                                >
                                  <HiOutlineDownload className="w-3.5 h-3.5" />
                                  Reporte PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-dark-400">
                        No hay registros en el historial de caja.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CajaPage;
