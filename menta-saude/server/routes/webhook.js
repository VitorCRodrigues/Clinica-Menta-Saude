const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database');
const { calcularRepasseValor, getFormaPredominante } = require('../utils/repasse');

const n = (v) => (v !== undefined && v !== '' ? v : null);

function parseDate(str) {
  if (!str) return null;
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return str;
}

router.post('/paciente', (req, res) => {
  try {
    const body = req.body;

    const nome = body['Nome completo'] || body['nome'] || null;
    const telefone = body['Telefone'] || body['telefone'] || null;
    const email = body['Email'] || body['email'] || null;
    const data_nascimento = body['Data de nascimento'] || body['data_nascimento'] || null;
    const cpf = body['CPF'] || body['cpf'] || null;
    const endereco = body['Endereço'] || body['Endereco'] || body['endereco'] || null;
    const profissao = body['Profissão'] || body['Profissao'] || body['profissao'] || null;
    const origem = body['origem'] || 'webhook';

    if (!nome) return res.status(400).json({ erro: 'Campo "Nome completo" é obrigatório' });

    const resultado = run(`
      INSERT INTO pacientes (nome, telefone, email, data_nascimento, cpf, endereco, profissao, status_retorno, origem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nome, n(telefone), n(email), n(data_nascimento), n(cpf), n(endereco), n(profissao), 'ativo', origem]);

    const novo = get('SELECT * FROM pacientes WHERE id = ?', resultado.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar webhook', detalhe: err.message });
  }
});

router.post('/consulta', (req, res) => {
  try {
    const body = req.body;

    const nomePaciente = body['Nome do paciente'] || body['nome_paciente'] || body['nome'] || null;
    const telefone = body['Telefone'] || body['telefone'] || null;
    const dataConsulta = parseDate(body['Data da consulta'] || body['data_consulta']);
    const horario = body['Horario'] || body['horario'] || null;
    const nomeDentista = body['Dentista responsavel'] || body['dentista'] || body['profissional'] || null;
    const tipoProcedimento = body['Tipo de procedimento'] || body['servico'] || null;
    const statusRaw = (body['Status'] || body['status'] || 'agendado').toLowerCase();

    if (!nomePaciente) return res.status(400).json({ erro: 'Campo "Nome do paciente" é obrigatório' });
    if (!dataConsulta) return res.status(400).json({ erro: 'Campo "Data da consulta" é obrigatório' });

    const statusMap = {
      'realizada': 'realizado', 'realizado': 'realizado',
      'agendada': 'agendado',   'agendado': 'agendado',
      'cancelada': 'cancelado', 'cancelado': 'cancelado',
    };
    const status = statusMap[statusRaw] || statusRaw;

    let paciente = telefone
      ? get('SELECT * FROM pacientes WHERE nome = ? AND telefone = ?', [nomePaciente, telefone])
      : get('SELECT * FROM pacientes WHERE nome = ?', [nomePaciente]);

    if (!paciente) {
      const r = run(
        'INSERT INTO pacientes (nome, telefone, status_retorno, origem) VALUES (?, ?, ?, ?)',
        [nomePaciente, n(telefone), 'ativo', 'webhook']
      );
      paciente = get('SELECT * FROM pacientes WHERE id = ?', r.lastInsertRowid);
    }

    let profissionalId = null;
    if (nomeDentista) {
      let profissional = get('SELECT * FROM profissionais WHERE nome = ?', [nomeDentista]);
      if (!profissional) {
        const r = run('INSERT INTO profissionais (nome) VALUES (?)', [nomeDentista]);
        profissional = get('SELECT * FROM profissionais WHERE id = ?', r.lastInsertRowid);
      }
      profissionalId = profissional.id;
    }

    let servicoId = null;
    if (tipoProcedimento) {
      let servico = get('SELECT * FROM servicos WHERE nome = ?', [tipoProcedimento]);
      if (!servico) {
        const r = run('INSERT INTO servicos (nome) VALUES (?)', [tipoProcedimento]);
        servico = get('SELECT * FROM servicos WHERE id = ?', r.lastInsertRowid);
      }
      servicoId = servico.id;
    }

    const resultado = run(`
      INSERT INTO atendimentos (paciente_id, profissional_id, servico_id, data_realizacao, horario, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [paciente.id, profissionalId, servicoId, dataConsulta, n(horario), status]);

    const novo = get(`
      SELECT a.*, pac.nome AS paciente_nome, prof.nome AS profissional_nome, s.nome AS servico_nome
      FROM atendimentos a
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN profissionais prof ON a.profissional_id = prof.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.id = ?
    `, resultado.lastInsertRowid);

    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar webhook de consulta', detalhe: err.message });
  }
});

router.post('/financeiro', (req, res) => {
  try {
    const body = req.body;

    const nomePaciente = body['Nome do paciente'] || body['nome_paciente'] || body['nome'] || null;
    const nomeDentista = body['Dentista responsável'] || body['Dentista responsavel'] || body['dentista'] || null;
    const procedimento = body['Procedimento realizado'] || body['procedimento'] || null;
    const valorRecebido = parseFloat(String(body['Valor cobrado'] || body['valor'] || body['valor_recebido'] || '0').replace(',', '.')) || 0;
    const formaPagamento = body['Forma de pagamento'] || body['forma_pagamento'] || null;
    const numParcelas = parseInt(body['Número de parcelas'] || body['num_parcelas'] || '1') || 1;
    const formaPagamento2 = body['Forma de pagamento 2'] || body['forma_pagamento_2'] || null;
    const valorPagamento2 = formaPagamento2 ? parseFloat(String(body['Valor pagamento 2'] || body['valor_pagamento_2'] || '0').replace(',', '.')) || 0 : 0;
    const numParcelas2 = parseInt(body['Parcelas 2'] || body['num_parcelas_2'] || '1') || 1;
    const dataPagamento = parseDate(body['Data de pagamento'] || body['data_pagamento']);
    const statusRaw = (body['Status'] || body['status_pagamento'] || 'pendente').toLowerCase();

    if (!nomePaciente) return res.status(400).json({ erro: 'Campo "Nome do paciente" é obrigatório' });
    if (!valorRecebido) return res.status(400).json({ erro: 'Campo "Valor cobrado" é obrigatório' });

    const statusMap = { 'pago': 'pago', 'recebido': 'pago', 'pendente': 'pendente', 'cancelado': 'cancelado' };
    const statusPagamento = statusMap[statusRaw] || statusRaw;

    // valor_recebido total = forma1 + forma2
    const valorTotal = valorRecebido + (valorPagamento2 || 0);

    let paciente = get('SELECT * FROM pacientes WHERE nome = ?', [nomePaciente]);
    if (!paciente) {
      const r = run('INSERT INTO pacientes (nome, status_retorno, origem) VALUES (?, ?, ?)', [nomePaciente, 'ativo', 'webhook']);
      paciente = get('SELECT * FROM pacientes WHERE id = ?', r.lastInsertRowid);
    }

    let profissionalId = null;
    let profissional = null;
    if (nomeDentista) {
      profissional = get('SELECT * FROM profissionais WHERE nome = ?', [nomeDentista]);
      if (!profissional) {
        const r = run('INSERT INTO profissionais (nome) VALUES (?)', [nomeDentista]);
        profissional = get('SELECT * FROM profissionais WHERE id = ?', r.lastInsertRowid);
      }
      profissionalId = profissional.id;
    }

    let servicoId = null;
    if (procedimento) {
      let servico = get('SELECT * FROM servicos WHERE nome = ?', [procedimento]);
      if (!servico) {
        const r = run('INSERT INTO servicos (nome) VALUES (?)', [procedimento]);
        servico = get('SELECT * FROM servicos WHERE id = ?', r.lastInsertRowid);
      }
      servicoId = servico.id;
    }

    let atendimento = get(
      'SELECT * FROM atendimentos WHERE paciente_id = ? ORDER BY created_at DESC LIMIT 1',
      [paciente.id]
    );

    if (!atendimento) {
      const dataHoje = new Date().toISOString().split('T')[0];
      const r = run(`
        INSERT INTO atendimentos (paciente_id, profissional_id, servico_id, data_realizacao, valor_cobrado, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [paciente.id, profissionalId, servicoId, dataPagamento || dataHoje, valorTotal, 'realizado']);
      atendimento = get('SELECT * FROM atendimentos WHERE id = ?', r.lastInsertRowid);
    }

    const resultadoFin = run(`
      INSERT INTO financeiro (atendimento_id, valor_recebido, forma_pagamento, num_parcelas, forma_pagamento_2, valor_pagamento_2, num_parcelas_2, status_pagamento, data_pagamento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [atendimento.id, valorTotal, n(formaPagamento), numParcelas, n(formaPagamento2), n(valorPagamento2) || null, numParcelas2, statusPagamento, n(dataPagamento)]);

    const financeiroId = resultadoFin.lastInsertRowid;

    let repasseCalculado = null;
    if (profissional && valorTotal > 0) {
      const valorRepasse = calcularRepasseValor({
        profissional,
        valorTotal,
        formaPagamento1: formaPagamento,
        numParcelas1: numParcelas,
        valorPag2: valorPagamento2,
        formaPagamento2,
        numParcelas2,
        procedimento,
      });

      if (valorRepasse != null && valorRepasse > 0) {
        const formaPred = getFormaPredominante(formaPagamento, valorTotal, valorPagamento2, formaPagamento2);
        const competencia = (dataPagamento || new Date().toISOString().split('T')[0]).substring(0, 7);

        run(`
          INSERT INTO repasses (profissional_id, atendimento_id, financeiro_id, valor_bruto, percentual_aplicado, valor_repasse, forma_pagamento, status, competencia)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [profissionalId, atendimento.id, financeiroId, valorTotal, profissional.percentual_padrao || 0, valorRepasse, n(formaPred), 'pendente', competencia]);

        repasseCalculado = valorRepasse;
      }
    }

    res.status(201).json({
      sucesso: true,
      financeiro_id: financeiroId,
      repasse_calculado: repasseCalculado,
      atendimento_id: atendimento.id,
      paciente_id: paciente.id
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar webhook financeiro', detalhe: err.message });
  }
});

router.get('/acompanhamento', (req, res) => {
  try {
    const atendimentos = all(`
      SELECT a.*,
        pac.nome AS paciente_nome, pac.telefone AS paciente_telefone,
        prof.nome AS profissional_nome,
        s.nome AS servico_nome
      FROM atendimentos a
      LEFT JOIN pacientes pac ON a.paciente_id = pac.id
      LEFT JOIN profissionais prof ON a.profissional_id = prof.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.status = 'agendado'
      ORDER BY a.data_realizacao ASC, a.horario ASC
    `);
    res.json(atendimentos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar acompanhamentos', detalhe: err.message });
  }
});

module.exports = router;
