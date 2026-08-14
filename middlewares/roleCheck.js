const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Acceso no autorizado.' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
    }
    next();
  };
};

module.exports = roleCheck;
