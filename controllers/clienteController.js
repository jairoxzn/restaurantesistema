const prisma = require('../config/db');

// Normaliza el teléfono a solo dígitos (y el + inicial si viene de otro país)
// para que "987 654 321", "987-654-321" y "987654321" sean el mismo cliente.
const normalizarTelefono = (telefono) => (telefono || '').replace(/[^\d+]/g, '');

const getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? {
      OR: [
        { nombre: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        _count: { select: { ventas: true } },
        ventas: { select: { total: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = clientes.map(c => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      email: c.email,
      notas: c.notas,
      created_at: c.created_at,
      total_compras: c._count.ventas,
      total_gastado: c.ventas.reduce((sum, v) => sum + Number(v.total), 0),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        ventas: {
          where: { estado_pago: 'PAGADO' },
          orderBy: { fecha: 'desc' },
          include: { detalles: { include: { producto: { select: { nombre: true } } } } }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const ventas = cliente.ventas.map(v => ({
      ...v,
      detalles: v.detalles.map(d => ({ ...d, producto_nombre: d.producto?.nombre }))
    }));

    res.json({ ...cliente, ventas });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Búsqueda rápida por teléfono para autocompletar en el POS (cualquier usuario logueado).
const buscarPorTelefono = async (req, res) => {
  try {
    const telefono = normalizarTelefono(req.query.telefono);
    if (!telefono) {
      return res.json(null);
    }
    const cliente = await prisma.cliente.findUnique({ where: { telefono } });
    res.json(cliente || null);
  } catch (error) {
    console.error('Error al buscar cliente:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, telefono, email, notas } = req.body;
    const telefonoNorm = normalizarTelefono(telefono);

    const existing = await prisma.cliente.findUnique({ where: { telefono: telefonoNorm } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un cliente con ese teléfono' });
    }

    const cliente = await prisma.cliente.create({
      data: { nombre, telefono: telefonoNorm, email: email || null, notas: notas || null }
    });
    res.status(201).json({ message: 'Cliente creado exitosamente', cliente });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre, telefono, email, notas } = req.body;

    const existing = await prisma.cliente.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: { nombre, telefono: normalizarTelefono(telefono), email: email || null, notas: notas || null }
    });
    res.json({ message: 'Cliente actualizado exitosamente', cliente });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const remove = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await prisma.cliente.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    // No se borra en cascada: las ventas históricas del cliente quedan, solo se desvincula.
    await prisma.venta.updateMany({ where: { cliente_id: id }, data: { cliente_id: null } });
    await prisma.cliente.delete({ where: { id } });
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Alta pública desde el menú QR (sin login): solo nombre + teléfono, upsert por
// teléfono para no duplicar clientes que vuelven a pedir. Riesgo bajo: no crea
// cuentas ni da acceso a nada, solo un registro de contacto.
const registrarPublico = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    const telefonoNorm = normalizarTelefono(telefono);
    if (!nombre || !telefonoNorm || telefonoNorm.length < 6) {
      return res.status(400).json({ message: 'Nombre y teléfono válidos son requeridos' });
    }

    const cliente = await prisma.cliente.upsert({
      where: { telefono: telefonoNorm },
      update: { nombre },
      create: { nombre, telefono: telefonoNorm }
    });

    res.json({ id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono });
  } catch (error) {
    console.error('Error al registrar cliente público:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { getAll, getById, buscarPorTelefono, create, update, remove, registrarPublico, normalizarTelefono };
