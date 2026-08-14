// Punto de entrada serverless para Vercel.
// Vercel enruta aquí todo /api/* (ver vercel.json) y este archivo
// simplemente reexporta la app de Express: Vercel la invoca como
// función (req, res) en cada request, sin necesidad de app.listen().
module.exports = require('../app');
