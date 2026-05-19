const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database');

const n = (v) => (v !== undefined ? v : null);

router.get('/', (req, res) => {
  try {
    const { ativo } = req.query;
    let query = 'SELECT * FROM servicos';
    if (ativo !== undefined) {
      query += ` WHERE ativo = ${ativo === 'true' || ativo === '1' ? 1 : 0}`;
    }
    query += ' ORDER BY nome ASC';
    res.json(all(query));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar serviços', detalhe: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nome, valor_padrao, duracao_minutos } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

    const resultado = run(`
      INSERT INTO servicos (nome, valor_padrao, duracao_minutos)
      VALUES (?, ?, ?)
    `, [nome, n(valor_padrao), n(duracao_minutos)]);

    const novo = get('SELECT * FROM servicos WHERE id = ?', resultado.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar serviço', detalhe: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const servico = get('SELECT id FROM servicos WHERE id = ?', req.params.id);
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });

    const { nome, valor_padrao, duracao_minutos, ativo } = req.body;
    const ativoVal = ativo !== undefined ? (ativo ? 1 : 0) : 1;

    run(`
      UPDATE servicos SET nome = ?, valor_padrao = ?, duracao_minutos = ?, ativo = ?
      WHERE id = ?
    `, [nome, n(valor_padrao), n(duracao_minutos), ativoVal, req.params.id]);

    const atualizado = get('SELECT * FROM servicos WHERE id = ?', req.params.id);
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar serviço', detalhe: err.message });
  }
});

module.exports = router;
