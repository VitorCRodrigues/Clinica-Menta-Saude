const express = require('express');
const router = express.Router();
const db = require('../database');

const n = (v) => (v !== undefined ? v : null);

router.get('/', (req, res) => {
  try {
    const { data, profissional_id, paciente_id, status } = req.query;
    let query = `
      SELECT a.*,
        pac.nome AS paciente_nome,
        prof.nome AS profissional_nome,
        s.nome AS servico_nome
      FROM atendimentos a
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN profissionais prof ON a.profissional_id = prof.id
      LEFT JOIN servicos s ON a.servico_id = s.id
    `;
    const condicoes = [];
    const params = [];

    if (data) { condicoes.push('a.data_realizacao = ?'); params.push(data); }
    if (profissional_id) { condicoes.push('a.profissional_id = ?'); params.push(profissional_id); }
    if (paciente_id) { condicoes.push('a.paciente_id = ?'); params.push(paciente_id); }
    if (status) { condicoes.push('a.status = ?'); params.push(status); }

    if (condicoes.length > 0) query += ' WHERE ' + condicoes.join(' AND ');
    query += ' ORDER BY a.data_realizacao DESC, a.horario ASC';

    const atendimentos = params.length > 0
      ? db.prepare(query).all(params)
      : db.prepare(query).all();
    res.json(atendimentos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar atendimentos', detalhe: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const atendimento = db.prepare(`
      SELECT a.*,
        pac.nome AS paciente_nome,
        prof.nome AS profissional_nome,
        s.nome AS servico_nome
      FROM atendimentos a
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN profissionais prof ON a.profissional_id = prof.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

    const financeiro = db.prepare('SELECT * FROM financeiro WHERE atendimento_id = ?').all(req.params.id);
    res.json({ ...atendimento, financeiro });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar atendimento', detalhe: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { paciente_id, profissional_id, servico_id, data_realizacao, horario, valor_cobrado, status, observacoes } = req.body;
    if (!paciente_id || !data_realizacao) {
      return res.status(400).json({ erro: 'Paciente e data são obrigatórios' });
    }

    const resultado = db.prepare(`
      INSERT INTO atendimentos (paciente_id, profissional_id, servico_id, data_realizacao, horario, valor_cobrado, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run([paciente_id, n(profissional_id), n(servico_id), data_realizacao, n(horario), n(valor_cobrado), status || 'agendado', n(observacoes)]);

    const novo = db.prepare(`
      SELECT a.*, pac.nome AS paciente_nome, prof.nome AS profissional_nome, s.nome AS servico_nome
      FROM atendimentos a
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN profissionais prof ON a.profissional_id = prof.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.id = ?
    `).get(resultado.lastInsertRowid);

    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar atendimento', detalhe: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const atendimento = db.prepare('SELECT id FROM atendimentos WHERE id = ?').get(req.params.id);
    if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

    const { paciente_id, profissional_id, servico_id, data_realizacao, horario, valor_cobrado, status, observacoes } = req.body;

    db.prepare(`
      UPDATE atendimentos
      SET paciente_id = ?, profissional_id = ?, servico_id = ?, data_realizacao = ?,
          horario = ?, valor_cobrado = ?, status = ?, observacoes = ?
      WHERE id = ?
    `).run([paciente_id, n(profissional_id), n(servico_id), data_realizacao, n(horario), n(valor_cobrado), status, n(observacoes), req.params.id]);

    const atualizado = db.prepare(`
      SELECT a.*, pac.nome AS paciente_nome, prof.nome AS profissional_nome, s.nome AS servico_nome
      FROM atendimentos a
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN profissionais prof ON a.profissional_id = prof.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar atendimento', detalhe: err.message });
  }
});

module.exports = router;
