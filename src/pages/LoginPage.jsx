import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShoppingCart,
  HiOutlineChartSquareBar,
  HiOutlineClipboardList,
  HiArrowRight,
} from 'react-icons/hi';

const FEATURES = [
  { icon: HiOutlineShoppingCart, title: 'Punto de Venta', text: 'Cobra pedidos en segundos, en mesa o para llevar.' },
  { icon: HiOutlineClipboardList, title: 'Inventario en vivo', text: 'Stock, productos y categorías siempre al día.' },
  { icon: HiOutlineChartSquareBar, title: 'Reportes claros', text: 'Ventas, caja y desempeño de un vistazo.' },
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const API_URL = '';

  const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}/uploads/${url}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('¡Bienvenido a Cafetería Colca!');
      navigate('/pos');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const brandName = settings?.nombre_cafeteria || 'Cafetería Colca';
  const brandInitial = brandName.charAt(0) || 'C';

  return (
    <div className="min-h-screen flex bg-dark-950">
      {/* Left panel — brand / features (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-dark-900"></div>

        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-16 w-80 h-80 bg-dark-950/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        ></div>

        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-14 text-white">
          {/* Logo + brand */}
          <div className="flex items-center gap-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              {settings?.logo_url ? (
                <img src={getLogoUrl(settings.logo_url)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-xl">{brandInitial}</span>
              )}
            </div>
            <span className="font-bold text-lg tracking-tight">{brandName}</span>
          </div>

          {/* Headline + features */}
          <div className="max-w-md animate-fadeIn">
            <h1 className="text-4xl font-extrabold leading-tight mb-4">
              Gestiona tu negocio<br />sin complicaciones.
            </h1>
            <p className="text-white/80 mb-10">
              Todo lo que necesitas para operar tu cafetería o restobar, en un solo sistema rápido y simple.
            </p>

            <div className="space-y-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold leading-none mb-1">{title}</p>
                    <p className="text-sm text-white/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/50 animate-fadeIn">
            © {new Date().getFullYear()} {brandName} · Sistema de Gestión
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle background glow for the form side */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative w-full max-w-sm animate-fadeIn">
          {/* Mobile-only logo (panel is hidden below lg) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl shadow-primary-500/30 mb-3 overflow-hidden border border-primary-500/30">
              {settings?.logo_url ? (
                <img src={getLogoUrl(settings.logo_url)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">{brandInitial}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-dark-50">{brandName}</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-dark-50">Bienvenido de nuevo</h2>
            <p className="text-dark-400 text-sm mt-1.5">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Correo electrónico</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="admin@cafeteriacolca.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-field mb-0">Contraseña</label>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
              ) : (
                <>
                  Iniciar Sesión
                  <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-3 rounded-xl bg-dark-800/40 border border-dark-700/50 text-center">
            <p className="text-dark-500 text-xs">
              Demo: <span className="text-dark-400">admin@cafeteriacolca.com / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
