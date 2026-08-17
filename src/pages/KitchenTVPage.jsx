import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { kdsService } from '../services/kdsService';
import {
  HiOutlineVolumeUp, HiOutlineVolumeOff, HiOutlineRefresh,
  HiOutlineArrowsExpand, HiX
} from 'react-icons/hi';

const SOCKET_URL = '';

// Reproduce un "beep" corto sin depender de ningún archivo de audio externo.
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.error('No se pudo reproducir el sonido de alerta:', error);
  }
};

// Pantalla de solo lectura pensada para un monitor/TV en la cocina: sin sidebar,
// sin botones de acción (esos se manejan desde /kitchen en una tablet o PC),
// letra grande y se actualiza sola por socket.io.
const KitchenTVPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const loadOrders = useCallback(async () => {
    try {
      const res = await kdsService.getOrders();
      setOrders(res.data);
    } catch (error) {
      console.error('Error al cargar pedidos de cocina:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    const socket = io(SOCKET_URL);

    socket.on('new_order', (newOrder) => {
      if (['PENDIENTE', 'PREPARANDO', 'LISTO'].includes(newOrder.estado_cocina)) {
        setOrders((prev) => {
          if (prev.find(o => o.id === newOrder.id)) return prev;
          return [...prev, newOrder];
        });
        if (soundEnabledRef.current) playBeep();
      }
    });

    socket.on('order_updated', (data) => {
      setOrders((prev) => {
        if (data.estado_cocina === 'ENTREGADO') {
          return prev.filter(o => o.id !== data.id);
        }
        return prev.map(o => o.id === data.id ? { ...o, estado_cocina: data.estado_cocina } : o);
      });
    });

    return () => socket.disconnect();
  }, [loadOrders]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleClose = () => {
    // Si se abrió con window.open (botón "Pantalla TV") se puede cerrar la pestaña;
    // si se navegó directo a la URL, el navegador no deja cerrarla por script.
    window.close();
    setTimeout(() => navigate('/kitchen'), 200);
  };

  const pendientes = orders.filter(o => o.estado_cocina === 'PENDIENTE').length;
  const preparando = orders.filter(o => o.estado_cocina === 'PREPARANDO').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDIENTE': return 'border-red-500/40 bg-red-950/20';
      case 'PREPARANDO': return 'border-yellow-500/40 bg-yellow-950/20';
      case 'LISTO': return 'border-green-500/40 bg-green-950/20';
      default: return 'border-dark-700 bg-dark-900';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'PREPARANDO': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'LISTO': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-dark-700 text-dark-300 border-dark-600';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            🔥 Cocina en Vivo
          </h1>
          <div className="flex items-center gap-4 text-lg font-semibold">
            <span className="text-red-400">{pendientes} pendientes</span>
            <span className="text-yellow-400">{preparando} preparando</span>
          </div>
        </div>

        {/* Reloj + controles */}
        <div className="flex items-center gap-4 bg-dark-900 border border-dark-800 rounded-2xl pl-5 pr-3 py-2.5">
          <div>
            <p className="text-4xl font-extrabold font-mono leading-none tabular-nums">
              {now.toLocaleTimeString('es-PE', { hour12: false })}
            </p>
            <p className="text-sm text-dark-500 capitalize mt-1">
              {now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-dark-800">
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                soundEnabled ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'bg-dark-800 border-dark-700 text-dark-400'
              }`}
              title={soundEnabled ? 'Silenciar alertas de nuevos pedidos' : 'Activar alertas de sonido'}
            >
              {soundEnabled ? <HiOutlineVolumeUp className="w-5 h-5" /> : <HiOutlineVolumeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={loadOrders}
              className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 flex items-center justify-center transition-colors"
              title="Actualizar"
            >
              <HiOutlineRefresh className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:border-dark-600 flex items-center justify-center transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              <HiOutlineArrowsExpand className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-red-400 hover:border-red-500/40 flex items-center justify-center transition-colors"
              title="Cerrar"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-dark-500">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-2xl">No hay pedidos pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <div key={order.id} className={`rounded-2xl border-2 p-5 ${getStatusColor(order.estado_cocina)}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-2xl font-bold">
                  {order.mesa_nombre ? order.mesa_nombre : `Pedido #${order.id}`}
                </h3>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusBadge(order.estado_cocina)}`}>
                  {order.estado_cocina}
                </span>
              </div>
              <p className="text-sm text-dark-400 mb-4">
                {new Date(order.fecha).toLocaleTimeString('es-PE')}
                {order.mesa_nombre && <span> · Pedido #{order.id}</span>}
              </p>
              <ul className="space-y-2">
                {order.detalles?.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="font-bold text-lg bg-dark-800 w-9 h-9 flex items-center justify-center rounded-lg border border-dark-700 shrink-0">
                      {item.cantidad}
                    </span>
                    <span className="text-lg font-medium text-dark-100">{item.producto_nombre}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenTVPage;
