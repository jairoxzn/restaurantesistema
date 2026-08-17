const prisma = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { search, accion, fecha_inicio, fecha_fin, page = 1, limit = 50 } = req.query;

    const where = {};

    if (accion && accion !== 'all') {
      where.accion = accion;
    }

    if (search) {
      where.OR = [
        { usuario_nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { ip: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (fecha_inicio || fecha_fin) {
      where.fecha = {};
      if (fecha_inicio) where.fecha.gte = new Date(`${fecha_inicio}T00:00:00`);
      if (fecha_fin) where.fecha.lte = new Date(`${fecha_fin}T23:59:59`);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    const [total, registros] = await Promise.all([
      prisma.registroActividad.count({ where }),
      prisma.registroActividad.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    res.json({
      data: registros,
      total,
      page: pageNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    });
  } catch (error) {
    console.error('Error al obtener registro de actividad:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { getAll };
