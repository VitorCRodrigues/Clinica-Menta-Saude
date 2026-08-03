const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'menta-saude-secret-dev';

const token = jwt.sign(
  { usuario: 'n8n-webhook', tipo: 'servico' },
  JWT_SECRET,
  { expiresIn: '10y' }
);

console.log(token);