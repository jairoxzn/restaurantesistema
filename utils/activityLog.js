const prisma = require('../config/db');

// Registra una acción en el log de auditoría. Nunca debe tumbar la operación
// principal (login, venta, cobro, etc.) si falla, por eso solo hace console.error.
const logActivity = async ({ usuario, accion, descripcion, ip }) => {
  try {
    await prisma.registroActividad.create({
      data: {
        usuario_id: usuario?.id ?? null,
        usuario_nombre: usuario?.nombre || 'Sistema',
        accion,
        descripcion,
        ip: ip || null,
      },
    });
  } catch (error) {
    console.error('No se pudo registrar actividad:', error);
  }
};

module.exports = logActivity;
