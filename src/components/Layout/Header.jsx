import { HiOutlineMenuAlt2, HiOutlineBell } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick, title }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all"
          >
            <HiOutlineMenuAlt2 className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-dark-50">{title}</h2>
            <p className="text-xs text-dark-500 hidden sm:block">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-all">
            <HiOutlineBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-dark-700/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-dark-900 font-bold text-xs">
              {user?.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-dark-200">{user?.nombre}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
