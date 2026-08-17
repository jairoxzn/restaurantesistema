import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBell, HiOutlineCube, HiOutlineClipboardList,
  HiOutlineCalculator, HiOutlineExclamationCircle, HiOutlineCheckCircle
} from 'react-icons/hi';
import { notificationService } from '../../services/notificationService';

const POLL_INTERVAL_MS = 60000;

const TIPO_ICON = {
  STOCK_BAJO: HiOutlineCube,
  MESA_PENDIENTE: HiOutlineClipboardList,
  CAJA_ABIERTA: HiOutlineCalculator,
};

const SEVERIDAD_STYLE = {
  alta: 'text-red-400 bg-red-500/10',
  media: 'text-amber-400 bg-amber-500/10',
  baja: 'text-blue-400 bg-blue-500/10',
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll();
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (!prev) loadNotifications();
      return !prev;
    });
  };

  const handleClickNotification = (n) => {
    setIsOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative p-2.5 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all"
      >
        <HiOutlineBell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-dark-950">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-dark-900 border border-dark-700/50 rounded-2xl shadow-2xl z-50 animate-fadeIn">
          <div className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
            <p className="text-sm font-semibold text-dark-100">Notificaciones</p>
            {loading && <div className="w-3.5 h-3.5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-dark-500">
              <HiOutlineCheckCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Todo al día, sin alertas.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-800/70">
              {notifications.map((n) => {
                const Icon = TIPO_ICON[n.tipo] || HiOutlineExclamationCircle;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-dark-800/60 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${SEVERIDAD_STYLE[n.severidad] || SEVERIDAD_STYLE.baja}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark-100">{n.titulo}</p>
                      <p className="text-xs text-dark-400 mt-0.5">{n.mensaje}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
