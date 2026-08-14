import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper para descargar archivo Excel
const saveExcelFile = (workbook, fileName) => {
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// ==========================================
// 1. REPORTE DE CIERRE DE CAJA (EXCEL Y PDF)
// ==========================================

export const exportCajaReportExcel = (cajaSession, gastosList = [], moneda = 'S/') => {
  const esperado = cajaSession.desglose_esperado || {};
  const declarado = cajaSession.desglose_declarado || {};

  const summaryData = [
    { Concepto: 'ID Sesión', Valor: cajaSession.id },
    { Concepto: 'Estado', Valor: cajaSession.estado },
    { Concepto: 'Usuario', Valor: cajaSession.usuario_nombre || 'N/A' },
    { Concepto: 'Fecha Apertura', Valor: new Date(cajaSession.fecha_apertura).toLocaleString('es-PE') },
    { Concepto: 'Fecha Cierre', Valor: cajaSession.fecha_cierre ? new Date(cajaSession.fecha_cierre).toLocaleString('es-PE') : 'En curso' },
    { Concepto: 'Monto Inicial / Apertura', Valor: `${moneda} ${Number(cajaSession.monto_apertura).toFixed(2)}` },
    {},
    { Concepto: '--- DESGLOSE POR MEDIO DE PAGO ---', Valor: '' },
    { Concepto: 'Efectivo (Esperado)', Valor: `${moneda} ${(esperado.efectivo || 0).toFixed(2)}` },
    { Concepto: 'Efectivo (Declarado)', Valor: `${moneda} ${(declarado.efectivo || 0).toFixed(2)}` },
    { Concepto: 'Yape (Esperado)', Valor: `${moneda} ${(esperado.yape || 0).toFixed(2)}` },
    { Concepto: 'Yape (Declarado)', Valor: `${moneda} ${(declarado.yape || 0).toFixed(2)}` },
    { Concepto: 'Plin (Esperado)', Valor: `${moneda} ${(esperado.plin || 0).toFixed(2)}` },
    { Concepto: 'Plin (Declarado)', Valor: `${moneda} ${(declarado.plin || 0).toFixed(2)}` },
    { Concepto: 'Tarjeta (Esperado)', Valor: `${moneda} ${(esperado.tarjeta || 0).toFixed(2)}` },
    { Concepto: 'Tarjeta (Declarado)', Valor: `${moneda} ${(declarado.tarjeta || 0).toFixed(2)}` },
    {},
    { Concepto: 'TOTAL ESPERADO', Valor: `${moneda} ${Number(cajaSession.monto_cierre_esperado || esperado.total || 0).toFixed(2)}` },
    { Concepto: 'TOTAL DECLARADO', Valor: `${moneda} ${Number(cajaSession.monto_cierre_declarado || 0).toFixed(2)}` },
    { Concepto: 'DIFERENCIA GLOBAL', Valor: `${moneda} ${(Number(cajaSession.monto_cierre_declarado || 0) - Number(cajaSession.monto_cierre_esperado || 0)).toFixed(2)}` },
  ];

  const gastosData = gastosList.map(g => ({
    ID: g.id,
    Concepto: g.concepto,
    Monto: `${moneda} ${Number(g.monto).toFixed(2)}`,
    Fecha: new Date(g.fecha).toLocaleTimeString('es-PE'),
    Usuario: g.usuario_nombre || 'N/A'
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsGastos = XLSX.utils.json_to_sheet(gastosData.length ? gastosData : [{ Mensaje: 'Sin gastos' }]);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Cierre');
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos de Sesión');

  saveExcelFile(wb, `Cierre_Caja_${cajaSession.id}`);
};

export const exportCajaReportPDF = (cajaSession, gastosList = [], moneda = 'S/') => {
  const doc = new jsPDF();
  const esperado = cajaSession.desglose_esperado || {};
  const declarado = cajaSession.desglose_declarado || {};

  doc.setFontSize(16);
  doc.text('Reporte de Cierre de Caja (Contabilidad)', 14, 15);
  doc.setFontSize(10);
  doc.text(`Sesión #${cajaSession.id} | Fecha: ${new Date(cajaSession.fecha_apertura).toLocaleDateString('es-PE')}`, 14, 22);

  const resumen = [
    ['Usuario Responsable', cajaSession.usuario_nombre || 'N/A'],
    ['Apertura', `${new Date(cajaSession.fecha_apertura).toLocaleString('es-PE')}`],
    ['Cierre', cajaSession.fecha_cierre ? `${new Date(cajaSession.fecha_cierre).toLocaleString('es-PE')}` : 'Abierta'],
    ['Monto Inicial', `${moneda} ${Number(cajaSession.monto_apertura).toFixed(2)}`],
    ['Total Esperado', `${moneda} ${Number(cajaSession.monto_cierre_esperado || esperado.total || 0).toFixed(2)}`],
    ['Total Declarado', `${moneda} ${Number(cajaSession.monto_cierre_declarado || 0).toFixed(2)}`],
    ['Diferencia Total', `${moneda} ${(Number(cajaSession.monto_cierre_declarado || 0) - Number(cajaSession.monto_cierre_esperado || 0)).toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: 28,
    head: [['Indicador', 'Valor']],
    body: resumen,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] }
  });

  const desgloseRows = [
    ['Efectivo', `${moneda} ${(esperado.efectivo || 0).toFixed(2)}`, `${moneda} ${(declarado.efectivo || 0).toFixed(2)}`, `${moneda} ${((declarado.efectivo || 0) - (esperado.efectivo || 0)).toFixed(2)}`],
    ['Yape', `${moneda} ${(esperado.yape || 0).toFixed(2)}`, `${moneda} ${(declarado.yape || 0).toFixed(2)}`, `${moneda} ${((declarado.yape || 0) - (esperado.yape || 0)).toFixed(2)}`],
    ['Plin', `${moneda} ${(esperado.plin || 0).toFixed(2)}`, `${moneda} ${(declarado.plin || 0).toFixed(2)}`, `${moneda} ${((declarado.plin || 0) - (esperado.plin || 0)).toFixed(2)}`],
    ['Tarjeta / POS', `${moneda} ${(esperado.tarjeta || 0).toFixed(2)}`, `${moneda} ${(declarado.tarjeta || 0).toFixed(2)}`, `${moneda} ${((declarado.tarjeta || 0) - (esperado.tarjeta || 0)).toFixed(2)}`],
  ];

  doc.text('Cuadre por Medio de Pago', 14, doc.lastAutoTable.finalY + 12);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    head: [['Plataforma', 'Esperado', 'Declarado', 'Diferencia']],
    body: desgloseRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  if (gastosList.length > 0) {
    doc.text('Salidas / Gastos de la Sesión', 14, doc.lastAutoTable.finalY + 12);
    const gastosRows = gastosList.map(g => [
      g.concepto,
      `${moneda} ${Number(g.monto).toFixed(2)}`,
      new Date(g.fecha).toLocaleTimeString('es-PE'),
      g.usuario_nombre || 'N/A'
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Concepto', 'Monto', 'Hora', 'Registrado Por']],
      body: gastosRows,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }
    });
  }

  doc.save(`Cierre_Caja_${cajaSession.id}.pdf`);
};

// ==========================================
// 2. REPORTE DE VENTAS POR PERIODO (EXCEL Y PDF)
// ==========================================

export const exportVentasReportExcel = (sales = [], fechaInicio = '', fechaFin = '', moneda = 'S/') => {
  const formattedSales = sales.map(s => ({
    'ID Venta': s.id,
    Fecha: new Date(s.fecha).toLocaleString('es-PE'),
    Tipo: s.tipo,
    'Ubicación / Mesa': s.mesa_nombre || 'Para Llevar',
    'Método Pago': (s.metodo_pago || 'EFECTIVO').toUpperCase(),
    Vendedor: s.usuario_nombre || 'N/A',
    Estado: s.estado_pago,
    Total: Number(s.total)
  }));

  // Totales por método de pago
  const totalesMetodo = sales.reduce((acc, s) => {
    const m = (s.metodo_pago || 'EFECTIVO').toUpperCase();
    acc[m] = (acc[m] || 0) + Number(s.total);
    return acc;
  }, {});

  const resumenMetodos = Object.keys(totalesMetodo).map(m => ({
    'Método de Pago': m,
    'Total Acumulado': `${moneda} ${totalesMetodo[m].toFixed(2)}`
  }));

  const wb = XLSX.utils.book_new();
  const wsVentas = XLSX.utils.json_to_sheet(formattedSales);
  const wsMetodos = XLSX.utils.json_to_sheet(resumenMetodos);

  XLSX.utils.book_append_sheet(wb, wsVentas, 'Detalle Ventas');
  XLSX.utils.book_append_sheet(wb, wsMetodos, 'Resumen Canales');

  saveExcelFile(wb, `Reporte_Ventas_${fechaInicio || 'General'}_a_${fechaFin || 'Hoy'}`);
};

export const exportVentasReportPDF = (sales = [], fechaInicio = '', fechaFin = '', moneda = 'S/') => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reporte Consolidado de Ventas', 14, 15);
  doc.setFontSize(10);
  doc.text(`Rango: ${fechaInicio || 'Inicio'} hasta ${fechaFin || 'Hoy'} | Total Ventas: ${sales.length}`, 14, 22);

  // Totales por plataforma
  const totalesMetodo = sales.reduce((acc, s) => {
    const m = (s.metodo_pago || 'EFECTIVO').toUpperCase();
    acc[m] = (acc[m] || 0) + Number(s.total);
    return acc;
  }, {});

  const totalGeneral = sales.reduce((sum, s) => sum + Number(s.total), 0);

  const resumenRows = Object.keys(totalesMetodo).map(m => [m, `${moneda} ${totalesMetodo[m].toFixed(2)}`]);
  resumenRows.push(['TOTAL GENERAL', `${moneda} ${totalGeneral.toFixed(2)}`]);

  autoTable(doc, {
    startY: 28,
    head: [['Canal / Método de Pago', 'Total Recaudado']],
    body: resumenRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] }
  });

  const salesRows = sales.map(s => [
    `#${s.id}`,
    new Date(s.fecha).toLocaleDateString('es-PE'),
    s.tipo,
    s.mesa_nombre || 'Llevar',
    (s.metodo_pago || 'EFECTIVO').toUpperCase(),
    `${moneda} ${Number(s.total).toFixed(2)}`
  ]);

  doc.text('Listado de Transacciones', 14, doc.lastAutoTable.finalY + 12);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    head: [['N°', 'Fecha', 'Tipo', 'Mesa/Llevar', 'Método', 'Total']],
    body: salesRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`Reporte_Ventas_${fechaInicio || 'General'}.pdf`);
};

// ==========================================
// 3. REPORTE DE KARDEX E INVENTARIO (EXCEL Y PDF)
// ==========================================

export const exportKardexReportExcel = (producto, historial = []) => {
  const data = historial.map(h => ({
    ID: h.id,
    Tipo: h.tipo,
    Cantidad: h.cantidad,
    'Stock Anterior': h.stock_anterior,
    'Stock Nuevo': h.stock_nuevo,
    Motivo: h.motivo || '-',
    Usuario: h.usuario_nombre || 'N/A',
    Fecha: new Date(h.fecha).toLocaleString('es-PE')
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Historial Kardex');

  saveExcelFile(wb, `Kardex_${producto.nombre.replace(/\s+/g, '_')}`);
};

export const exportKardexReportPDF = (producto, historial = []) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Reporte de Kardex - ${producto.nombre}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Stock Actual: ${producto.stock} unidades | Total Movimientos: ${historial.length}`, 14, 22);

  const rows = historial.map(h => [
    h.tipo,
    h.cantidad,
    h.stock_anterior,
    h.stock_nuevo,
    h.motivo || '-',
    h.usuario_nombre || 'N/A',
    new Date(h.fecha).toLocaleDateString('es-PE')
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['Tipo', 'Cant.', 'Stk. Ant.', 'Stk. Nuevo', 'Motivo', 'Usuario', 'Fecha']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] }
  });

  doc.save(`Kardex_${producto.nombre.replace(/\s+/g, '_')}.pdf`);
};
