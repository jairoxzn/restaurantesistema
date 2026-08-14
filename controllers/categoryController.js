const prisma = require('../config/db');

const getAll = async (req, res) => {
  try {
    const categories = await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre } = req.body;
    
    const existing = await prisma.categoria.findUnique({
      where: { nombre },
    });
    if (existing) {
      return res.status(400).json({ message: 'La categoría ya existe.' });
    }

    const category = await prisma.categoria.create({
      data: { nombre },
    });
    res.status(201).json({ message: 'Categoría creada.', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const update = async (req, res) => {
  try {
    const { nombre } = req.body;
    const categoryId = parseInt(req.params.id, 10);
    
    const existing = await prisma.categoria.findUnique({
      where: { id: categoryId },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }

    const updated = await prisma.categoria.update({
      where: { id: categoryId },
      data: { nombre },
    });
    res.json({ message: 'Categoría actualizada.', category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const remove = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    
    const existing = await prisma.categoria.findUnique({
      where: { id: categoryId },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }

    await prisma.categoria.delete({
      where: { id: categoryId },
    });
    res.json({ message: 'Categoría eliminada.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

module.exports = { getAll, create, update, remove };
