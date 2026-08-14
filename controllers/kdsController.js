const prisma = require('../config/db');
const io = require('../socket');

const getActiveOrders = async (req, res) => {
  try {
    const orders = await prisma.venta.findMany({
      where: {
        estado_cocina: { in: ['PENDIENTE', 'PREPARANDO', 'LISTO'] }
      },
      include: {
        usuario: { select: { nombre: true } },
        mesa: { select: { nombre: true } },
        detalles: {
          include: { producto: { select: { nombre: true } } }
        }
      },
      orderBy: { fecha: 'asc' }
    });

    const formattedOrders = orders.map(o => ({
      ...o,
      cajero_nombre: o.usuario?.nombre,
      mesa_nombre: o.mesa?.nombre,
      detalles: o.detalles.map(d => ({
        ...d,
        producto_nombre: d.producto?.nombre
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error al obtener pedidos KDS:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body;

    if (!['PENDIENTE', 'PREPARANDO', 'LISTO', 'ENTREGADO'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    await prisma.venta.update({
      where: { id },
      data: { estado_cocina: estado }
    });

    io.getIO().emit('order_updated', { id, estado_cocina: estado });

    res.json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado KDS:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getActiveOrders,
  updateOrderStatus
};
