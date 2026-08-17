import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Layout from '../components/Layout/Layout';
import Modal from '../components/UI/Modal';
import { mesaService } from '../services/mesaService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { generateCuentaReceipt } from '../utils/receipt';
import toast from 'react-hot-toast';
import {
  HiOutlineViewGrid, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineUserGroup, HiOutlineShoppingCart, HiOutlineCash,
  HiOutlineX, HiOutlineCheckCircle, HiOutlinePause, HiOutlinePlay
} from 'react-icons/hi';

const SOCKET_URL = '';

const paymentMethodOptions = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'yape', label: 'Yape' },
  { id: 'plin', label: 'Plin' },
  { id: 'tarjeta', label: 'Tarjeta' },
];

const MesasPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const moneda = settings?.moneda || 'S/';

  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form (crear/editar mesa)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', capacidad: 4 });

  // Cobrar cuenta
  const [cobrarMesa, setCobrarMesa] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [cobrando, setCobrando] = useState(false);

  useEffect(() => {
    loadMesas();

    const socket = io(SOCKET_URL);
    socket.on('new_order', () => loadMesas());
    socket.on('mesa_cobrada', () => loadMesas());

    return () => socket.disconnect();
  }, []);

  const loadMesas = async () => {
    try {
      const res = await mesaService.getAll();
      setMesas(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD de mesas (admin) ---

  const openCreateForm = () => {
    setEditingMesa(null);
    setFormData({ nombre: '', capacidad: 4 });
    setFormModalOpen(true);
  };

  const openEditForm = (mesa) => {
    setEditingMesa(mesa);
    setFormData({ nombre: mesa.nombre, capacidad: mesa.capacidad });
    setFormModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingMesa) {
        await mesaService.update(editingMesa.id, formData);
        toast.success('Mesa actualizada');
      } else {
        await mesaService.create(formData);
        toast.success('Mesa creada');
      }
      setFormModalOpen(false);
      loadMesas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar la mesa');
    }
  };

  const handleDeleteMesa = async (mesa) => {
    if (!window.confirm(`¿Eliminar ${mesa.nombre}?`)) return;
    try {
      await mesaService.remove(mesa.id);
      toast.success('Mesa eliminada');
      loadMesas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar la mesa');
    }
  };

  const handleSuspenderMesa = async (mesa) => {
    try {
      await mesaService.suspender(mesa.id);
      toast.success(`${mesa.nombre} suspendida`);
      loadMesas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al suspender la mesa');
    }
  };

  const handleReactivarMesa = async (mesa) => {
    try {
      await mesaService.reactivar(mesa.id);
      toast.success(`${mesa.nombre} reactivada`);
      loadMesas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al reactivar la mesa');
    }
  };

  // --- Cobro de cuenta (con división de pago) ---

  const openCobrar = async (mesa) => {
    setCobrarMesa(mesa);
    setCuenta(null);
    try {
      const res = await mesaService.getCuenta(mesa.id);
      setCuenta(res.data);
      setPagos([{ metodo_pago: 'efectivo', monto: res.data.total.toFixed(2) }]);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar la cuenta de la mesa');
      setCobrarMesa(null);
    }
  };

  const totalPagos = pagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const restante = cuenta ? Number((cuenta.total - totalPagos).toFixed(2)) : 0;

  const addPagoLine = () => {
    setPagos(prev => [...prev, { metodo_pago: 'efectivo', monto: restante > 0 ? restante.toFixed(2) : '' }]);
  };

  const removePagoLine = (index) => {
    setPagos(prev => prev.filter((_, i) => i !== index));
  };

  const updatePagoLine = (index, field, value) => {
    setPagos(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleCobrar = async () => {
    if (Math.abs(restante) > 0.01) return;
    setCobrando(true);
    try {
      const pagosPayload = pagos.map(p => ({ metodo_pago: p.metodo_pago, monto: Number(p.monto) }));
      await mesaService.cobrar(cobrarMesa.id, pagosPayload);
      toast.success('Cuenta cobrada exitosamente');
      generateCuentaReceipt({ mesa: cuenta.mesa, comandas: cuenta.comandas, pagos: pagosPayload, total: cuenta.total }, settings);
      setCobrarMesa(null);
      setCuenta(null);
      loadMesas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cobrar la cuenta');
    } finally {
      setCobrando(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Mesas">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mesas">
      <div className="flex items-center justify-between mb-6">
        <p className="text-dark-300">Gestiona el consumo en salón: abre una mesa, envía comandas a cocina y cobra la cuenta al final.</p>
        {isAdmin() && (
          <button onClick={openCreateForm} className="btn-primary flex items-center gap-2 shrink-0 ml-4">
            <HiOutlinePlus className="w-5 h-5" />
            Nueva Mesa
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Mesas', value: mesas.length, icon: HiOutlineViewGrid, from: 'from-blue-600', to: 'to-blue-500' },
          { label: 'Disponibles', value: mesas.filter(m => m.estado === 'LIBRE').length, icon: HiOutlineCheckCircle, from: 'from-green-600', to: 'to-green-500' },
          { label: 'Ocupadas', value: mesas.filter(m => m.estado === 'OCUPADA').length, icon: HiOutlineUserGroup, from: 'from-red-600', to: 'to-red-500' },
          { label: 'Suspendidas', value: mesas.filter(m => m.estado === 'SUSPENDIDA').length, icon: HiOutlinePause, from: 'from-slate-600', to: 'to-slate-500' },
        ].map(({ label, value, icon: Icon, from, to }) => (
          <div key={label} className={`rounded-2xl p-4 bg-gradient-to-br ${from} ${to} shadow-lg flex flex-col justify-between h-[86px]`}>
            <span className="text-white/80 text-sm font-medium">{label}</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-white leading-none">{value}</span>
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {mesas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-dark-500 glass-card">
          <HiOutlineViewGrid className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl">No hay mesas configuradas</p>
          {isAdmin() && <p className="text-sm mt-2">Crea la primera mesa para empezar a atender el salón.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mesas.map((mesa) => {
            const ocupada = mesa.estado === 'OCUPADA';
            const suspendida = mesa.estado === 'SUSPENDIDA';
            const borderColor = ocupada ? 'border-t-amber-500' : suspendida ? 'border-t-slate-500' : 'border-t-green-500';
            const badgeClass = ocupada
              ? 'badge bg-amber-500/15 text-amber-400 border border-amber-500/20'
              : suspendida
                ? 'badge bg-slate-500/15 text-slate-400 border border-slate-500/20'
                : 'badge bg-green-500/15 text-green-400 border border-green-500/20';
            const badgeLabel = ocupada ? 'OCUPADA' : suspendida ? 'SUSPENDIDA' : 'LIBRE';
            return (
              <div
                key={mesa.id}
                className={`glass-card p-4 flex flex-col gap-3 border-t-4 ${borderColor} ${suspendida ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-dark-50">{mesa.nombre}</h3>
                    <p className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
                      <HiOutlineUserGroup className="w-3.5 h-3.5" />
                      {mesa.capacidad} personas
                    </p>
                  </div>
                  <span className={badgeClass}>{badgeLabel}</span>
                </div>

                {ocupada && (
                  <div className="bg-dark-900/50 rounded-xl p-3">
                    <p className="text-xs text-dark-400">Consumo pendiente</p>
                    <p className="text-xl font-bold text-primary-400">{moneda} {Number(mesa.total_pendiente).toFixed(2)}</p>
                    <p className="text-xs text-dark-500 mt-0.5">{mesa.cantidad_comandas} comanda{mesa.cantidad_comandas === 1 ? '' : 's'}</p>
                  </div>
                )}

                {suspendida ? (
                  isAdmin() && (
                    <button
                      onClick={() => handleReactivarMesa(mesa)}
                      className="btn-secondary mt-auto text-sm py-2 flex items-center justify-center gap-1.5"
                    >
                      <HiOutlinePlay className="w-4 h-4" />
                      Reactivar
                    </button>
                  )
                ) : (
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => navigate(`/pos?mesa=${mesa.id}`)}
                      className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1.5"
                    >
                      <HiOutlineShoppingCart className="w-4 h-4" />
                      {ocupada ? 'Agregar' : 'Abrir'}
                    </button>
                    {ocupada && (
                      <button
                        onClick={() => openCobrar(mesa)}
                        className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5"
                      >
                        <HiOutlineCash className="w-4 h-4" />
                        Cobrar
                      </button>
                    )}
                  </div>
                )}

                {isAdmin() && (
                  <div className="flex gap-2 justify-end pt-1 border-t border-dark-700/50 -mx-4 px-4 -mb-4 pb-2 mt-1">
                    {!ocupada && !suspendida && (
                      <button
                        onClick={() => handleSuspenderMesa(mesa)}
                        className="p-1.5 text-dark-400 hover:text-slate-300 transition-colors"
                        title="Suspender mesa"
                      >
                        <HiOutlinePause className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => openEditForm(mesa)} className="p-1.5 text-dark-400 hover:text-primary-400 transition-colors">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMesa(mesa)}
                      disabled={ocupada}
                      className="p-1.5 text-dark-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={ocupada ? 'No se puede eliminar una mesa ocupada' : 'Eliminar mesa'}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: crear/editar mesa */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={editingMesa ? 'Editar Mesa' : 'Nueva Mesa'} size="sm">
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="label-field">Nombre / Número</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="input-field"
              placeholder="Ej. Mesa 1, Terraza 3..."
            />
          </div>
          <div>
            <label className="label-field">Capacidad (personas)</label>
            <input
              type="number"
              min="1"
              required
              value={formData.capacidad}
              onChange={(e) => setFormData({ ...formData, capacidad: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3">
            {editingMesa ? 'Guardar Cambios' : 'Crear Mesa'}
          </button>
        </form>
      </Modal>

      {/* Modal: cobrar cuenta de la mesa */}
      <Modal isOpen={!!cobrarMesa} onClose={() => setCobrarMesa(null)} title={`Cobrar ${cobrarMesa?.nombre || ''}`} size="md">
        {!cuenta ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-dark-900/50 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
              {cuenta.comandas.map((comanda) => (
                <div key={comanda.id}>
                  <p className="text-xs text-dark-500 mb-1">Comanda #{comanda.id} — {new Date(comanda.fecha).toLocaleTimeString('es-PE')}</p>
                  {comanda.detalles.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm pl-2">
                      <span className="text-dark-400">{item.cantidad}x {item.producto_nombre}</span>
                      <span className="text-dark-200 font-medium">{moneda} {(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-dark-400 font-medium">Total de la cuenta</span>
              <span className="text-2xl font-bold text-primary-400">{moneda} {cuenta.total.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <p className="label-field">Métodos de pago</p>
              {pagos.map((pago, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={pago.metodo_pago}
                    onChange={(e) => updatePagoLine(index, 'metodo_pago', e.target.value)}
                    className="input-field flex-1"
                  >
                    {paymentMethodOptions.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pago.monto}
                    onChange={(e) => updatePagoLine(index, 'monto', e.target.value)}
                    className="input-field w-32"
                    placeholder="0.00"
                  />
                  {pagos.length > 1 && (
                    <button onClick={() => removePagoLine(index)} className="p-2 text-dark-500 hover:text-red-400 transition-colors">
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addPagoLine} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <HiOutlinePlus className="w-4 h-4" />
                Agregar método de pago
              </button>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
              Math.abs(restante) < 0.01 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <span>Restante por asignar</span>
              <span className="font-bold">{moneda} {restante.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCobrar}
              disabled={cobrando || Math.abs(restante) > 0.01}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {cobrando ? (
                <div className="w-6 h-6 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
              ) : (
                <>
                  <HiOutlineCheckCircle className="w-6 h-6" />
                  Confirmar Cobro
                </>
              )}
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default MesasPage;
