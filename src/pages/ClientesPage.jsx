import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/UI/Modal';
import { clienteService } from '../services/clienteService';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineIdentification,
  HiOutlineSearch, HiOutlineEye, HiOutlinePhone, HiOutlineMail
} from 'react-icons/hi';

const emptyForm = { nombre: '', telefono: '', email: '', notas: '' };

const ClientesPage = () => {
  const { settings } = useSettings();
  const moneda = settings?.moneda || 'S/';

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [historialCliente, setHistorialCliente] = useState(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async (params = {}) => {
    try {
      setLoading(true);
      const res = await clienteService.getAll(params);
      setClientes(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadClientes(search ? { search } : {});
  };

  const openCreate = () => {
    setEditingCliente(null);
    setForm(emptyForm);
    setFormModalOpen(true);
  };

  const openEdit = (cliente) => {
    setEditingCliente(cliente);
    setForm({ nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email || '', notas: cliente.notas || '' });
    setFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await clienteService.update(editingCliente.id, form);
        toast.success('Cliente actualizado');
      } else {
        await clienteService.create(form);
        toast.success('Cliente creado');
      }
      setFormModalOpen(false);
      loadClientes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const handleDelete = async (cliente) => {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre}? Su historial de compras se conserva, solo se desvincula.`)) return;
    try {
      await clienteService.remove(cliente.id);
      toast.success('Cliente eliminado');
      loadClientes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const openHistorial = async (cliente) => {
    setHistorialCliente({ nombre: cliente.nombre });
    setLoadingHistorial(true);
    try {
      const res = await clienteService.getById(cliente.id);
      setHistorialCliente(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar historial de compras');
      setHistorialCliente(null);
    } finally {
      setLoadingHistorial(false);
    }
  };

  return (
    <Layout title="Clientes">
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
              <HiOutlineIdentification className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-50">Clientes</h2>
              <p className="text-sm text-dark-400">{clientes.length} cliente{clientes.length === 1 ? '' : 's'} registrado{clientes.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>

        <form onSubmit={handleSearch} className="glass-card p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="input-field pl-10 py-2 text-sm"
            />
          </div>
          <button type="submit" className="btn-secondary text-sm py-2 px-4">Buscar</button>
        </form>

        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-4 text-left">Cliente</th>
                  <th className="px-6 py-4 text-left">Contacto</th>
                  <th className="px-6 py-4 text-right">Compras</th>
                  <th className="px-6 py-4 text-right">Total gastado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
                  </td></tr>
                ) : clientes.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-dark-500">
                    <HiOutlineIdentification className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hay clientes registrados todavía</p>
                    <p className="text-xs mt-1">Se agregan automáticamente desde el POS y el menú QR, o puedes crearlos aquí.</p>
                  </td></tr>
                ) : (
                  clientes.map((c) => (
                    <tr key={c.id} className="table-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {c.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-dark-100">{c.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-dark-300 flex items-center gap-1.5">
                          <HiOutlinePhone className="w-3.5 h-3.5 text-dark-500" />
                          {c.telefono}
                        </p>
                        {c.email && (
                          <p className="text-xs text-dark-500 flex items-center gap-1.5 mt-0.5">
                            <HiOutlineMail className="w-3 h-3" />
                            {c.email}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-dark-200">{c.total_compras}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-primary-400">{moneda} {c.total_gastado.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openHistorial(c)} className="p-2 rounded-lg text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Ver historial de compras">
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all" title="Editar">
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Eliminar">
                            <HiOutlineTrash className="w-4 h-4" />
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

      {/* Modal: crear/editar cliente */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nombre</label>
            <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label-field">Teléfono</label>
            <input type="tel" required value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input-field" placeholder="987654321" />
          </div>
          <div>
            <label className="label-field">Email (opcional)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label-field">Notas (opcional)</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="input-field" rows={2} />
          </div>
          <button type="submit" className="btn-primary w-full py-3">{editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}</button>
        </form>
      </Modal>

      {/* Modal: historial de compras */}
      <Modal isOpen={!!historialCliente} onClose={() => setHistorialCliente(null)} title={`Historial — ${historialCliente?.nombre || ''}`} size="md">
        {loadingHistorial ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : !historialCliente?.ventas?.length ? (
          <div className="text-center py-8 text-dark-500">
            <p>Este cliente todavía no tiene compras registradas.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historialCliente.ventas.map((v) => (
              <div key={v.id} className="bg-dark-900/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-dark-100">#{String(v.id).padStart(6, '0')}</span>
                  <span className="text-sm font-bold text-primary-400">{moneda} {Number(v.total).toFixed(2)}</span>
                </div>
                <p className="text-xs text-dark-500 mb-2">{new Date(v.fecha).toLocaleString('es-PE')}</p>
                <p className="text-xs text-dark-400">
                  {v.detalles.map(d => `${d.cantidad}x ${d.producto_nombre}`).join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default ClientesPage;
