const prisma = require('../config/db');

const MESA_PENDIENTE_MINUTOS = 45; // mesa ocupada con cuenta sin cobrar por más de esto
const CAJA_ABIERTA_HORAS = 12;      // caja abierta hace más de esto (probable olvido de cerrar turno)

const getAll = async (req, res) => {
  try {
    const notificaciones = [];
    const now = Date.now();

    // 1. Stock bajo (solo relevante para ADMIN, que es quien gestiona inventario)
    if (req.user.rol === 'ADMIN') {
      const productosStockBajo = await prisma.producto.findMany({
        where: { stock: { lte: 10 } },
        orderBy: { stock: 'asc' },
        take: 20
      });
      productosStockBajo.forEach(p => {
        notificaciones.push({
          id: `stock-${p.id}`,
          tipo: 'STOCK_BAJO',
          severidad: p.stock === 0 ? 'alta' : 'media',
          titulo: p.stock === 0 ? 'Producto agotado' : 'Stock bajo',
          mensaje: p.stock === 0 ? `"${p.nombre}" no tiene stock.` : `"${p.nombre}": quedan ${p.stock} unidades.`,
          link: '/products'
        });
      });
    }

    // 2. Mesas ocupadas con cuenta pendiente hace rato
    const mesasPendientes = await prisma.$queryRaw`
      SELECT m.id, m.nombre, MIN(v.fecha) as fecha_mas_antigua, COUNT(v.id) as comandas
      FROM mesas m
      JOIN ventas v ON v.mesa_id = m.id AND v.estado_pago = 'PENDIENTE'
      WHERE m.estado = 'OCUPADA'
      GROUP BY m.id, m.nombre
    `;
    mesasPendientes.forEach(m => {
      const minutos = Math.floor((now - new Date(m.fecha_mas_antigua).getTime()) / 60000);
      if (minutos >= MESA_PENDIENTE_MINUTOS) {
        notificaciones.push({
          id: `mesa-${m.id}`,
          tipo: 'MESA_PENDIENTE',
          severidad: minutos >= MESA_PENDIENTE_MINUTOS * 2 ? 'alta' : 'media',
          titulo: 'Mesa con cuenta pendiente',
          mensaje: `${m.nombre} lleva ${minutos} min sin cobrarse (${Number(m.comandas)} comanda${Number(m.comandas) === 1 ? '' : 's'}).`,
          link: '/mesas'
        });
      }
    });

    // 3. Caja abierta de un turno anterior
    const cajaAbierta = await prisma.cajaSesion.findFirst({
      where: { estado: 'ABIERTA' },
      orderBy: { id: 'desc' }
    });
    if (cajaAbierta) {
      const horas = (now - new Date(cajaAbierta.fecha_apertura).getTime()) / 3600000;
      if (horas >= CAJA_ABIERTA_HORAS) {
        notificaciones.push({
          id: `caja-${cajaAbierta.id}`,
          tipo: 'CAJA_ABIERTA',
          severidad: 'alta',
          titulo: 'Caja abierta hace tiempo',
          mensaje: `Sigue abierta desde hace ${Math.floor(horas)}h. ¿Olvidaron cerrarla?`,
          link: '/caja'
        });
      }
    }

    const orden = { alta: 0, media: 1, baja: 2 };
    notificaciones.sort((a, b) => orden[a.severidad] - orden[b.severidad]);

    res.json({ notifications: notificaciones, count: notificaciones.length });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { getAll };
