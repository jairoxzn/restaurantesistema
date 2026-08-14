import { HiX } from 'react-icons/hi';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} glass-card animate-scaleIn max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <h3 className="text-lg font-bold text-dark-50">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700/50 transition-all"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
