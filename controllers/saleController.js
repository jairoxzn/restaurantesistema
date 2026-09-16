const prisma = require('../config/db');
const io = require('../socket');
const logActivity = require('../utils/activityLog');
const { normalizarTelefono } = require('./clienteController');

const create = async (req, res) => {
  try {
    const { items, metodo_pago, mesa_id, cliente_telefono, cliente_nombre, pagos } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'La venta debe tener al menos un producto.' });
    }

    const parsedMesaId = mesa_id ? parseInt(mesa_id, 10) : null;
    const tienePagos = Array.isArray(pagos) && pagos.length > 0;

    if (!parsedMesaId && !tienePagos && !metodo_pago) {
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

      // Cliente opcional: si mandan teléfono, se vincula (o se crea) el cliente,
      // sin bloquear la venta si algo sale mal con esto.
      let clienteId = null;
      const telefonoNorm = normalizarTelefono(cliente_telefono);
      if (telefonoNorm) {
        const cliente = await tx.cliente.upsert({
          where: { telefono: telefonoNorm },
          update: cliente_nombre ? { nombre: cliente_nombre } : {},
          create: { nombre: cliente_nombre || telefonoNorm, telefono: telefonoNorm }
        });
        clienteId = cliente.id;
      }

      const total = formattedItems.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
      const tipo = parsedMesaId ? 'MESA' : 'LLEVAR';
      const estadoPago = parsedMesaId ? 'PENDIENTE' : 'PAGADO';

      // Pago mixto (mostrador): las comandas de mesa no llevan pago todavía
      // (se cobran después desde /mesas), así que esto solo aplica a "para llevar".
      let metodoFinal = null;
      let pagosParaCrear = [];
      if (!parsedMesaId) {
        const pagosInput = tienePagos
          ? pagos.map(p => ({ metodo_pago: p.metodo_pago, monto: parseFloat(p.monto) }))
          : [{ metodo_pago, monto: total }];

        const totalPagos = pagosInput.reduce((sum, p) => sum + p.monto, 0);
        if (Math.abs(totalPagos - total) > 0.01) {
          throw new Error(`El total pagado (${totalPagos.toFixed(2)}) no coincide con el total de la venta (${total.toFixed(2)}).`);
        }

        metodoFinal = pagosInput.length === 1 ? pagosInput[0].metodo_pago : 'MIXTO';
        pagosParaCrear = pagosInput;
      }

      const venta = await tx.venta.create({
        data: {
          usuario_id: req.user.id,
          caja_id: caja.id,
          mesa_id: parsedMesaId,
          cliente_id: clienteId,
          tipo,
          estado_pago: estadoPago,
          total: parseFloat(total.toFixed(2)),
          metodo_pago: metodoFinal,
          ...(pagosParaCrear.length > 0 && { pagos: { create: pagosParaCrear } })
        }
      });

      // Se trae el stock de todos los productos en una sola consulta (en vez de un
      // findUnique por item) para minimizar los round-trips dentro de la transacción
      // interactiva y evitar que expire su timeout contra la BD remota (Neon).
      const productIds = [...new Set(formattedItems.map(item => item.producto_id))];
      const products = await tx.producto.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map(p => [p.id, p]));

      const detalleData = [];
      const kardexData = [];

      for (const item of formattedItems) {
        const product = productMap.get(item.producto_id);
        if (!product) {
          throw new Error(`Producto con ID ${item.producto_id} no encontrado.`);
        }
        if (product.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}`);
        }

        const newStock = product.stock - item.cantidad;

        detalleData.push({
          venta_id: venta.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        });

        kardexData.push({
          producto_id: item.producto_id,
          usuario_id: req.user.id,
          tipo: 'VENTA',
          cantidad: item.cantidad,
          stock_anterior: product.stock,
          stock_nuevo: newStock,
          motivo: `Venta #${venta.id}`
        });

        // Se actualiza en memoria (no en BD) para que si el mismo producto aparece
        // dos veces en el carrito, el segundo descuento parta del stock ya restado.
        productMap.set(item.producto_id, { ...product, stock: newStock });
      }

      await tx.detalleVenta.createMany({ data: detalleData });
      await tx.kardex.createMany({ data: kardexData });

      for (const [producto_id, product] of productMap) {
        await tx.producto.update({
          where: { id: producto_id },
          data: { stock: product.stock }
        });
      }

      if (parsedMesaId) {
        await tx.mesa.updateMany({
          where: { id: parsedMesaId, estado: 'LIBRE' },
          data: { estado: 'OCUPADA' }
        });
      }

      return venta.id;
    }, { maxWait: 10000, timeout: 20000 });

    const sale = await prisma.venta.findUnique({
      where: { id: result },
      include: {
        usuario: { select: { nombre: true } },
        mesa: { select: { nombre: true } },
        cliente: { select: { nombre: true, telefono: true } },
        detalles: {
          include: { producto: { select: { nombre: true } } }
        },
        pagos: true
      }
    });

    const responseSale = {
      ...sale,
      usuario_nombre: sale.usuario?.nombre,
      mesa_nombre: sale.mesa?.nombre,
      cliente_nombre: sale.cliente?.nombre,
      detalles: sale.detalles.map(d => ({ ...d, producto_nombre: d.producto?.nombre }))
    };

    try {
      io.getIO().emit('new_order', responseSale);
    } catch (err) {
      console.error('No se pudo emitir evento por socket', err);
    }

    logActivity({
      usuario: req.user,
      accion: 'COMPRA',
      descripcion: `Venta ${sale.tipo === 'MESA' ? `en ${sale.mesa_nombre || 'mesa'}` : 'para llevar'} #${sale.id} registrada. Total: ${Number(sale.total).toFixed(2)}`,
      ip: req.ip,
    });

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
    const isUserError = knownErrors.includes(error.message) || error.message.startsWith('Producto con ID') || error.message.startsWith('Stock insuficiente') || error.message.startsWith('El total pagado');
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
        },
        pagos: true
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
