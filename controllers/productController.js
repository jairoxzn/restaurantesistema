const prisma = require('../config/db');
const path = require('path');
const fs = require('fs');

const getAll = async (req, res) => {
  try {
    const { categoria_id, search } = req.query;

    const where = {};
    if (categoria_id) {
      where.categoria_id = parseInt(categoria_id, 10);
    }
    if (search) {
      where.nombre = { contains: search, mode: 'insensitive' };
    }

    const products = await prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: { nombre: true }
        }
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedProducts = products.map(p => ({
      ...p,
      categoria_nombre: p.categoria?.nombre
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const getById = async (req, res) => {
  try {
    const product = await prisma.producto.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        categoria: { select: { nombre: true } }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    res.json({
      ...product,
      categoria_nombre: product.categoria?.nombre
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const imagen = req.file ? req.file.filename : null;

    const newProduct = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock, 10),
        categoria_id: parseInt(categoria_id, 10),
        imagen
      },
      include: {
        categoria: { select: { nombre: true } }
      }
    });

    res.status(201).json({
      message: 'Producto creado exitosamente.',
      product: {
        ...newProduct,
        categoria_nombre: newProduct.categoria?.nombre
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const update = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const productId = parseInt(req.params.id, 10);

    const existing = await prisma.producto.findUnique({
      where: { id: productId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    let imagen = existing.imagen;
    if (req.file) {
      if (imagen) {
        const oldPath = path.join(__dirname, '..', 'uploads', imagen);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imagen = req.file.filename;
    }

    const updatedProduct = await prisma.producto.update({
      where: { id: productId },
      data: {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: parseInt(stock, 10),
        categoria_id: parseInt(categoria_id, 10),
        imagen
      },
      include: {
        categoria: { select: { nombre: true } }
      }
    });

    res.json({
      message: 'Producto actualizado exitosamente.',
      product: {
        ...updatedProduct,
        categoria_nombre: updatedProduct.categoria?.nombre
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const remove = async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);

    const existing = await prisma.producto.findUnique({
      where: { id: productId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    if (existing.imagen) {
      const imgPath = path.join(__dirname, '..', 'uploads', existing.imagen);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await prisma.producto.delete({
      where: { id: productId }
    });
    res.json({ message: 'Producto eliminado exitosamente.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const getLowStock = async (req, res) => {
  try {
    const products = await prisma.producto.findMany({
      where: { stock: { lte: 10 } },
      include: {
        categoria: { select: { nombre: true } }
      },
      orderBy: { stock: 'asc' }
    });

    const formattedProducts = products.map(p => ({
      ...p,
      categoria_nombre: p.categoria?.nombre
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

module.exports = { getAll, getById, create, update, remove, getLowStock };
