const express = require('express');
const router = express.Router();
const db = require('../database');

const n = (v) => (v !== undefined ? v : null);

router.get('/', (req, res) => {
  try {
    const { ativo } = req.query;
    let query = 'SELECT * FROM profissionais';
    if (ativo !== undefined) {
      query += ` WHERE ativo = ${ativo === 'true' || ativo === '1' ? 1 : 0}`;
    }
    query += ' ORDER BY nome ASC';
    const profissionais = db.prepare(query).all();
    res.json(profissionais);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar profissionais', detalhe: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nome, especialidade, percentual_padrao, percentual_cartao, percentual_parcelado, observacoes } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

    const resultado = db.prepare(`
      INSERT INTO profissionais (nome, especialidade, percentual_padrao, percentual_cartao, percentual_parcelado, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run([nome, n(especialidade), n(percentual_padrao), n(percentual_cartao), n(percentual_parcelado), n(observacoes)]);

    const novo = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar profissional', detalhe: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const profissional = db.prepare('SELECT id FROM profissionais WHERE id = ?').get(req.params.id);
    if (!profissional) return res.status(404).json({ erro: 'Profissional não encontrado' });

    const { nome, especialidade, percentual_padrao, percentual_cartao, percentual_parcelado, observacoes, ativo } = req.body;
    const ativoVal = ativo !== undefined ? (ativo ? 1 : 0) : 1;

    db.prepare(`
      UPDATE profissionais
      SET nome = ?, especialidade = ?, percentual_padrao = ?, percentual_cartao = ?,
          percentual_parcelado = ?, observacoes = ?, ativo = ?
      WHERE id = ?
    `).run([nome, n(especialidade), n(percentual_padrao), n(percentual_cartao), n(percentual_parcelado), n(observacoes), ativoVal, req.params.id]);

    const atualizado = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(req.params.id);
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar profissional', detalhe: err.message });
  }
});

module.exports = router;
