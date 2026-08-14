const prisma = require('../config/db');
const io = require('../socket');

const getAll = async (req, res) => {
  try {
    const mesas = await prisma.$queryRaw`
      SELECT m.*,
        COALESCE(SUM(CASE WHEN v.estado_pago = 'PENDIENTE' THEN v.total ELSE 0 END), 0) as total_pendiente,
        COUNT(CASE WHEN v.estado_pago = 'PENDIENTE' THEN v.id ELSE NULL END) as cantidad_comandas
       FROM mesas m
       LEFT JOIN ventas v ON v.mesa_id = m.id AND v.estado_pago = 'PENDIENTE'
       GROUP BY m.id
       ORDER BY m.nombre ASC
    `;
    
    // Fix bigints from raw query
    const formatted = mesas.map(m => ({
      ...m,
      total_pendiente: Number(m.total_pendiente),
      cantidad_comandas: Number(m.cantidad_comandas)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, capacidad } = req.body;
    const mesa = await prisma.mesa.create({
      data: {
        nombre,
        capacidad: parseInt(capacidad, 10) || 4,
        estado: 'LIBRE'
      }
    });
    res.status(201).json({ message: 'Mesa creada exitosamente', mesa });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const { nombre, capacidad } = req.body;
    const mesaId = parseInt(req.params.id, 10);
    
    const existing = await prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!existing) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }
    
    await prisma.mesa.update({
      where: { id: mesaId },
      data: { nombre, capacidad: parseInt(capacidad, 10) || 4 }
    });
    res.json({ message: 'Mesa actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const mesaId = parseInt(req.params.id, 10);
    const existing = await prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!existing) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }
    if (existing.estado !== 'LIBRE') {
      return res.status(400).json({ message: 'No se puede eliminar una mesa ocupada. Cobre la cuenta primero.' });
    }
    await prisma.mesa.delete({ where: { id: mesaId } });
    res.json({ message: 'Mesa eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const getCuenta = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const mesa = await prisma.mesa.findUnique({ where: { id } });
    if (!mesa) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    const comandas = await prisma.venta.findMany({
      where: { mesa_id: id, estado_pago: 'PENDIENTE' },
      include: {
        usuario: { select: { nombre: true } },
        detalles: {
          include: { producto: { select: { nombre: true } } }
        }
      },
      orderBy: { fecha: 'asc' }
    });

    const formattedComandas = comandas.map(c => ({
      ...c,
      usuario_nombre: c.usuario?.nombre,
      detalles: c.detalles.map(d => ({
        ...d,
        producto_nombre: d.producto?.nombre
      }))
    }));

    const total = formattedComandas.reduce((sum, c) => sum + Number(c.total), 0);

    res.json({ mesa, comandas: formattedComandas, total });
  } catch (error) {
    console.error('Error al obtener cuenta de mesa:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const cobrar = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { pagos } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const mesas = await tx.$queryRaw`SELECT * FROM mesas WHERE id = ${id} FOR UPDATE`;
      if (mesas.length === 0) {
        throw new Error('Mesa no encontrada');
      }
      if (mesas[0].estado !== 'OCUPADA') {
        throw new Error('La mesa no tiene una cuenta abierta.');
      }

      const comandas = await tx.venta.findMany({
        where: { mesa_id: id, estado_pago: 'PENDIENTE' }
      });
      if (comandas.length === 0) {
        throw new Error('La mesa no tiene consumo pendiente por cobrar.');
      }

      const totalPendiente = comandas.reduce((sum, c) => sum + Number(c.total), 0);
      const totalPagos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

      if (Math.abs(totalPagos - totalPendiente) > 0.01) {
        throw new Error(`El total pagado (${totalPagos.toFixed(2)}) no coincide con el total de la cuenta (${totalPendiente.toFixed(2)}).`);
      }

      const caja = await tx.cajaSesion.findFirst({
        where: { estado: 'ABIERTA' },
        orderBy: { id: 'desc' }
      });
      if (!caja) {
        throw new Error('Debe abrir caja antes de cobrar una mesa.');
      }

      const cierre = await tx.cierreMesa.create({
        data: {
          mesa_id: id,
          usuario_id: req.user.id,
          caja_id: caja.id,
          total: totalPendiente,
          pagos: {
            create: pagos.map(p => ({
              metodo_pago: p.metodo_pago,
              monto: parseFloat(p.monto)
            }))
          }
        }
      });

      const metodoFinal = pagos.length === 1 ? pagos[0].metodo_pago : 'MIXTO';
      
      await tx.venta.updateMany({
        where: { mesa_id: id, estado_pago: 'PENDIENTE' },
        data: {
          estado_pago: 'PAGADO',
          metodo_pago: metodoFinal,
          cierre_mesa_id: cierre.id
        }
      });

      await tx.mesa.update({
        where: { id },
        data: { estado: 'LIBRE' }
      });

      return { cierreId: cierre.id, totalPendiente };
    });

    try {
      io.getIO().emit('mesa_cobrada', { mesa_id: id });
    } catch (err) {
      console.error('No se pudo emitir evento por socket', err);
    }

    res.json({
      message: 'Cuenta cobrada exitosamente',
      cierre: { id: result.cierreId, mesa_id: id, total: result.totalPendiente, pagos }
    });
  } catch (error) {
    console.error('Error al cobrar mesa:', error);
    res.status(error.message === 'Error del servidor' ? 500 : 400).json({ message: error.message || 'Error del servidor' });
  }
};

module.exports = { getAll, create, update, remove, getCuenta, cobrar };
