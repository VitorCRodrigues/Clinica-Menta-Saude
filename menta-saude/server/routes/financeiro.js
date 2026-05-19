const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database');

const n = (v) => (v !== undefined ? v : null);

function calcularRepasse(financeiroId, atendimentoId, valorRecebido, formaPagamento, numParcelas, dataPagamento) {
  const atendimento = get('SELECT * FROM atendimentos WHERE id = ?', atendimentoId);
  if (!atendimento || !atendimento.profissional_id) return;

  const profissional = get('SELECT * FROM profissionais WHERE id = ?', atendimento.profissional_id);
  if (!profissional) return;

  let percentual = profissional.percentual_padrao;
  if (formaPagamento === 'cartao_debito') {
    percentual = profissional.percentual_cartao;
  } else if (formaPagamento === 'cartao_credito' || (numParcelas && numParcelas > 1)) {
    percentual = profissional.percentual_parcelado;
  }

  if (!percentual) return;

  const valorRepasse = valorRecebido * (percentual / 100);
  const competencia = dataPagamento
    ? dataPagamento.substring(0, 7)
    : new Date().toISOString().substring(0, 7);

  run(`
    INSERT INTO repasses (profissional_id, atendimento_id, financeiro_id, valor_bruto, percentual_aplicado, valor_repasse, forma_pagamento, competencia)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [atendimento.profissional_id, atendimentoId, financeiroId, valorRecebido, percentual, valorRepasse, n(formaPagamento), competencia]);
}

router.get('/', (req, res) => {
  try {
    const { status_pagamento, forma_pagamento, atendimento_id } = req.query;
    let query = `
      SELECT f.*,
        a.data_realizacao, a.horario,
        pac.nome AS paciente_nome,
        prof.nome AS profissional_nome
      FROM financeiro f
      LEFT JOIN atendimentos a ON f.atendimento_id = a.id
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN profissionais prof ON a.profissional_id = prof.id
    `;
    const condicoes = [];
    const params = [];

    if (status_pagamento) { condicoes.push('f.status_pagamento = ?'); params.push(status_pagamento); }
    if (forma_pagamento) { condicoes.push('f.forma_pagamento = ?'); params.push(forma_pagamento); }
    if (atendimento_id) { condicoes.push('f.atendimento_id = ?'); params.push(atendimento_id); }

    if (condicoes.length > 0) query += ' WHERE ' + condicoes.join(' AND ');
    query += ' ORDER BY f.created_at DESC';

    res.json(all(query, params));
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar registros financeiros', detalhe: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { atendimento_id, valor_recebido, forma_pagamento, num_parcelas, status_pagamento, data_pagamento, observacoes } = req.body;
    if (!atendimento_id || !valor_recebido) {
      return res.status(400).json({ erro: 'Atendimento e valor são obrigatórios' });
    }

    const resultado = run(`
      INSERT INTO financeiro (atendimento_id, valor_recebido, forma_pagamento, num_parcelas, status_pagamento, data_pagamento, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [atendimento_id, valor_recebido, n(forma_pagamento), num_parcelas || 1, status_pagamento || 'pendente', n(data_pagamento), n(observacoes)]);

    if (status_pagamento === 'pago') {
      calcularRepasse(resultado.lastInsertRowid, atendimento_id, valor_recebido, forma_pagamento, num_parcelas, data_pagamento);
    }

    const novo = get('SELECT * FROM financeiro WHERE id = ?', resultado.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar registro financeiro', detalhe: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const registro = get('SELECT * FROM financeiro WHERE id = ?', req.params.id);
    if (!registro) return res.status(404).json({ erro: 'Registro não encontrado' });

    const { atendimento_id, valor_recebido, forma_pagamento, num_parcelas, status_pagamento, data_pagamento, observacoes } = req.body;
    const eraInativo = registro.status_pagamento !== 'pago';
    const virandoPago = status_pagamento === 'pago';

    run(`
      UPDATE financeiro
      SET atendimento_id = ?, valor_recebido = ?, forma_pagamento = ?, num_parcelas = ?,
          status_pagamento = ?, data_pagamento = ?, observacoes = ?
      WHERE id = ?
    `, [atendimento_id, valor_recebido, n(forma_pagamento), num_parcelas || 1, status_pagamento, n(data_pagamento), n(observacoes), req.params.id]);

    if (eraInativo && virandoPago) {
      calcularRepasse(registro.id, atendimento_id, valor_recebido, forma_pagamento, num_parcelas, data_pagamento);
    }

    const atualizado = get('SELECT * FROM financeiro WHERE id = ?', req.params.id);
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar registro financeiro', detalhe: err.message });
  }
});

module.exports = router;
