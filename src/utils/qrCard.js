// Genera y (opcionalmente) imprime la "carta QR" que el negocio puede colocar
// en las mesas o compartir con sus clientes para que escaneen y vean el menú digital.

const getLogoHtml = (settings) => {
  const logoUrl = settings?.logo_url;
  if (!logoUrl) return '';
  const src = logoUrl.startsWith('http') ? logoUrl : `/uploads/${logoUrl}`;
  return `<img src="${src}" class="logo" alt="Logo" onerror="this.remove()" />`;
};

// Documento HTML de la carta, pensado para imprimirse en tamaño tarjeta/postal (100x150mm),
// ideal para plastificar y dejar sobre cada mesa.
export const buildQrCardDocument = (qrDataUrl, settings, menuUrl) => {
  const nombre = settings?.nombre_cafeteria || 'Cafetería';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Carta QR - ${nombre}</title>
        <style>
          @page { size: 100mm 150mm; margin: 0; }
          html, body {
            width: 100mm;
            height: 150mm;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #0a0a0b;
          }
          .card {
            width: 100mm;
            height: 150mm;
            box-sizing: border-box;
            padding: 10mm 8mm;
            background: linear-gradient(160deg, #ef4444 0%, #7f1d1d 55%, #0a0a0b 100%);
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
          }
          .logo { width: 20mm; height: 20mm; border-radius: 5mm; object-fit: cover; border: 1px solid rgba(255,255,255,0.5); }
          .nombre { font-size: 16px; font-weight: 800; margin-top: 3mm; letter-spacing: 0.3px; }
          .qr-box { background: #fff; padding: 5mm; border-radius: 6mm; box-shadow: 0 4px 16px rgba(0,0,0,0.35); }
          .qr-box img { display: block; width: 55mm; height: 55mm; }
          .titulo { font-size: 15px; font-weight: 700; margin: 0 0 1.5mm; }
          .subtitulo { font-size: 10px; opacity: 0.85; margin: 0; max-width: 70mm; }
          .footer { font-size: 8px; opacity: 0.7; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="card">
          <div>
            ${getLogoHtml(settings)}
            <div class="nombre">${nombre}</div>
          </div>

          <div class="qr-box">
            <img src="${qrDataUrl}" alt="QR Menú" />
          </div>

          <div>
            <p class="titulo">📱 Escanea y ordena</p>
            <p class="subtitulo">Apunta la cámara de tu celular al código QR para ver nuestro menú digital y hacer tu pedido.</p>
            <p class="footer">${menuUrl}</p>
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
            setTimeout(function () { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;
};

export const printQrCard = (qrDataUrl, settings, menuUrl) => {
  const printWindow = window.open('', '_blank', 'width=420,height=620');
  if (!printWindow) return;
  printWindow.document.write(buildQrCardDocument(qrDataUrl, settings, menuUrl));
  printWindow.document.close();
};

// Descarga solo el código QR como imagen PNG.
export const downloadQrImage = (qrDataUrl, filename = 'qr-menu.png') => {
  const link = document.createElement('a');
  link.href = qrDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};
