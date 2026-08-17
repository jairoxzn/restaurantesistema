import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineCash,
  HiOutlineQrcode,
  HiOutlineCog,
  HiOutlineCalculator,
  HiOutlineFire,
  HiOutlineClipboardCheck,
  HiOutlineIdentification,
  HiX
} from 'react-icons/hi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const API_URL = '';
  const [isQrOpen, setIsQrOpen] = useState(false);

  const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}/uploads/${url}`;
  };

  const links = [
    ...(isAdmin() ? [{ to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' }] : []),
    { to: '/kitchen', icon: HiOutlineFire, label: 'Cocina (KDS)' },
    { to: '/pos', icon: HiOutlineShoppingCart, label: 'Punto de Venta' },
    { to: '/mesas', icon: HiOutlineClipboardList, label: 'Mesas' },
    { to: '/caja', icon: HiOutlineCalculator, label: 'Caja y Gastos' },
    ...(isAdmin() ? [{ to: '/products', icon: HiOutlineCube, label: 'Productos' }] : []),
    { to: '/sales', icon: HiOutlineCash, label: 'Historial Ventas' },
    ...(isAdmin() ? [{ to: '/users', icon: HiOutlineUsers, label: 'Usuarios' }] : []),
    ...(isAdmin() ? [{ to: '/clientes', icon: HiOutlineIdentification, label: 'Clientes' }] : []),
    ...(isAdmin() ? [{ to: '/activity', icon: HiOutlineClipboardCheck, label: 'Registro de Actividad' }] : []),
    ...(isAdmin() ? [{ to: '/settings', icon: HiOutlineCog, label: 'Configuración' }] : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-dark-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0 overflow-hidden border border-primary-500/30">
                {settings?.logo_url ? (
                  <img src={getLogoUrl(settings.logo_url)} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl">☕</span>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-dark-50">{settings?.nombre_cafeteria || 'Cafetería'}</h1>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-dark-400 hover:text-dark-200 transition-colors">
              <HiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-4 mb-3">Menú</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
          
          <button
            onClick={() => { setIsQrOpen(true); onClose(); }}
            className="sidebar-link w-full text-left mt-2 border border-primary-500/30 text-primary-400 hover:text-white"
          >
            <HiOutlineQrcode className="w-5 h-5" />
            <span>Generar QR del Menú</span>
          </button>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-dark-700/50">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-dark-900 font-bold text-sm">
                {user?.nombre?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-100 truncate">{user?.nombre}</p>
                <p className="text-xs text-dark-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={user?.rol === 'ADMIN' ? 'badge-admin' : 'badge-employee'}>
                {user?.rol}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
              >
                <HiOutlineLogout className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* QR Modal */}
      {isQrOpen && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-3xl shadow-2xl max-w-sm w-full animate-slideUp overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-dark-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineQrcode className="text-primary-500 w-6 h-6" />
                Menú Digital QR
              </h3>
              <button 
                onClick={() => setIsQrOpen(false)}
                className="w-8 h-8 rounded-full bg-dark-800 text-dark-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
                <QRCodeSVG 
                  value={`${window.location.origin}/menu`}
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#0f172a"}
                  level={"Q"}
                  includeMargin={false}
                />
              </div>
              <p className="text-center text-dark-300 mb-4">
                Imprime o muestra este código QR para que tus clientes puedan escanearlo y ver el menú digital.
              </p>
              
              <div className="w-full bg-dark-950 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-xs text-dark-400 truncate mr-2">{`${window.location.origin}/menu`}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/menu`);
                    alert('Enlace copiado');
                  }}
                  className="px-3 py-1 bg-dark-800 text-xs font-medium text-white rounded-lg hover:bg-primary-500 transition-colors"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
