import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { dashboardService } from '../services/dashboardService';
import { productService } from '../services/productService';
import { useSettings } from '../context/SettingsContext';
import { HiOutlineCash, HiOutlineShoppingCart, HiOutlineCube, HiOutlineExclamation, HiOutlineTrendingUp, HiOutlineUsers } from 'react-icons/hi';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const DashboardPage = () => {
  const { settings } = useSettings();
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, topRes, chartRes, lowStockRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTopProducts(),
        dashboardService.getSalesChart(),
        productService.getLowStock(),
      ]);
      setStats(statsRes.data);
      setTopProducts(topRes.data);
      setChartData(chartRes.data);
      setLowStockProducts(lowStockRes.data);
    } catch (error) {
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const moneda = settings?.moneda || 'S/';

  const statCards = stats ? [
    { label: 'Ventas Hoy', value: `${moneda} ${Number(stats.ventas_diarias).toFixed(2)}`, sub: `${stats.num_ventas_hoy} transacciones`, icon: HiOutlineCash, color: 'from-green-400 to-emerald-500', shadow: 'shadow-green-500/25' },
    { label: 'Ventas del Mes', value: `${moneda} ${Number(stats.ventas_mensuales).toFixed(2)}`, sub: `${stats.num_ventas_mes} transacciones`, icon: HiOutlineTrendingUp, color: 'from-primary-400 to-primary-600', shadow: 'shadow-primary-500/25' },
    { label: 'Productos', value: stats.total_productos, sub: 'En catálogo', icon: HiOutlineCube, color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/25' },
    { label: 'Bajo Stock', value: stats.productos_bajo_stock, sub: 'Requieren atención', icon: HiOutlineExclamation, color: 'from-red-400 to-red-600', shadow: 'shadow-red-500/25' },
  ] : [];

  const barChartData = chartData ? {
    labels: chartData.daily.map(d => {
      const date = new Date(d.dia);
      return date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: `Ventas (${moneda})`,
      data: chartData.daily.map(d => d.total),
      backgroundColor: 'rgba(245, 158, 11, 0.3)',
      borderColor: 'rgba(245, 158, 11, 0.8)',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }]
  } : null;

  const doughnutData = topProducts.length > 0 ? {
    labels: topProducts.map(p => p.nombre),
    datasets: [{
      data: topProducts.map(p => p.total_vendido),
      backgroundColor: [
        'rgba(245, 158, 11, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
      borderColor: 'rgba(15, 23, 42, 1)',
      borderWidth: 3,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(100, 116, 139, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      },
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
    },
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-6 animate-fadeIn">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="stat-card group" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-dark-400 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-dark-50 mt-1">{card.value}</p>
                  <p className="text-xs text-dark-500 mt-1">{card.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} rounded-b-2xl opacity-60`}></div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="text-lg font-bold text-dark-100 mb-4">Ventas Últimos 7 Días</h3>
            <div className="h-72">
              {barChartData ? <Bar data={barChartData} options={chartOptions} /> : (
                <div className="flex items-center justify-center h-full text-dark-500">Sin datos de ventas</div>
              )}
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-dark-100 mb-4">Top Productos del Mes</h3>
            <div className="h-72 flex items-center justify-center">
              {doughnutData ? (
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } } } }} />
              ) : (
                <div className="text-dark-500 text-sm">Sin datos de ventas</div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="glass-card p-6 border-l-4 border-red-500">
            <h3 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
              <HiOutlineExclamation className="w-5 h-5 text-red-400" />
              Productos con Bajo Stock
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-dark-900/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-dark-200">{product.nombre}</p>
                    <p className="text-xs text-dark-500">{product.categoria_nombre}</p>
                  </div>
                  <span className={`badge ${product.stock <= 5 ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'}`}>
                    {product.stock} uds
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
