const express = require('express');
const router = express.Router();
const db = require('../database');

const n = (v) => (v !== undefined ? v : null);

router.get('/', (req, res) => {
  try {
    const { busca, status } = req.query;
    let query = 'SELECT * FROM pacientes';
    const params = [];
    const condicoes = [];

    if (busca) {
      condicoes.push('(nome LIKE ? OR telefone LIKE ? OR email LIKE ?)');
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }
    if (status) {
      condicoes.push('status_retorno = ?');
      params.push(status);
    }
    if (condicoes.length > 0) {
      query += ' WHERE ' + condicoes.join(' AND ');
    }
    query += ' ORDER BY nome ASC';

    const pacientes = params.length > 0
      ? db.prepare(query).all(params)
      : db.prepare(query).all();
    res.json(pacientes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pacientes', detalhe: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const paciente = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(req.params.id);
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado' });

    const atendimentos = db.prepare(`
      SELECT a.*, p.nome AS profissional_nome, s.nome AS servico_nome
      FROM atendimentos a
      LEFT JOIN profissionais p ON a.profissional_id = p.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.paciente_id = ?
      ORDER BY a.data_realizacao DESC
    `).all(req.params.id);

    res.json({ ...paciente, atendimentos });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar paciente', detalhe: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nome, telefone, email, data_nascimento, anamnese, historico_clinico, status_retorno, origem } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

    const resultado = db.prepare(`
      INSERT INTO pacientes (nome, telefone, email, data_nascimento, anamnese, historico_clinico, status_retorno, origem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run([nome, n(telefone), n(email), n(data_nascimento), n(anamnese), n(historico_clinico), status_retorno || 'ativo', n(origem)]);

    const novo = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar paciente', detalhe: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const paciente = db.prepare('SELECT id FROM pacientes WHERE id = ?').get(req.params.id);
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado' });

    const { nome, telefone, email, data_nascimento, anamnese, historico_clinico, status_retorno, origem } = req.body;

    db.prepare(`
      UPDATE pacientes
      SET nome = ?, telefone = ?, email = ?, data_nascimento = ?,
          anamnese = ?, historico_clinico = ?, status_retorno = ?, origem = ?
      WHERE id = ?
    `).run([nome, n(telefone), n(email), n(data_nascimento), n(anamnese), n(historico_clinico), n(status_retorno), n(origem), req.params.id]);

    const atualizado = db.prepare('SELECT * FROM pacientes WHERE id = ?').get(req.params.id);
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar paciente', detalhe: err.message });
  }
});

module.exports = router;
