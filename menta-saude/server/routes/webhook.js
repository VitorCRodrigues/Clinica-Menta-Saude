const express = require('express');
const router = express.Router();
const { run, get } = require('../database');

const n = (v) => (v !== undefined && v !== '' ? v : null);

router.post('/paciente', (req, res) => {
  try {
    const body = req.body;

    const nome = body['Nome completo'] || body['nome'] || null;
    const telefone = body['Telefone'] || body['telefone'] || null;
    const email = body['Email'] || body['email'] || null;
    const data_nascimento = body['Data de nascimento'] || body['data_nascimento'] || null;
    const origem = body['origem'] || 'webhook';

    if (!nome) return res.status(400).json({ erro: 'Campo "Nome completo" é obrigatório' });

    const resultado = run(`
      INSERT INTO pacientes (nome, telefone, email, data_nascimento, status_retorno, origem)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nome, n(telefone), n(email), n(data_nascimento), 'ativo', origem]);

    const novo = get('SELECT * FROM pacientes WHERE id = ?', resultado.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar webhook', detalhe: err.message });
  }
});

module.exports = router;
