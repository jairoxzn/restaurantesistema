const prisma = require('../config/db');
const io = require('../socket');

const create = async (req, res) => {
  try {
    const { items, metodo_pago, mesa_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'La venta debe tener al menos un producto.' });
    }

    const parsedMesaId = mesa_id ? parseInt(mesa_id, 10) : null;

    if (!parsedMesaId && !metodo_pago) {
      return res.status(400).json({ message: 'Método de pago requerido.' });
    }

    const formattedItems = items.map(item => ({
      producto_id: parseInt(item.producto_id, 10),
      cantidad: parseInt(item.cantidad, 10),
      precio_unitario: parseFloat(item.precio_unitario)
    }));

    const result = await prisma.$transaction(async (tx) => {
      const caja = await tx.cajaSesion.findFirst({
        where: { estado: 'ABIERTA' },
        orderBy: { id: 'desc' }
      });

      if (!caja) {
        throw new Error('Debe abrir caja antes de realizar ventas.');
      }

      if (parsedMesaId) {
        const mesa = await tx.mesa.findUnique({ where: { id: parsedMesaId } });
        if (!mesa) throw new Error('Mesa no encontrada.');
      }

      const total = formattedItems.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
      const tipo = parsedMesaId ? 'MESA' : 'LLEVAR';
      const estadoPago = parsedMesaId ? 'PENDIENTE' : 'PAGADO';

      const venta = await tx.venta.create({
        data: {
          usuario_id: req.user.id,
          caja_id: caja.id,
          mesa_id: parsedMesaId,
          tipo,
          estado_pago: estadoPago,
          total: parseFloat(total.toFixed(2)),
          metodo_pago: parsedMesaId ? null : metodo_pago
        }
      });

      for (const item of formattedItems) {
        const product = await tx.producto.findUnique({ where: { id: item.producto_id } });
        if (!product) {
          throw new Error(`Producto con ID ${item.producto_id} no encontrado.`);
        }
        if (product.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}`);
        }

        await tx.detalleVenta.create({
          data: {
            venta_id: venta.id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
          }
        });

        const newStock = product.stock - item.cantidad;
        await tx.producto.update({
          where: { id: item.producto_id },
          data: { stock: newStock }
        });

        await tx.kardex.create({
          data: {
            producto_id: item.producto_id,
            usuario_id: req.user.id,
            tipo: 'VENTA',
            cantidad: item.cantidad,
            stock_anterior: product.stock,
            stock_nuevo: newStock,
            motivo: `Venta #${venta.id}`
          }
        });
      }

      if (parsedMesaId) {
        await tx.mesa.updateMany({
          where: { id: parsedMesaId, estado: 'LIBRE' },
          data: { estado: 'OCUPADA' }
        });
      }

      return venta.id;
    });

    const sale = await prisma.venta.findUnique({
      where: { id: result },
      include: {
        usuario: { select: { nombre: true } },
        mesa: { select: { nombre: true } },
        detalles: {
          include: { producto: { select: { nombre: true } } }
        }
      }
    });

    const responseSale = {
      ...sale,
      usuario_nombre: sale.usuario?.nombre,
      mesa_nombre: sale.mesa?.nombre,
      detalles: sale.detalles.map(d => ({ ...d, producto_nombre: d.producto?.nombre }))
    };

    try {
      io.getIO().emit('new_order', responseSale);
    } catch (err) {
      console.error('No se pudo emitir evento por socket', err);
    }

    res.status(201).json({
      message: 'Venta registrada exitosamente.',
      sale: responseSale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    const knownErrors = [
      'Debe abrir caja antes de realizar ventas.',
      'Mesa no encontrada.',
      'La venta debe tener al menos un producto.',
      'Método de pago requerido.'
    ];
    const isUserError = knownErrors.includes(error.message) || error.message.startsWith('Producto con ID') || error.message.startsWith('Stock insuficiente');
    res.status(isUserError ? 400 : 500).json({ message: isUserError ? error.message : 'Error del servidor.' });
  }
};

const getAll = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const where = { estado_pago: 'PAGADO' };

    if (fecha_inicio && fecha_fin) {
      where.fecha = {
        gte: new Date(fecha_inicio),
        lte: new Date(fecha_fin)
      };
    }

    const sales = await prisma.venta.findMany({
      where,
      include: {
        usuario: { select: { nombre: true } },
        mesa: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    const formattedSales = sales.map(s => ({
      ...s,
      usuario_nombre: s.usuario?.nombre,
      mesa_nombre: s.mesa?.nombre
    }));

    res.json(formattedSales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const getById = async (req, res) => {
  try {
    const sale = await prisma.venta.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        usuario: { select: { nombre: true } },
        detalles: {
          include: { producto: { select: { nombre: true } } }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada.' });
    }

    const formattedSale = {
      ...sale,
      usuario_nombre: sale.usuario?.nombre,
      detalles: sale.detalles.map(d => ({ ...d, producto_nombre: d.producto?.nombre }))
    };

    res.json(formattedSale);
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

module.exports = { create, getAll, getById };
