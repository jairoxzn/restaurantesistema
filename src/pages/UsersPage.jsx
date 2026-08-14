import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/UI/Modal';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUsers, HiOutlineShieldCheck } from 'react-icons/hi';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'EMPLEADO' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await userService.getAll();
      setUsers(res.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ nombre: '', email: '', password: '', rol: 'EMPLEADO' });
    setIsModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ nombre: user.nombre, email: user.email, password: '', rol: user.rol });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const data = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.password) data.password = form.password;
        await userService.update(editingUser.id, data);
        toast.success('Usuario actualizado');
      } else {
        await userService.create(form);
        toast.success('Usuario creado');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-lg">⚠️</span>
          <span className="font-semibold text-dark-100">¿Eliminar este usuario?</span>
        </div>
        <p className="text-sm text-dark-400">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await userService.delete(id);
                toast.success('Usuario eliminado exitosamente');
                loadUsers();
              } catch (error) {
                toast.error(error.response?.data?.message || 'Error al eliminar usuario');
              }
            }}
            className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-2 bg-dark-600 hover:bg-dark-500 text-dark-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      style: {
        background: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderLeft: '4px solid #ef4444',
        maxWidth: '360px',
      },
    });
  };

  return (
    <Layout title="Gestión de Usuarios">
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <p className="text-dark-400">{users.length} usuarios registrados</p>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <div key={user.id} className="glass-card-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-dark-900 font-bold text-lg shadow-lg shadow-primary-500/20">
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-100">{user.nombre}</h3>
                      <p className="text-xs text-dark-400">{user.email}</p>
                    </div>
                  </div>
                  <span className={user.rol === 'ADMIN' ? 'badge-admin' : 'badge-employee'}>
                    {user.rol === 'ADMIN' && <HiOutlineShieldCheck className="w-3.5 h-3.5 mr-1" />}
                    {user.rol}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-dark-700/30">
                  <span className="text-xs text-dark-500">
                    Creado: {new Date(user.created_at).toLocaleDateString('es-PE')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(user)} className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12 text-dark-500">
            <HiOutlineUsers className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hay usuarios registrados</p>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="label-field">Contraseña {editingUser && <span className="text-dark-500">(dejar vacío para no cambiar)</span>}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" {...(!editingUser && { required: true, minLength: 6 })} placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'} />
          </div>
          <div>
            <label className="label-field">Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="input-field">
              <option value="EMPLEADO">Empleado</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editingUser ? 'Actualizar' : 'Crear Usuario'}</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default UsersPage;
