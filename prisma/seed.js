const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando datos básicos...');

  // 1. Limpiar la base de datos (opcional para un inicio limpio en dev)
  // await prisma.detalleVenta.deleteMany();
  // await prisma.venta.deleteMany();
  // await prisma.kardex.deleteMany();
  // await prisma.producto.deleteMany();
  // await prisma.categoria.deleteMany();
  // await prisma.cierreMesa.deleteMany();
  // await prisma.mesa.deleteMany();
  // await prisma.gasto.deleteMany();
  // await prisma.cajaSesion.deleteMany();
  // await prisma.usuario.deleteMany();

  // 2. Crear admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cafeteriacolca.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@cafeteriacolca.com',
      password: adminPassword,
      rol: 'ADMIN',
    },
  });
  console.log('Admin user creado/verificado.');

  // 3. Crear categorías
  const categoriasData = [
    { nombre: 'Café' },
    { nombre: 'Postres' },
    { nombre: 'Bebidas Frías' },
    { nombre: 'Panadería' },
    { nombre: 'Snacks' },
  ];

  for (const cat of categoriasData) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    });
  }
  console.log('Categorías creadas.');

  // 4. Crear productos de ejemplo
  const categoriaCafe = await prisma.categoria.findUnique({ where: { nombre: 'Café' } });
  const categoriaPostres = await prisma.categoria.findUnique({ where: { nombre: 'Postres' } });

  if (categoriaCafe && categoriaPostres) {
    const productosData = [
      {
        nombre: 'Espresso',
        descripcion: 'Café espresso clásico, intenso y aromático',
        precio: 5.50,
        stock: 100,
        categoria_id: categoriaCafe.id,
      },
      {
        nombre: 'Cappuccino',
        descripcion: 'Espresso con leche espumada y cacao en polvo',
        precio: 8.00,
        stock: 80,
        categoria_id: categoriaCafe.id,
      },
      {
        nombre: 'Cheesecake',
        descripcion: 'Cheesecake cremoso con base de galleta',
        precio: 12.00,
        stock: 25,
        categoria_id: categoriaPostres.id,
      },
    ];

    for (const prod of productosData) {
      await prisma.producto.create({
        data: prod
      });
    }
    console.log('Productos de ejemplo creados.');
  }

  console.log('Semilla completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
