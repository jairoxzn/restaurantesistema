import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Layout from '../components/Layout/Layout';
import { kdsService } from '../services/kdsService';
import { useSettings } from '../context/SettingsContext';
import { printKitchenTicket } from '../utils/receipt';
import toast from 'react-hot-toast';
import {
  HiOutlineFire, HiOutlineCheckCircle, HiOutlineClock, HiOutlinePrinter,
  HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineDesktopComputer
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = '';

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    loadOrders();

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Conectado al KDS en tiempo real');
    });

    socket.on('new_order', (newOrder) => {
      if (['PENDIENTE', 'PREPARANDO', 'LISTO'].includes(newOrder.estado_cocina)) {
        setOrders((prev) => {
          if (prev.find(o => o.id === newOrder.id)) return prev;
          return [...prev, newOrder];
        });
        toast('¡Nuevo Pedido Recibido!', {
          icon: '🔥',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
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

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await kdsService.getOrders();
      setOrders(res.data);
    } catch (error) {
      toast.error('Error al cargar pedidos de cocina');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'PENDIENTE') nextStatus = 'PREPARANDO';
    else if (currentStatus === 'PREPARANDO') nextStatus = 'LISTO';
    else if (currentStatus === 'LISTO') nextStatus = 'ENTREGADO';
    else return;

    try {
      await kdsService.updateStatus(id, nextStatus);
    } catch (error) {
      toast.error('Error al actualizar pedido');
    }
  };

  const handlePrintTicket = (order) => {
    printKitchenTicket(order, settings);
    toast.success('Comanda enviada a impresora térmica');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDIENTE': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'PREPARANDO': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'LISTO': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-dark-700 text-dark-300 border-dark-600';
    }
  };

  if (loading) {
    return (
      <Layout title="Pantalla de Cocina (KDS)">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const pendientes = orders.filter(o => o.estado_cocina === 'PENDIENTE').length;
  const preparando = orders.filter(o => o.estado_cocina === 'PREPARANDO').length;

  return (
    <Layout title="Pantalla de Cocina (KDS)">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <HiOutlineFire className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-50">Cocina</h2>
            <p className="text-sm text-dark-400">Pedidos pendientes de preparación</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            En Vivo
          </div>
          <button
            onClick={() => window.open('/kitchen/tv', '_blank')}
            className="btn-secondary flex items-center gap-2 text-sm border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
          >
            <HiOutlineDesktopComputer className="w-4 h-4" />
            Pantalla TV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl p-4 bg-dark-800/70 border border-dark-700/50 flex flex-col justify-between h-[86px]">
          <span className="text-dark-400 text-sm font-medium">Pedidos</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-white leading-none">{orders.length}</span>
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <HiOutlineViewGrid className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg flex flex-col justify-between h-[86px]">
          <span className="text-white/80 text-sm font-medium">Comandas</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-white leading-none">{preparando}</span>
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <HiOutlineClipboardList className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-red-600 to-red-500 shadow-lg flex flex-col justify-between h-[86px]">
          <span className="text-white/80 text-sm font-medium">Urgentes</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-white leading-none">{pendientes}</span>
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <HiOutlineFire className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-dark-500 glass-card">
          <HiOutlineCheckCircle className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl">No hay pedidos pendientes</p>
          <p className="text-sm mt-2">¡Buen trabajo, la cocina está al día!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-300
                ${order.estado_cocina === 'PENDIENTE' ? 'border-red-500/30 bg-red-950/10 shadow-red-500/10' : 
                  order.estado_cocina === 'PREPARANDO' ? 'border-yellow-500/30 bg-yellow-950/10 shadow-yellow-500/10' : 
                  'border-green-500/30 bg-green-950/10 shadow-green-500/10'
                } shadow-lg relative`}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-start bg-dark-900/40">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {order.mesa_nombre ? order.mesa_nombre : `Pedido #${order.id}`}
                  </h3>
                  <p className="text-xs text-dark-400 mt-1 flex items-center gap-1">
                    <HiOutlineClock className="w-3 h-3" />
                    {new Date(order.fecha).toLocaleTimeString('es-PE')}
                    {order.mesa_nombre && <span className="text-dark-500">· Pedido #{order.id}</span>}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor(order.estado_cocina)}`}>
                    {order.estado_cocina}
                  </div>
                  <button 
                    onClick={() => handlePrintTicket(order)} 
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 p-1 bg-primary-500/10 rounded-lg border border-primary-500/20"
                    title="Imprimir comanda térmica"
                  >
                    <HiOutlinePrinter className="w-4 h-4" />
                    Imprimir
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 flex-1">
                <ul className="space-y-3">
                  {order.detalles?.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 border-b border-dark-700/50 pb-2 last:border-0">
                      <span className="font-bold text-lg text-white bg-dark-800 w-8 h-8 flex items-center justify-center rounded-lg border border-dark-700">
                        {item.cantidad}
                      </span>
                      <div className="flex-1 pt-1">
                        <p className="text-lg font-medium text-dark-100 leading-tight">{item.producto_nombre}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0">
                {order.estado_cocina === 'PENDIENTE' && (
                  <button onClick={() => handleUpdateStatus(order.id, order.estado_cocina)} className="w-full py-4 rounded-xl text-lg font-bold bg-yellow-500 hover:bg-yellow-400 text-yellow-950 transition-colors shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2">
                    <HiOutlineFire className="w-6 h-6" />
                    Iniciar Preparación
                  </button>
                )}
                {order.estado_cocina === 'PREPARANDO' && (
                  <button onClick={() => handleUpdateStatus(order.id, order.estado_cocina)} className="w-full py-4 rounded-xl text-lg font-bold bg-green-500 hover:bg-green-400 text-green-950 transition-colors shadow-lg shadow-green-500/25 flex items-center justify-center gap-2">
                    <HiOutlineCheckCircle className="w-6 h-6" />
                    Marcar como Listo
                  </button>
                )}
                {order.estado_cocina === 'LISTO' && (
                  <button onClick={() => handleUpdateStatus(order.id, order.estado_cocina)} className="w-full py-3 rounded-xl text-sm font-bold bg-dark-700 hover:bg-dark-600 text-white transition-colors border border-dark-600">
                    Entregar al Cliente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default KitchenPage;
