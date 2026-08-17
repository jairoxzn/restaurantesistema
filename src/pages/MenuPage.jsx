import { useState, useEffect } from 'react';
import { publicService } from '../services/publicService';
import { clienteService } from '../services/clienteService';
import { HiOutlineShoppingCart, HiX, HiMinus, HiPlus, HiOutlineUser } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';

const CLIENTE_STORAGE_KEY = 'menu_cliente';

const MenuPage = () => {
  const { settings, loadingSettings } = useSettings();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = '';

  const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}/uploads/${url}`;
  };

  // Local cart for public menu
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Datos del cliente para el pedido por WhatsApp — se piden una vez y se
  // recuerdan en este navegador para no volver a preguntarlos.
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [clienteForm, setClienteForm] = useState({ nombre: '', telefono: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        publicService.getCategories(),
        publicService.getProducts()
      ]);
      setCategories(catsRes.data);
      setProducts(prodsRes.data);
      if (catsRes.data.length > 0) {
        setActiveCategory(catsRes.data[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.categoria_id === activeCategory);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock) {
          toast.error('Stock máximo alcanzado');
          return prev;
        }
        toast.success('Cantidad actualizada');
        return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      toast.success('Agregado al carrito');
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  const updateQuantity = (id, change) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (!existing) return prev;
      
      const newQuantity = existing.cantidad + change;
      if (newQuantity <= 0) {
        return prev.filter(item => item.id !== id);
      }
      
      const product = products.find(p => p.id === id);
      if (product && newQuantity > product.stock) {
        toast.error('Stock máximo alcanzado');
        return prev;
      }
      
      return prev.map(item => item.id === id ? { ...item, cantidad: newQuantity } : item);
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };
  
  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.cantidad, 0);
  };

  const enviarMensajeWhatsApp = (cliente) => {
    // Configura aquí el número de la cafetería
    const phoneNumber = "51999999999";

    let message = `Hola! Soy ${cliente.nombre}, quisiera hacer el siguiente pedido:\n\n`;
    cart.forEach(item => {
      message += `- ${item.cantidad}x ${item.nombre} (S/ ${Number(item.precio).toFixed(2)})\n`;
    });

    message += `\n*Total a pagar: S/ ${getCartTotal().toFixed(2)}*\n\n`;
    message += "Quedo a la espera de la confirmación.";

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');

    // Opcional: vaciar carrito después de pedir
    // setCart([]);
    // setIsCartOpen(false);
  };

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    const guardado = localStorage.getItem(CLIENTE_STORAGE_KEY);
    if (guardado) {
      enviarMensajeWhatsApp(JSON.parse(guardado));
      return;
    }

    // Primera vez en este navegador: pedimos nombre y teléfono antes de mandar el pedido.
    setClienteForm({ nombre: '', telefono: '' });
    setClienteModalOpen(true);
  };

  const handleConfirmarCliente = async (e) => {
    e.preventDefault();
    const cliente = { nombre: clienteForm.nombre.trim(), telefono: clienteForm.telefono.trim() };
    if (!cliente.nombre || !cliente.telefono) return;

    localStorage.setItem(CLIENTE_STORAGE_KEY, JSON.stringify(cliente));
    try {
      await clienteService.registrarPublico(cliente);
    } catch (error) {
      // No bloquea el pedido si el registro del cliente falla por algún motivo.
      console.error('No se pudo registrar el cliente:', error);
    }
    setClienteModalOpen(false);
    enviarMensajeWhatsApp(cliente);
  };

  const moneda = settings?.moneda || 'S/';

  if (loading || loadingSettings) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-dark-50 pb-24 font-sans selection:bg-primary-500/30">
      {/* Header */}
      <header className="bg-dark-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={getLogoUrl(settings.logo_url)} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary-500/20 border border-primary-500/30" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-xl">{settings?.nombre_cafeteria?.charAt(0) || 'C'}</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-dark-200 bg-clip-text text-transparent">{settings?.nombre_cafeteria || 'Cafetería'}</h1>
              <p className="text-xs text-primary-400 font-medium">Menú Digital</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="w-full h-48 bg-gradient-to-r from-dark-900 to-dark-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2 shadow-sm">¿Qué te provoca hoy?</h2>
          <p className="text-dark-200">Elige tus productos favoritos y haz tu pedido al instante.</p>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 snap-x">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-3 rounded-full font-medium transition-all duration-300 snap-start
                ${activeCategory === cat.id 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 ring-2 ring-primary-500/50 ring-offset-2 ring-offset-dark-950' 
                  : 'bg-dark-800/50 text-dark-300 hover:bg-dark-800 hover:text-white border border-white/5'}`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-dark-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary-500/30 transition-all duration-300 group flex flex-col h-full">
              <div className="aspect-[4/3] bg-dark-800 relative overflow-hidden">
                {product.imagen ? (
                  <img src={`/uploads/${product.imagen}`} alt={product.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-500 bg-gradient-to-br from-dark-800 to-dark-900">
                    <HiOutlineShoppingCart className="w-12 h-12 opacity-20" />
                  </div>
                )}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-dark-950/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full font-bold uppercase tracking-wider text-sm backdrop-blur-md">
                      Agotado
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1 group-hover:text-primary-400 transition-colors">{product.nombre}</h3>
                  <p className="text-dark-400 text-sm line-clamp-2">{product.descripcion}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-white">
                    {moneda} {Number(product.precio).toFixed(2)}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-400 active:scale-95 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="text-lg font-medium text-white">No hay productos disponibles</h3>
              <p className="text-dark-400 mt-1">Pronto agregaremos opciones en esta categoría.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 bg-primary-500 hover:bg-primary-400 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-primary-500/30 transition-transform active:scale-95 z-40 animate-slideUp"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center relative">
              <HiOutlineShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary-500">
                {getCartCount()}
              </span>
            </div>
            <span className="font-semibold">Ver mi pedido</span>
          </div>
          <span className="font-bold text-lg">
            {moneda} {getCartTotal().toFixed(2)}
          </span>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-dark-900 border border-white/10 w-full sm:w-[450px] max-h-[90vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slideUp">
            
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HiOutlineShoppingCart className="text-primary-500 w-6 h-6" />
                Mi Pedido
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-dark-800 text-dark-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-dark-800/50 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 h-16 bg-dark-800 rounded-xl overflow-hidden flex-shrink-0">
                    {item.imagen ? (
                      <img src={`/uploads/${item.imagen}`} alt={item.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dark-600"><HiOutlineShoppingCart /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{item.nombre}</h4>
                    <p className="text-primary-400 font-medium text-sm">{moneda} {Number(item.precio).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-dark-950 rounded-xl p-1 border border-white/5">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 flex items-center justify-center transition-colors"
                    >
                      <HiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-4 text-center font-bold text-sm">{item.cantidad}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 flex items-center justify-center transition-colors"
                    >
                      <HiPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {cart.length === 0 && (
                <div className="text-center py-8 text-dark-400">
                  El carrito está vacío
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-dark-900/90 backdrop-blur-md rounded-b-3xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-dark-300 font-medium text-lg">Total a pagar</span>
                <span className="text-2xl font-bold text-white">{moneda} {getCartTotal().toFixed(2)}</span>
              </div>
              
              <button 
                onClick={sendWhatsAppOrder}
                disabled={cart.length === 0}
                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaWhatsapp className="w-6 h-6" />
                Pedir por WhatsApp
              </button>
              <p className="text-center text-xs text-dark-500 mt-4">
                El pedido será enviado al WhatsApp de la cafetería para su preparación. Podrás pagar al recoger.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Modal: datos del cliente antes de mandar el pedido por WhatsApp (solo la primera vez) */}
      {clienteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={() => setClienteModalOpen(false)}></div>
          <div className="relative bg-dark-900 border border-white/10 w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slideUp p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400 shrink-0">
                <HiOutlineUser className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">¿A nombre de quién?</h2>
            </div>
            <p className="text-sm text-dark-400 mb-5">Solo te lo pedimos la primera vez, para que la cafetería sepa quién hace el pedido.</p>
            <form onSubmit={handleConfirmarCliente} className="space-y-4">
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">Nombre</label>
                <input
                  type="text"
                  required
                  value={clienteForm.nombre}
                  onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Tu nombre"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 font-medium mb-1.5 block">Teléfono</label>
                <input
                  type="tel"
                  required
                  value={clienteForm.telefono}
                  onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                  className="input-field"
                  placeholder="987654321"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all active:scale-95"
              >
                <FaWhatsapp className="w-5 h-5" />
                Continuar a WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MenuPage;
