import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Modal from '../components/UI/Modal';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { saleService } from '../services/saleService';
import { mesaService } from '../services/mesaService';
import { clienteService } from '../services/clienteService';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import { generateSaleReceipt, printKitchenTicket } from '../utils/receipt';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlineMinus, HiOutlineTrash,
  HiOutlineShoppingCart, HiOutlineCash, HiOutlineCreditCard,
  HiOutlinePhotograph, HiOutlineX, HiOutlineCheckCircle, HiOutlineDocumentText,
  HiOutlineViewGrid, HiOutlineArrowLeft, HiOutlineIdentification, HiOutlineCheck
} from 'react-icons/hi';

const API_URL = '';

const POSPage = () => {
  const [searchParams] = useSearchParams();
  const mesaId = searchParams.get('mesa');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [processing, setProcessing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [mesaCuenta, setMesaCuenta] = useState(null);

  // Cliente opcional al cobrar (autocompleta si ya existe por teléfono)
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  const { items, addItem, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCart();
  const { settings } = useSettings();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (mesaId) loadMesaCuenta();
  }, [mesaId]);

  const loadMesaCuenta = async () => {
    try {
      const res = await mesaService.getCuenta(mesaId);
      setMesaCuenta(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar la cuenta de la mesa');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timer);
  }, [search, activeCategory]);

  // Autocompletar cliente por teléfono mientras se escribe (con debounce)
  useEffect(() => {
    const telefonoLimpio = clienteTelefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 6) {
      setClienteEncontrado(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setBuscandoCliente(true);
        const res = await clienteService.buscarPorTelefono(telefonoLimpio);
        if (res.data) {
          setClienteNombre(res.data.nombre);
          setClienteEncontrado(true);
        } else {
          setClienteEncontrado(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setBuscandoCliente(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [clienteTelefono]);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (activeCategory) params.categoria_id = activeCategory;
      const res = await productService.getAll(params);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePayment = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    try {
      const saleData = {
        items: items.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
        })),
        metodo_pago: metodoPago,
        ...(clienteTelefono.replace(/\D/g, '').length >= 6 && {
          cliente_telefono: clienteTelefono,
          cliente_nombre: clienteNombre || undefined,
        }),
      };
      const response = await saleService.create(saleData);
      toast.success('¡Venta registrada exitosamente!');
      generateSaleReceipt(response.data.sale, settings);
      clearCart();
      setPaymentModalOpen(false);
      setClienteTelefono('');
      setClienteNombre('');
      setClienteEncontrado(false);
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    try {
      const saleData = {
        items: items.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
        })),
        mesa_id: mesaId,
      };
      const response = await saleService.create(saleData);
      toast.success('¡Pedido enviado a cocina!');
      if (response.data?.sale) {
        printKitchenTicket(response.data.sale, settings);
      }
      clearCart();
      setShowCart(false);
      loadProducts();
      loadMesaCuenta();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar el pedido');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'efectivo', label: 'Efectivo', icon: HiOutlineCash, color: 'from-green-400 to-emerald-500' },
    { id: 'yape', label: 'Yape', icon: HiOutlineCreditCard, color: 'from-purple-400 to-purple-600' },
    { id: 'plin', label: 'Plin', icon: HiOutlineCreditCard, color: 'from-teal-400 to-cyan-600' },
    { id: 'tarjeta', label: 'Tarjeta', icon: HiOutlineCreditCard, color: 'from-blue-400 to-blue-600' },
  ];

  return (
    <Layout title={mesaId ? `Pedido - ${mesaCuenta?.mesa?.nombre || 'Mesa'}` : 'Punto de Venta'}>
      {mesaId && (
        <div className="glass-card p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <HiOutlineViewGrid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-100">Pidiendo para {mesaCuenta?.mesa?.nombre || 'la mesa'}</p>
              <p className="text-xs text-dark-400">
                Consumo previo: {settings?.moneda || 'S/'} {(mesaCuenta?.total || 0).toFixed(2)} ({mesaCuenta?.comandas?.length || 0} comanda{mesaCuenta?.comandas?.length === 1 ? '' : 's'})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/mesas" className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <HiOutlineArrowLeft className="w-4 h-4" />
              Volver a Mesas
            </Link>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-fadeIn">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search & Category Filter */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12"
                placeholder="Buscar producto..."
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                onClick={() => setActiveCategory('')}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  !activeCategory ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/25' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                }`}
              >
                Todos
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeCategory === c.id ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/25' : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.filter(p => p.stock > 0).map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addItem(product);
                      toast.success(`${product.nombre} agregado`, { duration: 1000, icon: '☕' });
                    }}
                    className="glass-card-hover p-3 text-left group active:scale-95 transition-transform"
                  >
                    <div className="w-full h-24 bg-dark-700/50 rounded-xl mb-3 overflow-hidden">
                      {product.imagen ? (
                        <img src={`${API_URL}/uploads/${product.imagen}`} alt={product.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">☕</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-dark-100 truncate">{product.nombre}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-bold text-primary-400">{settings?.moneda || 'S/'} {Number(product.precio).toFixed(2)}</p>
                      <span className="text-xs text-dark-500">{product.stock} uds</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Cart Toggle */}
          {items.length > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="lg:hidden fixed bottom-6 right-6 btn-primary rounded-full w-16 h-16 flex items-center justify-center shadow-2xl z-30 animate-pulse-glow"
            >
              <HiOutlineShoppingCart className="w-7 h-7" />
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-xs text-white font-bold flex items-center justify-center">
                {getItemCount()}
              </span>
            </button>
          )}
        </div>

        {/* Cart Section */}
        <>
          {showCart && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setShowCart(false)} />}
          <div className={`
            fixed top-0 right-0 h-full w-80 z-50 lg:relative lg:z-auto lg:w-96
            transform transition-transform duration-300 
            ${showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            glass-card flex flex-col
          `}>
            <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                <HiOutlineShoppingCart className="w-5 h-5 text-primary-400" />
                Carrito ({getItemCount()})
              </h3>
              <button onClick={() => setShowCart(false)} className="lg:hidden p-2 rounded-lg text-dark-400 hover:bg-dark-700/50">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-dark-500">
                  <HiOutlineShoppingCart className="w-16 h-16 mb-3 opacity-30" />
                  <p className="text-sm">Carrito vacío</p>
                  <p className="text-xs mt-1">Selecciona productos para agregar</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="bg-dark-900/50 rounded-xl p-3 animate-slideInRight">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-dark-100 truncate">{item.nombre}</h4>
                        <p className="text-xs text-primary-400">{settings?.moneda || 'S/'} {Number(item.precio).toFixed(2)} c/u</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-dark-500 hover:text-red-400 transition-colors p-1">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-300 transition-colors"
                        >
                          <HiOutlineMinus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-dark-100">{item.cantidad}</span>
                        <button
                          onClick={() => updateQuantity(item.id, Math.min(item.cantidad + 1, item.stock))}
                          className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-300 transition-colors"
                        >
                          <HiOutlinePlus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-dark-100">{settings?.moneda || 'S/'} {(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-dark-700/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400 font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary-400">{settings?.moneda || 'S/'} {getTotal().toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearCart} className="btn-danger flex-1 text-sm py-3">
                    Limpiar
                  </button>
                  {mesaId ? (
                    <button
                      onClick={handleSendToKitchen}
                      disabled={processing}
                      className="btn-primary flex-1 text-sm py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing ? (
                        <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <HiOutlineDocumentText className="w-5 h-5" />
                          Enviar a Cocina
                        </>
                      )}
                    </button>
                  ) : (
                    <button onClick={() => setPaymentModalOpen(true)} className="btn-primary flex-1 text-sm py-3 flex items-center justify-center gap-2">
                      <HiOutlineCash className="w-5 h-5" />
                      Cobrar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      </div>

      {/* Payment Modal (solo para ventas para llevar; las comandas de mesa se cobran desde /mesas) */}
      <Modal isOpen={!mesaId && paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Procesar Pago" size="sm">
        <div className="space-y-6">
          <div className="text-center py-4">
            <p className="text-dark-400 text-sm mb-1">Total a pagar</p>
            <p className="text-4xl font-bold text-primary-400">{settings?.moneda || 'S/'} {getTotal().toFixed(2)}</p>
            <p className="text-dark-500 text-xs mt-1">{getItemCount()} productos</p>
          </div>

          <div>
            <p className="label-field flex items-center gap-1.5">
              <HiOutlineIdentification className="w-4 h-4" />
              Cliente (opcional)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="tel"
                  value={clienteTelefono}
                  onChange={(e) => { setClienteTelefono(e.target.value); setClienteEncontrado(false); }}
                  className="input-field text-sm py-2"
                  placeholder="Teléfono"
                />
                {buscandoCliente && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                )}
                {!buscandoCliente && clienteEncontrado && (
                  <HiOutlineCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                )}
              </div>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="input-field text-sm py-2"
                placeholder="Nombre"
                readOnly={clienteEncontrado}
              />
            </div>
            {clienteEncontrado && (
              <p className="text-xs text-green-400 mt-1">Cliente frecuente encontrado ✓</p>
            )}
          </div>

          <div>
            <p className="label-field">Método de pago</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setMetodoPago(method.id)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${
                    metodoPago === method.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600 bg-dark-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                    <method.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-dark-300">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-dark-900/50 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-dark-400">{item.cantidad}x {item.nombre}</span>
                <span className="text-dark-200 font-medium">{settings?.moneda || 'S/'} {(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <div className="w-6 h-6 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
            ) : (
              <>
                <HiOutlineCheckCircle className="w-6 h-6" />
                Confirmar Venta
              </>
            )}
          </button>
        </div>
      </Modal>
    </Layout>
  );
};

export default POSPage;
