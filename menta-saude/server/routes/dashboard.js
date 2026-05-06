const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];

    const atendimentosHoje = db.prepare(`
      SELECT COUNT(*) AS total FROM atendimentos WHERE data_realizacao = ?
    `).get(hoje);

    const recebidoHoje = db.prepare(`
      SELECT COALESCE(SUM(f.valor_recebido), 0) AS total
      FROM financeiro f
      JOIN atendimentos a ON f.atendimento_id = a.id
      WHERE a.data_realizacao = ? AND f.status_pagamento = 'pago'
    `).get(hoje);

    const statusHoje = db.prepare(`
      SELECT status, COUNT(*) AS quantidade
      FROM atendimentos
      WHERE data_realizacao = ?
      GROUP BY status
    `).all(hoje);

    const daqui7Dias = new Date();
    daqui7Dias.setDate(daqui7Dias.getDate() + 7);
    const fim7Dias = daqui7Dias.toISOString().split('T')[0];

    const aniversariantes = db.prepare(`
      SELECT id, nome, telefone, data_nascimento
      FROM pacientes
      WHERE data_nascimento IS NOT NULL
        AND strftime('%m-%d', data_nascimento) BETWEEN strftime('%m-%d', ?) AND strftime('%m-%d', ?)
      ORDER BY strftime('%m-%d', data_nascimento)
    `).all(hoje, fim7Dias);

    const seismesesAtras = new Date();
    seismesesAtras.setMonth(seismesesAtras.getMonth() - 6);
    const dataLimite = seismesesAtras.toISOString().split('T')[0];

    const semConsulta = db.prepare(`
      SELECT p.id, p.nome, p.telefone, MAX(a.data_realizacao) AS ultima_consulta
      FROM pacientes p
      LEFT JOIN atendimentos a ON p.id = a.paciente_id
      WHERE p.status_retorno = 'ativo'
      GROUP BY p.id
      HAVING ultima_consulta IS NULL OR ultima_consulta < ?
      ORDER BY ultima_consulta ASC
      LIMIT 20
    `).all(dataLimite);

    const repassesPendentes = db.prepare(`
      SELECT prof.nome AS profissional_nome, prof.id AS profissional_id,
        COUNT(*) AS quantidade,
        SUM(r.valor_repasse) AS total_pendente
      FROM repasses r
      JOIN profissionais prof ON r.profissional_id = prof.id
      WHERE r.status = 'pendente'
      GROUP BY r.profissional_id
      ORDER BY total_pendente DESC
    `).all();

    res.json({
      atendimentos_hoje: atendimentosHoje.total,
      recebido_hoje: recebidoHoje.total,
      status_hoje: statusHoje,
      aniversariantes,
      sem_consulta: semConsulta,
      repasses_pendentes: repassesPendentes
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar dashboard', detalhe: err.message });
  }
});

module.exports = router;
