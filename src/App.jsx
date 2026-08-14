import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import POSPage from './pages/POSPage';
import SalesPage from './pages/SalesPage';
import UsersPage from './pages/UsersPage';
import MenuPage from './pages/MenuPage';
import SettingsPage from './pages/SettingsPage';
import CajaPage from './pages/CajaPage';
import KitchenPage from './pages/KitchenPage';
import MesasPage from './pages/MesasPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-dark-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.rol !== 'ADMIN') return <Navigate to="/pos" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/pos" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
          <Toaster
            position="top-right"
            gutter={12}
            containerStyle={{ top: 20, right: 20 }}
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(16px)',
                color: '#e2e8f0',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '14px 18px',
                boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.05)',
                maxWidth: '420px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
                style: {
                  borderLeft: '4px solid #22c55e',
                },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
                style: {
                  borderLeft: '4px solid #ef4444',
                },
                duration: 4000,
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/dashboard" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute adminOnly><ProductsPage /></ProtectedRoute>} />
            <Route path="/kitchen" element={<ProtectedRoute><KitchenPage /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
            <Route path="/mesas" element={<ProtectedRoute><MesasPage /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
            <Route path="/caja" element={<ProtectedRoute><CajaPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
