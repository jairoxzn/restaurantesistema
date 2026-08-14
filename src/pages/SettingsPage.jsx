import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { useSettings } from '../context/SettingsContext';
import { HiOutlineCog, HiOutlineCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { settings, updateSettings, loadingSettings } = useSettings();
  const [formData, setFormData] = useState({
    nombre_cafeteria: '',
    logo_url: '',
    logo: null,
    moneda: '',
    tema_color: ''
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = '';

  useEffect(() => {
    if (settings && !loadingSettings) {
      setFormData({
        nombre_cafeteria: settings.nombre_cafeteria || '',
        logo_url: settings.logo_url || '',
        logo: null,
        moneda: settings.moneda || 'S/',
        tema_color: settings.tema_color || 'amber'
      });
      if (settings.logo_url) {
        setLogoPreview(settings.logo_url.startsWith('http') ? settings.logo_url : `${API_URL}/uploads/${settings.logo_url}`);
      }
    }
  }, [settings, loadingSettings]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo') {
      const file = files[0];
      if (file) {
        setFormData(prev => ({ ...prev, logo: file }));
        setLogoPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = new FormData();
      data.append('nombre_cafeteria', formData.nombre_cafeteria);
      data.append('moneda', formData.moneda);
      data.append('tema_color', formData.tema_color);
      
      if (formData.logo) {
        data.append('logo', formData.logo);
      } else if (formData.logo_url) {
        data.append('logo_url', formData.logo_url);
      }

      await updateSettings(data);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const themes = [
    { id: 'amber', name: 'Naranja (Por defecto)', color: 'bg-amber-500' },
    { id: 'blue', name: 'Azul', color: 'bg-blue-500' },
    { id: 'green', name: 'Verde', color: 'bg-green-500' },
    { id: 'rose', name: 'Rosa', color: 'bg-rose-500' },
    { id: 'purple', name: 'Morado', color: 'bg-purple-500' }
  ];

  if (loadingSettings) {
    return (
      <Layout title="Configuración">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Configuración del Sistema">
      <div className="max-w-2xl animate-fadeIn">
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <HiOutlineCog className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ajustes Generales</h2>
              <p className="text-dark-400 text-sm">Personaliza la apariencia y detalles de tu negocio</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-field">Nombre de la Cafetería</label>
                <input
                  type="text"
                  name="nombre_cafeteria"
                  value={formData.nombre_cafeteria}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej. Mi Cafetería"
                  required
                />
              </div>
              
              <div>
                <label className="label-field">Símbolo de Moneda</label>
                <input
                  type="text"
                  name="moneda"
                  value={formData.moneda}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej. S/ o $"
                  required
                />
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <label className="label-field">Logo del Negocio (Opcional)</label>
              <div className="flex items-center gap-4 mt-2">
                <div className="w-16 h-16 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">☕</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    onChange={handleChange}
                    className="block w-full text-sm text-dark-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20 transition-all"
                  />
                  <p className="text-xs text-dark-500 mt-2">Sube una imagen para tu logo o mantén el actual.</p>
                </div>
              </div>
            </div>

            {/* Tema de Color */}
            <div>
              <label className="label-field mb-3">Color Principal del Sistema</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tema_color: theme.id }))}
                    className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300
                      ${formData.tema_color === theme.id 
                        ? 'bg-dark-800 border-primary-500/50 shadow-lg shadow-primary-500/10' 
                        : 'bg-dark-900/50 border-dark-700 hover:border-dark-500 hover:bg-dark-800'}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${theme.color} flex items-center justify-center shadow-md`}>
                      {formData.tema_color === theme.id && <HiOutlineCheck className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-xs font-medium text-dark-300 text-center">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
