const express = require('express');
const router = express.Router();
const { run, all } = require('../database');

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

router.get('/', (req, res) => {
  try {
    const horarios = all('SELECT * FROM horarios_funcionamento ORDER BY dia_semana ASC');
    const comNome = horarios.map((h) => ({ ...h, nome_dia: DIAS[h.dia_semana] }));
    res.json(comNome);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar horários', detalhe: err.message });
  }
});

router.put('/:dia', (req, res) => {
  try {
    const dia = parseInt(req.params.dia);
    if (dia < 0 || dia > 6) return res.status(400).json({ erro: 'Dia inválido (0=Dom ... 6=Sab)' });

    const { hora_inicio, hora_fim, ativo } = req.body;

    run(`
      INSERT INTO horarios_funcionamento (dia_semana, hora_inicio, hora_fim, ativo)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(dia_semana) DO UPDATE SET
        hora_inicio = excluded.hora_inicio,
        hora_fim = excluded.hora_fim,
        ativo = excluded.ativo
    `, [dia, hora_inicio || '09:00', hora_fim || '18:00', ativo ? 1 : 0]);

    const horarios = all('SELECT * FROM horarios_funcionamento ORDER BY dia_semana ASC');
    res.json(horarios.map((h) => ({ ...h, nome_dia: DIAS[h.dia_semana] })));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar horário', detalhe: err.message });
  }
});

module.exports = router;
