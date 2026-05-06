const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    const { status, competencia } = req.query;
    let query = `
      SELECT r.*,
        prof.nome AS profissional_nome,
        pac.nome AS paciente_nome,
        a.data_realizacao, a.horario,
        s.nome AS servico_nome
      FROM repasses r
      LEFT JOIN profissionais prof ON r.profissional_id = prof.id
      LEFT JOIN atendimentos a ON r.atendimento_id = a.id
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN servicos s ON a.servico_id = s.id
    `;
    const condicoes = [];
    const params = [];

    if (status) { condicoes.push('r.status = ?'); params.push(status); }
    if (competencia) { condicoes.push('r.competencia = ?'); params.push(competencia); }

    if (condicoes.length > 0) query += ' WHERE ' + condicoes.join(' AND ');
    query += ' ORDER BY r.created_at DESC';

    const repasses = params.length > 0
      ? db.prepare(query).all(params)
      : db.prepare(query).all();
    res.json(repasses);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar repasses', detalhe: err.message });
  }
});

router.get('/profissional/:id', (req, res) => {
  try {
    const { status, competencia } = req.query;
    let query = `
      SELECT r.*,
        prof.nome AS profissional_nome,
        pac.nome AS paciente_nome,
        a.data_realizacao,
        s.nome AS servico_nome
      FROM repasses r
      LEFT JOIN profissionais prof ON r.profissional_id = prof.id
      LEFT JOIN atendimentos a ON r.atendimento_id = a.id
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE r.profissional_id = ?
    `;
    const params = [req.params.id];

    if (status) { query += ' AND r.status = ?'; params.push(status); }
    if (competencia) { query += ' AND r.competencia = ?'; params.push(competencia); }
    query += ' ORDER BY r.created_at DESC';

    const repasses = db.prepare(query).all(params);

    let totaisQuery = 'SELECT SUM(valor_repasse) AS total_repasse, SUM(valor_bruto) AS total_bruto, COUNT(*) AS quantidade FROM repasses WHERE profissional_id = ?';
    const totaisParams = [req.params.id];
    if (status) { totaisQuery += ' AND status = ?'; totaisParams.push(status); }
    if (competencia) { totaisQuery += ' AND competencia = ?'; totaisParams.push(competencia); }

    const totais = db.prepare(totaisQuery).get(totaisParams);

    res.json({ repasses, totais });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar repasses do profissional', detalhe: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const repasse = db.prepare('SELECT id FROM repasses WHERE id = ?').get(req.params.id);
    if (!repasse) return res.status(404).json({ erro: 'Repasse não encontrado' });

    const { status, forma_pagamento } = req.body;

    db.prepare(`
      UPDATE repasses SET status = ?, forma_pagamento = ?
      WHERE id = ?
    `).run([status, forma_pagamento, req.params.id]);

    const atualizado = db.prepare('SELECT * FROM repasses WHERE id = ?').get(req.params.id);
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar repasse', detalhe: err.message });
  }
});

module.exports = router;
