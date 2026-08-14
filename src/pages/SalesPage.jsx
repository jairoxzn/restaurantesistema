import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/UI/Modal';
import { saleService } from '../services/saleService';
import { useSettings } from '../context/SettingsContext';
import { generateSaleReceipt } from '../utils/receipt';
import { exportVentasReportExcel, exportVentasReportPDF } from '../utils/exportReports';
import toast from 'react-hot-toast';
import { 
  HiOutlineEye, HiOutlineCash, HiOutlineCreditCard, 
  HiOutlineDocumentText, HiOutlineCalendar, HiOutlineDownload
} from 'react-icons/hi';

const SalesPage = () => {
  const { settings } = useSettings();
  const moneda = settings?.moneda || 'S/';

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Date filters
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      const res = await saleService.getAll(params);
      setSales(res.data);
    } catch (error) {
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    loadSales();
  };

  const viewDetail = async (sale) => {
    try {
      const res = await saleService.getById(sale.id);
      setSelectedSale(res.data);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error('Error al cargar detalle');
    }
  };

  const handleReprint = (sale) => {
    generateSaleReceipt(sale, settings);
    toast.success('Ticket enviado a impresora');
  };

  const getPaymentIcon = (method) => {
    switch ((method || '').toLowerCase()) {
      case 'efectivo': return <HiOutlineCash className="w-4 h-4" />;
      case 'yape': case 'plin': case 'tarjeta': return <HiOutlineCreditCard className="w-4 h-4" />;
      default: return <HiOutlineCash className="w-4 h-4" />;
    }
  };

  const getPaymentColor = (method) => {
    switch ((method || '').toLowerCase()) {
      case 'efectivo': return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'yape': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
      case 'plin': return 'bg-teal-500/15 text-teal-400 border-teal-500/20';
      case 'tarjeta': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      default: return 'bg-dark-600/15 text-dark-400 border-dark-500/20';
    }
  };

  return (
    <Layout title="Historial y Reportes de Ventas">
      <div className="space-y-6 animate-fadeIn">
        
        {/* Filters and Export Actions */}
        <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-400 font-medium">Desde:</span>
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)} 
                className="input-field py-1.5 px-3 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-400 font-medium">Hasta:</span>
              <input 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)} 
                className="input-field py-1.5 px-3 text-xs"
              />
            </div>
            <button type="submit" className="btn-secondary text-xs py-2 px-4">
              Filtrar
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button 
              onClick={() => exportVentasReportExcel(sales, fechaInicio, fechaFin, moneda)}
              disabled={sales.length === 0}
              className="btn-secondary text-xs py-2 px-3 border-green-500/30 text-green-400 hover:bg-green-500/10 flex items-center gap-1.5 disabled:opacity-50"
            >
              <HiOutlineDownload className="w-4 h-4" />
              Excel (.xlsx)
            </button>
            <button 
              onClick={() => exportVentasReportPDF(sales, fechaInicio, fechaFin, moneda)}
              disabled={sales.length === 0}
              className="btn-secondary text-xs py-2 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 disabled:opacity-50"
            >
              <HiOutlineDownload className="w-4 h-4" />
              Reporte PDF
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4 text-left"># Boleta</th>
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Vendedor</th>
                  <th className="px-6 py-4 text-left">Método</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
                  </td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-dark-500">
                    <HiOutlineCalendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hay ventas registradas en el rango seleccionado</p>
                  </td></tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="table-row">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-dark-200">#{String(sale.id).padStart(6, '0')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-dark-300">{new Date(sale.fecha).toLocaleString('es-PE')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-dark-300">{sale.usuario_nombre || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge border ${getPaymentColor(sale.metodo_pago)} flex items-center gap-1.5 w-fit uppercase text-xs font-bold`}>
                          {getPaymentIcon(sale.metodo_pago)}
                          {sale.metodo_pago || 'EFECTIVO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-primary-400">{moneda} {Number(sale.total).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => viewDetail(sale)} className="p-2 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Ver detalle">
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleReprint(sale)} className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all" title="Imprimir ticket térmico">
                            <HiOutlineDocumentText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Comprobante #${selectedSale ? String(selectedSale.id).padStart(6, '0') : ''}`} size="md">
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900/50 rounded-xl p-3">
                <p className="text-xs text-dark-500">Fecha</p>
                <p className="text-sm font-medium text-dark-200">{new Date(selectedSale.fecha).toLocaleString('es-PE')}</p>
              </div>
              <div className="bg-dark-900/50 rounded-xl p-3">
                <p className="text-xs text-dark-500">Vendedor</p>
                <p className="text-sm font-medium text-dark-200">{selectedSale.usuario_nombre}</p>
              </div>
              <div className="bg-dark-900/50 rounded-xl p-3">
                <p className="text-xs text-dark-500">Método de pago</p>
                <p className="text-sm font-medium text-dark-200 uppercase font-bold">{selectedSale.metodo_pago || 'EFECTIVO'}</p>
              </div>
              <div className="bg-dark-900/50 rounded-xl p-3">
                <p className="text-xs text-dark-500">Total</p>
                <p className="text-lg font-bold text-primary-400">{moneda} {Number(selectedSale.total).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-dark-900/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-dark-200 mb-3">Detalle de productos</p>
              <div className="space-y-2">
                {selectedSale.detalles?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-dark-700/30 last:border-0">
                    <div>
                      <span className="text-dark-300">{item.cantidad}x </span>
                      <span className="text-dark-200">{item.producto_nombre}</span>
                    </div>
                    <span className="text-dark-200 font-medium">{moneda} {(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => handleReprint(selectedSale)} className="btn-primary w-full flex items-center justify-center gap-2">
              <HiOutlineDocumentText className="w-5 h-5" />
              Imprimir Ticket Térmico
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default SalesPage;
