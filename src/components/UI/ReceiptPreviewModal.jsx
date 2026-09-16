import { useRef, useState } from 'react';
import Modal from './Modal';
import { buildTicketDocument } from '../../utils/receipt';
import { HiOutlinePrinter } from 'react-icons/hi';

const MM_TO_PX = 3.78; // aproximación a 96dpi, solo para que la vista previa guarde la proporción real del ticket

// Vista previa del voucher/ticket antes de imprimir: reusa el mismo HTML/CSS
// que se manda a la impresora térmica (via buildTicketDocument), montado en
// un <iframe> para que se vea exactamente igual a lo que va a salir impreso.
const ReceiptPreviewModal = ({ isOpen, onClose, contentHtml, widthMm = 80, onPrint, title = 'Vista Previa del Voucher' }) => {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(200);

  const handleIframeLoad = () => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (doc?.body) setIframeHeight(doc.body.scrollHeight + 16);
    } catch (error) {
      console.error('No se pudo medir la vista previa del ticket:', error);
    }
  };

  const handlePrint = () => {
    onPrint?.();
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center gap-5">
        <div className="w-full flex justify-center bg-dark-950/40 rounded-xl p-4 max-h-[60vh] overflow-y-auto">
          <div
            className="bg-white shadow-lg overflow-hidden shrink-0"
            style={{ width: `${Math.round(widthMm * MM_TO_PX)}px` }}
          >
            <iframe
              ref={iframeRef}
              title="Vista previa del ticket"
              srcDoc={contentHtml ? buildTicketDocument(contentHtml, widthMm) : ''}
              onLoad={handleIframeLoad}
              style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', display: 'block' }}
              scrolling="no"
            />
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">Cerrar</button>
          <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <HiOutlinePrinter className="w-5 h-5" />
            Imprimir
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptPreviewModal;
