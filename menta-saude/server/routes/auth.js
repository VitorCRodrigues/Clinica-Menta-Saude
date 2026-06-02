const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'menta-saude-secret-dev';

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  const usuario = get('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ id: payload.id, nome: payload.nome, email: payload.email, perfil: payload.perfil });
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
});

module.exports = router;
