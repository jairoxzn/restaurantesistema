import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import Modal from '../components/UI/Modal';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { kardexService } from '../services/kardexService';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, 
  HiOutlinePhotograph, HiOutlineCube, HiOutlineClipboardList, HiOutlineDownload 
} from 'react-icons/hi';
import { exportKardexReportExcel, exportKardexReportPDF } from '../utils/exportReports';

const API_URL = '';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '', imagen: null });

  // Kardex States
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [selectedProductKardex, setSelectedProductKardex] = useState(null);
  const [kardexHistory, setKardexHistory] = useState([]);
  const [kardexForm, setKardexForm] = useState({ tipo: 'INGRESO', cantidad: '', motivo: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timer);
  }, [search, filterCat]);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCat) params.categoria_id = filterCat;
      const res = await productService.getAll(params);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ nombre: '', descripcion: '', precio: '', stock: '', categoria_id: categories[0]?.id || '', imagen: null });
    setIsModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio,
      stock: product.stock,
      categoria_id: product.categoria_id,
      imagen: null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', form.nombre);
    formData.append('descripcion', form.descripcion);
    formData.append('precio', form.precio);
    formData.append('stock', form.stock);
    formData.append('categoria_id', form.categoria_id);
    if (form.imagen) formData.append('imagen', form.imagen);

    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
        toast.success('Producto actualizado');
      } else {
        await productService.create(formData);
        toast.success('Producto creado');
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-lg">⚠️</span>
          <span className="font-semibold text-dark-100">¿Eliminar este producto?</span>
        </div>
        <p className="text-sm text-dark-400">Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await productService.delete(id);
                toast.success('Producto eliminado exitosamente');
                loadProducts();
              } catch (error) {
                toast.error('Error al eliminar producto');
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

  // Kardex functions
  const openKardex = async (product) => {
    try {
      setSelectedProductKardex(product);
      setKardexForm({ tipo: 'INGRESO', cantidad: '', motivo: '' });
      setIsKardexModalOpen(true);
      const res = await kardexService.getProductKardex(product.id);
      setKardexHistory(res.data.historial);
    } catch (error) {
      toast.error('Error al cargar historial de Kardex');
    }
  };

  const handleKardexSubmit = async (e) => {
    e.preventDefault();
    try {
      await kardexService.addMovement(selectedProductKardex.id, {
        tipo: kardexForm.tipo,
        cantidad: Number(kardexForm.cantidad),
        motivo: kardexForm.motivo
      });
      toast.success('Movimiento registrado en Kardex');
      
      // Recargar historial y productos para actualizar stock
      const res = await kardexService.getProductKardex(selectedProductKardex.id);
      setKardexHistory(res.data.historial);
      setKardexForm({ tipo: 'INGRESO', cantidad: '', motivo: '' });
      loadProducts(); // Update product grid
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar movimiento');
    }
  };

  return (
    <Layout title="Gestión de Productos">
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
                placeholder="Buscar productos..."
              />
            </div>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="input-field max-w-[200px]"
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className="glass-card-hover overflow-hidden group">
                <div className="h-40 bg-dark-700/50 relative overflow-hidden">
                  {product.imagen ? (
                    <img
                      src={`${API_URL}/uploads/${product.imagen}`}
                      alt={product.nombre}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HiOutlinePhotograph className="w-12 h-12 text-dark-600" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`badge ${product.stock <= 10 ? 'bg-red-500/80 text-white' : 'bg-dark-900/80 text-dark-200'} backdrop-blur-sm`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-dark-100">{product.nombre}</h3>
                      <p className="text-xs text-primary-400">{product.categoria_nombre}</p>
                    </div>
                    <p className="text-lg font-bold text-primary-400">S/ {Number(product.precio).toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-dark-400 mb-4 line-clamp-2">{product.descripcion}</p>
                  
                  <div className="flex flex-col gap-2 mt-auto">
                    <button onClick={() => openKardex(product)} className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 border-primary-500/30 text-primary-300 hover:bg-primary-500/10">
                      <HiOutlineClipboardList className="w-4 h-4" />
                      Kardex / Stock
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(product)} className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1.5">
                        <HiOutlinePencil className="w-4 h-4" />
                        Editar
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="btn-danger text-xs py-2 px-3">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12 text-dark-500">
            <HiOutlineCube className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nombre</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="label-field">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Precio (S/)</label>
              <input type="number" step="0.01" min="0" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label-field">Stock</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="label-field">Categoría</label>
            <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} className="input-field" required>
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Imagen</label>
            <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })} className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-500/10 file:text-primary-400 file:font-medium file:cursor-pointer" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editingProduct ? 'Actualizar' : 'Crear Producto'}</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Kardex Modal */}
      <Modal isOpen={isKardexModalOpen} onClose={() => setIsKardexModalOpen(false)} title={`Kardex: ${selectedProductKardex?.nombre}`} size="lg">
        <div className="space-y-6">
          <form onSubmit={handleKardexSubmit} className="bg-dark-900/50 p-4 rounded-xl border border-white/5 space-y-4">
            <h4 className="text-sm font-semibold text-white">Registrar Movimiento de Inventario</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-field">Tipo</label>
                <select value={kardexForm.tipo} onChange={(e) => setKardexForm({ ...kardexForm, tipo: e.target.value })} className="input-field py-2 text-sm" required>
                  <option value="INGRESO">Ingreso (Compra)</option>
                  <option value="MERMA">Merma (Pérdida)</option>
                  <option value="AJUSTE">Ajuste Manual</option>
                </select>
              </div>
              <div>
                <label className="label-field">Cantidad</label>
                <input type="number" min="1" value={kardexForm.cantidad} onChange={(e) => setKardexForm({ ...kardexForm, cantidad: e.target.value })} className="input-field py-2 text-sm" required />
              </div>
              <div>
                <label className="label-field">Motivo (Opcional)</label>
                <input type="text" value={kardexForm.motivo} onChange={(e) => setKardexForm({ ...kardexForm, motivo: e.target.value })} className="input-field py-2 text-sm" placeholder="Ej. Compra Factura #123" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-2 text-sm">Registrar Movimiento</button>
          </form>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Historial de Movimientos</h4>
              {selectedProductKardex && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => exportKardexReportExcel(selectedProductKardex, kardexHistory)}
                    disabled={kardexHistory.length === 0}
                    className="btn-secondary text-xs py-1 px-2.5 border-green-500/30 text-green-400 hover:bg-green-500/10 flex items-center gap-1 disabled:opacity-50"
                  >
                    <HiOutlineDownload className="w-3.5 h-3.5" />
                    Excel (.xlsx)
                  </button>
                  <button 
                    onClick={() => exportKardexReportPDF(selectedProductKardex, kardexHistory)}
                    disabled={kardexHistory.length === 0}
                    className="btn-secondary text-xs py-1 px-2.5 border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-1 disabled:opacity-50"
                  >
                    <HiOutlineDownload className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-dark-400">
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Cant.</th>
                    <th className="pb-2 font-medium">Stock Final</th>
                    <th className="pb-2 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexHistory.map(k => (
                    <tr key={k.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                      <td className="py-2 text-dark-200">{new Date(k.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          k.tipo === 'INGRESO' ? 'bg-green-500/20 text-green-400' :
                          k.tipo === 'VENTA' ? 'bg-blue-500/20 text-blue-400' :
                          k.tipo === 'MERMA' ? 'bg-red-500/20 text-red-400' :
                          'bg-primary-500/20 text-primary-400'
                        }`}>
                          {k.tipo}
                        </span>
                      </td>
                      <td className="py-2 font-medium text-white">{k.tipo === 'VENTA' || k.tipo === 'MERMA' ? '-' : '+'}{k.cantidad}</td>
                      <td className="py-2 font-bold text-primary-400">{k.stock_nuevo}</td>
                      <td className="py-2 text-dark-400 text-xs truncate max-w-[150px]">{k.motivo || '-'}</td>
                    </tr>
                  ))}
                  {kardexHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-dark-500">No hay movimientos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

    </Layout>
  );
};

export default ProductsPage;
