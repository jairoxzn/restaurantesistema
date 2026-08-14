const prisma = require('../config/db');

const getStats = async (req, res) => {
  try {
    const dailySales = await prisma.$queryRaw`
      SELECT COALESCE(SUM(total), 0) as total_diario, COUNT(*)::int as num_ventas_hoy
      FROM ventas WHERE DATE(fecha) = CURRENT_DATE AND estado_pago = 'PAGADO'
    `;

    const monthlySales = await prisma.$queryRaw`
      SELECT COALESCE(SUM(total), 0) as total_mensual, COUNT(*)::int as num_ventas_mes
      FROM ventas 
      WHERE EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE) 
      AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE) 
      AND estado_pago = 'PAGADO'
    `;

    const totalProducts = await prisma.producto.count();
    const lowStock = await prisma.producto.count({ where: { stock: { lte: 10 } } });
    const totalUsers = await prisma.usuario.count();

    res.json({
      ventas_diarias: Number(dailySales[0].total_diario),
      num_ventas_hoy: Number(dailySales[0].num_ventas_hoy),
      ventas_mensuales: Number(monthlySales[0].total_mensual),
      num_ventas_mes: Number(monthlySales[0].num_ventas_mes),
      total_productos: totalProducts,
      productos_bajo_stock: lowStock,
      total_usuarios: totalUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const products = await prisma.$queryRaw`
      SELECT p.nombre, SUM(dv.cantidad)::int as total_vendido, SUM(dv.cantidad * dv.precio_unitario) as total_ingresos
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      JOIN ventas v ON dv.venta_id = v.id
      WHERE EXTRACT(MONTH FROM v.fecha) = EXTRACT(MONTH FROM CURRENT_DATE) 
      AND EXTRACT(YEAR FROM v.fecha) = EXTRACT(YEAR FROM CURRENT_DATE) 
      AND v.estado_pago = 'PAGADO'
      GROUP BY p.id, p.nombre
      ORDER BY total_vendido DESC
      LIMIT 5
    `;
    
    const formatted = products.map(p => ({
      ...p,
      total_vendido: Number(p.total_vendido),
      total_ingresos: Number(p.total_ingresos)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const getSalesChart = async (req, res) => {
  try {
    const dailyData = await prisma.$queryRaw`
      SELECT DATE(fecha) as dia, COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE fecha >= CURRENT_DATE - INTERVAL '7 days' AND estado_pago = 'PAGADO'
      GROUP BY DATE(fecha)
      ORDER BY dia ASC
    `;

    const monthlyData = await prisma.$queryRaw`
      SELECT TO_CHAR(fecha, 'YYYY-MM') as mes, COALESCE(SUM(total), 0) as total, COUNT(*)::int as num_ventas
      FROM ventas
      WHERE fecha >= CURRENT_DATE - INTERVAL '6 months' AND estado_pago = 'PAGADO'
      GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY mes ASC
    `;

    res.json({
      daily: dailyData.map(d => ({ ...d, total: Number(d.total) })),
      monthly: monthlyData.map(d => ({ ...d, total: Number(d.total), num_ventas: Number(d.num_ventas) }))
    });
  } catch (error) {
    console.error('Get sales chart error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

module.exports = { getStats, getTopProducts, getSalesChart };
