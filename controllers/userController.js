const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existing = await prisma.usuario.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol || 'EMPLEADO',
      },
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente.',
      user: { id: newUser.id, nombre, email, rol: newUser.rol }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const update = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const userId = parseInt(req.params.id, 10);

    const existing = await prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const updateData = { nombre, email, rol };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      message: 'Usuario actualizado exitosamente.',
      user: { id: updatedUser.id, nombre, email, rol: updatedUser.rol }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const remove = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    const existing = await prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario.' });
    }

    await prisma.usuario.delete({
      where: { id: userId },
    });
    res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

module.exports = { getAll, create, update, remove };
