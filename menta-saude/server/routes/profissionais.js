const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database');

const n = (v) => (v !== undefined ? v : null);

router.get('/', (req, res) => {
  try {
    const { ativo } = req.query;
    let query = 'SELECT * FROM profissionais';
    if (ativo !== undefined) {
      query += ` WHERE ativo = ${ativo === 'true' || ativo === '1' ? 1 : 0}`;
    }
    query += ' ORDER BY nome ASC';
    res.json(all(query));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar profissionais', detalhe: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nome, especialidade, percentual_padrao, percentual_cartao, percentual_parcelado, observacoes } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

    const resultado = run(`
      INSERT INTO profissionais (nome, especialidade, percentual_padrao, percentual_cartao, percentual_parcelado, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nome, n(especialidade), n(percentual_padrao), n(percentual_cartao), n(percentual_parcelado), n(observacoes)]);

    const novo = get('SELECT * FROM profissionais WHERE id = ?', resultado.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar profissional', detalhe: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const profissional = get('SELECT id FROM profissionais WHERE id = ?', req.params.id);
    if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado' });

    const { nome, especialidade, percentual_padrao, percentual_cartao, percentual_parcelado, observacoes, ativo } = req.body;
    const ativoVal = ativo !== undefined ? (ativo ? 1 : 0) : 1;

    run(`
      UPDATE profissionais
      SET nome = ?, especialidade = ?, percentual_padrao = ?, percentual_cartao = ?,
          percentual_parcelado = ?, observacoes = ?, ativo = ?
      WHERE id = ?
    `, [nome, n(especialidade), n(percentual_padrao), n(percentual_cartao), n(percentual_parcelado), n(observacoes), ativoVal, req.params.id]);

    const atualizado = get('SELECT * FROM profissionais WHERE id = ?', req.params.id);
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar profissional', detalhe: err.message });
  }
});

module.exports = router;
