const prisma = require('../config/db');

const getProductKardex = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    
    const producto = await prisma.producto.findUnique({
      where: { id: productId },
      select: { id: true, nombre: true, stock: true }
    });

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const historial = await prisma.kardex.findMany({
      where: { producto_id: productId },
      include: {
        usuario: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    const formattedHistorial = historial.map(k => ({
      ...k,
      usuario_nombre: k.usuario?.nombre
    }));

    res.json({
      producto,
      historial: formattedHistorial
    });
  } catch (error) {
    console.error('Error al obtener kardex:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const addMovement = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const { tipo, cantidad, motivo } = req.body;
    const cantNum = Number(cantidad);

    if (!['INGRESO', 'MERMA', 'AJUSTE'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de movimiento inválido' });
    }
    if (isNaN(cantNum) || cantNum <= 0) {
      return res.status(400).json({ message: 'La cantidad debe ser mayor a 0' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // In Prisma, finding unique and updating is generally atomic, but if we want a lock:
      const productos = await tx.$queryRaw`SELECT stock FROM productos WHERE id = ${productId} FOR UPDATE`;
      
      if (productos.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const stockAnterior = productos[0].stock;
      let stockNuevo = stockAnterior;

      if (tipo === 'INGRESO') {
        stockNuevo = stockAnterior + cantNum;
      } else if (tipo === 'MERMA') {
        if (stockAnterior < cantNum) {
          throw new Error('No puede haber más merma que el stock actual');
        }
        stockNuevo = stockAnterior - cantNum;
      } else if (tipo === 'AJUSTE') {
        stockNuevo = cantNum;
      }

      const diferencia = tipo === 'AJUSTE' ? Math.abs(stockNuevo - stockAnterior) : cantNum;

      await tx.producto.update({
        where: { id: productId },
        data: { stock: stockNuevo }
      });

      await tx.kardex.create({
        data: {
          producto_id: productId,
          usuario_id: req.user.id,
          tipo,
          cantidad: diferencia,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: motivo || ''
        }
      });

      return stockNuevo;
    });

    res.json({ message: 'Movimiento registrado con éxito', stock_nuevo: result });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(error.message === 'Error del servidor' ? 500 : 400).json({ message: error.message || 'Error del servidor' });
  }
};

module.exports = {
  getProductKardex,
  addMovement
};
