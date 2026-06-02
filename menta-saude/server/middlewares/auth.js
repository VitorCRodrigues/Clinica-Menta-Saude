const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'menta-saude-secret-dev';

module.exports = function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Não autorizado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};
