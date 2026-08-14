import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Imprimir directamente en ventana térmica ESC/POS / HTML ---
export const printThermalDirect = (htmlContent, title = 'Ticket', widthMm = 80) => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: ${widthMm}mm ${widthMm}mm; margin: 0; }
          html, body { width: ${widthMm}mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 2mm;
            box-sizing: border-box;
            font-size: 12px;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .subtitle { font-size: 13px; margin-bottom: 8px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .qty { font-weight: bold; width: 30px; }
          .desc { flex: 1; padding: 0 4px; }
          .price { font-weight: bold; width: 60px; text-align: right; }
          .large-qty { font-size: 18px; font-weight: bold; }
          .total-row { font-size: 14px; font-weight: bold; margin-top: 6px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            // "auto" no es un valor válido para @page size combinado con un ancho fijo,
            // así que calculamos el alto real del ticket y lo fijamos como tamaño de página
            // para que la hoja se ajuste al contenido en vez de usar Carta/A4 por defecto.
            var mmPerPx = 25.4 / 96;
            var heightMm = Math.ceil(document.body.scrollHeight * mmPerPx) + 4;
            var pageStyle = document.createElement('style');
            pageStyle.textContent = '@page { size: ${widthMm}mm ' + heightMm + 'mm; margin: 0; }';
            document.head.appendChild(pageStyle);
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// --- Imprimir Comanda de Cocina / Barra ---
export const printKitchenTicket = (order, settings, format = '80mm') => {
  const widthMm = format === '58mm' ? 58 : 80;
  const isMesa = order.mesa_nombre || order.tipo === 'MESA';
  const ubicacion = isMesa ? `MESA: ${order.mesa_nombre || 'Mesa'}` : '*** PARA LLEVAR ***';
  const fecha = new Date(order.fecha || Date.now()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = (order.detalles || []).map(item => `
    <div class="item-row" style="font-size: 14px; margin-bottom: 6px;">
      <span class="large-qty">[ ${item.cantidad}x ]</span>
      <span class="desc bold">${item.producto_nombre || item.nombre}</span>
    </div>
  `).join('');

  const html = `
    <div class="text-center bold title">*** COMANDA COCINA / BAR ***</div>
    <div class="text-center bold subtitle" style="font-size: 16px; background: #000; color: #fff; padding: 4px;">
      ${ubicacion}
    </div>
    <div class="divider"></div>
    <div class="item-row">
      <span>Orden #${order.id || 'NUEVA'}</span>
      <span>Hora: ${fecha}</span>
    </div>
    <div class="item-row">
      <span>Atendido por: ${order.usuario_nombre || order.cajero_nombre || 'Mozo/Cajero'}</span>
    </div>
    <div class="divider"></div>
    <div style="margin: 10px 0;">
      ${itemsHtml}
    </div>
    <div class="divider"></div>
    <div class="text-center bold" style="font-size: 11px; margin-top: 8px;">
      --- FIN DE COMANDA ---
    </div>
  `;

  printThermalDirect(html, `Comanda_Cocina_${order.id || 'NUEVA'}`, widthMm);
};

// --- Ticket de Cliente (Boleta Venta) ---
export const generateSaleReceipt = (sale, settings, format = '80mm') => {
  const width = format === '58mm' ? 58 : 80;
  const moneda = settings?.moneda || 'S/';

  const itemsHtml = (sale.detalles || []).map(item => `
    <div class="item-row">
      <span class="qty">${item.cantidad}</span>
      <span class="desc">${(item.producto_nombre || item.nombre).substring(0, 22)}</span>
      <span class="price">${moneda} ${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
    </div>
  `).join('');

  const html = `
    <div class="text-center title">${(settings?.nombre_cafeteria || 'CAFETERIA COLCA').toUpperCase()}</div>
    <div class="text-center">${settings?.direccion || 'Arequipa, Perú'}</div>
    <div class="text-center">Tel: ${settings?.telefono || '987 654 321'}</div>
    <div class="divider"></div>
    <div class="text-center bold">COMPROBANTE DE VENTA #${String(sale.id).padStart(6, '0')}</div>
    <div class="item-row">
      <span>Fecha: ${new Date(sale.fecha).toLocaleString('es-PE')}</span>
    </div>
    <div class="item-row">
      <span>Cajero: ${sale.usuario_nombre || 'Cajero'}</span>
      <span>Pago: ${(sale.metodo_pago || 'EFECTIVO').toUpperCase()}</span>
    </div>
    <div class="divider"></div>
    <div class="item-row bold">
      <span class="qty">Cant</span>
      <span class="desc">Producto</span>
      <span class="price">Total</span>
    </div>
    <div class="divider"></div>
    ${itemsHtml}
    <div class="divider"></div>
    <div class="total-row">
      <span>TOTAL A PAGAR:</span>
      <span>${moneda} ${Number(sale.total).toFixed(2)}</span>
    </div>
    <div class="divider"></div>
    <div class="text-center" style="margin-top: 10px;">¡Gracias por su visita!</div>
    <div class="text-center bold">${settings?.nombre_cafeteria || 'Cafetería Colca'}</div>
  `;

  printThermalDirect(html, `Boleta_${sale.id}`, width);
};

// --- Recibo de Cuenta de Mesa ---
export const generateCuentaReceipt = ({ mesa, comandas, pagos, total }, settings, format = '80mm') => {
  const width = format === '58mm' ? 58 : 80;
  const moneda = settings?.moneda || 'S/';
  const allItems = comandas.flatMap(c => c.detalles || []);

  const itemsHtml = allItems.map(item => `
    <div class="item-row">
      <span class="qty">${item.cantidad}</span>
      <span class="desc">${(item.producto_nombre || item.nombre).substring(0, 22)}</span>
      <span class="price">${moneda} ${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
    </div>
  `).join('');

  const pagosHtml = pagos.map(p => `
    <div class="item-row">
      <span>${p.metodo_pago.toUpperCase()}:</span>
      <span class="bold">${moneda} ${Number(p.monto).toFixed(2)}</span>
    </div>
  `).join('');

  const html = `
    <div class="text-center title">${(settings?.nombre_cafeteria || 'CAFETERIA COLCA').toUpperCase()}</div>
    <div class="text-center bold">CUENTA TOTAL - ${mesa.nombre.toUpperCase()}</div>
    <div class="divider"></div>
    <div class="item-row">
      <span>Fecha: ${new Date().toLocaleString('es-PE')}</span>
      <span>Comandas: ${comandas.length}</span>
    </div>
    <div class="divider"></div>
    <div class="item-row bold">
      <span class="qty">Cant</span>
      <span class="desc">Producto</span>
      <span class="price">Total</span>
    </div>
    <div class="divider"></div>
    ${itemsHtml}
    <div class="divider"></div>
    <div class="total-row">
      <span>TOTAL CONSUMO:</span>
      <span>${moneda} ${Number(total).toFixed(2)}</span>
    </div>
    <div class="divider"></div>
    <div class="bold" style="margin-top: 4px; margin-bottom: 4px;">DESGLOSE DE PAGO:</div>
    ${pagosHtml}
    <div class="divider"></div>
    <div class="text-center" style="margin-top: 10px;">¡Gracias por su preferencia!</div>
  `;

  printThermalDirect(html, `Cuenta_${mesa.nombre.replace(/\s+/g, '_')}`, width);
};
