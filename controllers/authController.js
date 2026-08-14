const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.usuario.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const register = async (req, res) => {
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

    const token = jwt.sign(
      { id: newUser.id, nombre, email, rol: newUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registro exitoso',
      token,
      user: { id: newUser.id, nombre, email, rol: newUser.rol }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, nombre: true, email: true, rol: true, created_at: true },
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

module.exports = { login, register, getMe };
