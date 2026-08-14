const prisma = require('../config/db');

const getDesgloseSesion = async (cajaId, montoApertura) => {
  // Ventas directas (LLEVAR)
  const ventasDirectas = await prisma.venta.groupBy({
    by: ['metodo_pago'],
    where: {
      caja_id: cajaId,
      tipo: 'LLEVAR',
      estado_pago: 'PAGADO'
    },
    _sum: { total: true }
  });

  // Pagos de mesa
  const pagosMesa = await prisma.$queryRaw`
    SELECT pm.metodo_pago, COALESCE(SUM(pm.monto), 0) as total
    FROM pagos_mesa pm
    JOIN cierres_mesa cm ON pm.cierre_mesa_id = cm.id
    WHERE cm.caja_id = ${cajaId}
    GROUP BY pm.metodo_pago
  `;

  // Gastos
  const gastos = await prisma.gasto.aggregate({
    where: { caja_id: cajaId },
    _sum: { monto: true }
  });
  const totalGastos = Number(gastos._sum.monto || 0);

  const desgloseVentas = {
    efectivo: 0,
    yape: 0,
    plin: 0,
    tarjeta: 0
  };

  // Mapear ventas directas
  ventasDirectas.forEach(v => {
    const metodo = (v.metodo_pago || '').toLowerCase();
    if (desgloseVentas[metodo] !== undefined) {
      desgloseVentas[metodo] += Number(v._sum.total || 0);
    } else if (metodo) {
      desgloseVentas[metodo] = Number(v._sum.total || 0);
    }
  });

  // Mapear pagos de mesa
  pagosMesa.forEach(p => {
    const metodo = (p.metodo_pago || '').toLowerCase();
    if (desgloseVentas[metodo] !== undefined) {
      desgloseVentas[metodo] += Number(p.total || 0);
    } else if (metodo) {
      desgloseVentas[metodo] = Number(p.total || 0);
    }
  });

  const apertura = Number(montoApertura || 0);
  const efectivoEsperado = apertura + desgloseVentas.efectivo - totalGastos;
  const yapeEsperado = desgloseVentas.yape;
  const plinEsperado = desgloseVentas.plin;
  const tarjetaEsperada = desgloseVentas.tarjeta;

  const saldoEsperado = efectivoEsperado + yapeEsperado + plinEsperado + tarjetaEsperada;

  return {
    ventas_por_metodo: desgloseVentas,
    gastos: totalGastos,
    esperado: {
      efectivo: efectivoEsperado,
      yape: yapeEsperado,
      plin: plinEsperado,
      tarjeta: tarjetaEsperada,
      total: saldoEsperado
    }
  };
};

const getEstado = async (req, res) => {
  try {
    const caja = await prisma.cajaSesion.findFirst({
      where: { estado: 'ABIERTA' },
      orderBy: { id: 'desc' }
    });

    if (!caja) {
      return res.json({ abierta: false });
    }

    const { ventas_por_metodo, gastos, esperado } = await getDesgloseSesion(caja.id, caja.monto_apertura);

    res.json({
      abierta: true,
      caja: {
        ...caja,
        ventas_efectivo: ventas_por_metodo.efectivo,
        ventas_yape: ventas_por_metodo.yape,
        ventas_plin: ventas_por_metodo.plin,
        ventas_tarjeta: ventas_por_metodo.tarjeta,
        gastos,
        desglose_esperado: esperado,
        saldo_esperado: esperado.total
      }
    });

  } catch (error) {
    console.error('Error al obtener estado de caja:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const abrirCaja = async (req, res) => {
  try {
    const { monto_apertura } = req.body;

    const abierta = await prisma.cajaSesion.findFirst({
      where: { estado: 'ABIERTA' }
    });

    if (abierta) {
      return res.status(400).json({ message: 'Ya existe una caja abierta. Ciérrela primero.' });
    }

    await prisma.cajaSesion.create({
      data: {
        usuario_id: req.user.id,
        monto_apertura: parseFloat(monto_apertura || 0),
        estado: 'ABIERTA'
      }
    });

    res.status(201).json({ message: 'Caja abierta exitosamente' });
  } catch (error) {
    console.error('Error al abrir caja:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const cerrarCaja = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { monto_declarado, desglose_declarado } = req.body;

    const caja = await prisma.cajaSesion.findFirst({
      where: { id, estado: 'ABIERTA' }
    });

    if (!caja) {
      return res.status(404).json({ message: 'Sesión de caja no encontrada o ya cerrada.' });
    }

    const { esperado } = await getDesgloseSesion(caja.id, caja.monto_apertura);

    const declarado = desglose_declarado || {
      efectivo: Number(monto_declarado || 0),
      yape: 0,
      plin: 0,
      tarjeta: 0
    };

    const totalDeclarado = Number(declarado.efectivo || 0) + 
      Number(declarado.yape || 0) + 
      Number(declarado.plin || 0) + 
      Number(declarado.tarjeta || 0);

    const diferenciaTotal = totalDeclarado - esperado.total;
    const diferencias = {
      efectivo: Number(declarado.efectivo || 0) - esperado.efectivo,
      yape: Number(declarado.yape || 0) - esperado.yape,
      plin: Number(declarado.plin || 0) - esperado.plin,
      tarjeta: Number(declarado.tarjeta || 0) - esperado.tarjeta,
      total: diferenciaTotal
    };

    await prisma.cajaSesion.update({
      where: { id },
      data: {
        fecha_cierre: new Date(),
        monto_cierre_esperado: esperado.total,
        monto_cierre_declarado: totalDeclarado,
        desglose_esperado: esperado,
        desglose_declarado: declarado,
        estado: 'CERRADA'
      }
    });

    res.json({
      message: 'Caja cerrada exitosamente',
      diferencia: diferenciaTotal,
      diferencias_desglose: diferencias,
      esperado,
      declarado
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const agregarGasto = async (req, res) => {
  try {
    const { concepto, monto } = req.body;

    const caja = await prisma.cajaSesion.findFirst({
      where: { estado: 'ABIERTA' },
      orderBy: { id: 'desc' }
    });

    if (!caja) {
      return res.status(400).json({ message: 'No hay una caja abierta para registrar el gasto.' });
    }

    await prisma.gasto.create({
      data: {
        caja_id: caja.id,
        usuario_id: req.user.id,
        concepto,
        monto: parseFloat(monto)
      }
    });

    res.status(201).json({ message: 'Gasto registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar gasto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const getGastos = async (req, res) => {
  try {
    const { caja_id } = req.query;
    if (!caja_id) {
      return res.status(400).json({ message: 'ID de caja requerido' });
    }

    const gastos = await prisma.gasto.findMany({
      where: { caja_id: parseInt(caja_id, 10) },
      include: {
        usuario: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    const formattedGastos = gastos.map(g => ({
      ...g,
      usuario_nombre: g.usuario?.nombre
    }));

    res.json(formattedGastos);
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const getHistorialCajas = async (req, res) => {
  try {
    const historial = await prisma.cajaSesion.findMany({
      include: {
        usuario: { select: { nombre: true } }
      },
      orderBy: { fecha_apertura: 'desc' },
      take: 50
    });

    const formatted = historial.map(c => ({
      ...c,
      usuario_nombre: c.usuario?.nombre
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener historial de cajas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getEstado,
  abrirCaja,
  cerrarCaja,
  agregarGasto,
  getGastos,
  getHistorialCajas
};
