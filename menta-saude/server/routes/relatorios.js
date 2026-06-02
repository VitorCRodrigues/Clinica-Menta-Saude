const express = require('express');
const router = express.Router();
const { all, get } = require('../database');

router.get('/', (req, res) => {
  try {
    const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;
    const ano = parseInt(req.query.ano) || new Date().getFullYear();

    const mesStr = String(mes).padStart(2, '0');
    const inicio = `${ano}-${mesStr}-01`;
    const fimDia = new Date(ano, mes, 0).getDate();
    const fim = `${ano}-${mesStr}-${String(fimDia).padStart(2, '0')}`;
    const competencia = `${ano}-${mesStr}`;

    // Pacientes novos no período
    const pacientesNovos = get(
      `SELECT COUNT(*) AS total FROM pacientes WHERE date(created_at) BETWEEN ? AND ?`,
      [inicio, fim]
    );

    // Total de consultas realizadas no período
    const consultasRealizadas = get(
      `SELECT COUNT(*) AS total FROM atendimentos WHERE data_realizacao BETWEEN ? AND ? AND status = 'realizado'`,
      [inicio, fim]
    );

    // Consultas por tipo de procedimento
    const porProcedimento = all(`
      SELECT s.nome AS procedimento, COUNT(*) AS quantidade
      FROM atendimentos a
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.data_realizacao BETWEEN ? AND ? AND a.status = 'realizado'
      GROUP BY s.id, s.nome
      ORDER BY quantidade DESC
    `, [inicio, fim]);

    // Pacientes que retornaram (status = 'retornou' ou atendimentos após contato)
    const retornaram = get(
      `SELECT COUNT(*) AS total FROM pacientes WHERE status_retorno = 'retornou' AND date(created_at) BETWEEN ? AND ?`,
      [inicio, fim]
    );

    // Receita total do período (pagamentos com status = pago)
    const receitaTotal = get(`
      SELECT COALESCE(SUM(f.valor_recebido), 0) AS total
      FROM financeiro f
      WHERE f.status_pagamento = 'pago'
        AND date(f.data_pagamento) BETWEEN ? AND ?
    `, [inicio, fim]);

    // Repasses por dentista no período
    const repassesPorDentista = all(`
      SELECT
        p.nome AS profissional,
        COUNT(r.id) AS quantidade,
        COALESCE(SUM(r.valor_bruto), 0) AS total_bruto,
        COALESCE(SUM(r.valor_repasse), 0) AS total_repasse,
        r.status
      FROM repasses r
      JOIN profissionais p ON r.profissional_id = p.id
      WHERE r.competencia = ?
      GROUP BY r.profissional_id, r.status
      ORDER BY p.nome ASC
    `, [competencia]);

    // Todas as consultas do período (para o gráfico por data)
    const consultasPorDia = all(`
      SELECT data_realizacao AS data, COUNT(*) AS quantidade
      FROM atendimentos
      WHERE data_realizacao BETWEEN ? AND ? AND status = 'realizado'
      GROUP BY data_realizacao
      ORDER BY data_realizacao ASC
    `, [inicio, fim]);

    res.json({
      periodo: { mes, ano, inicio, fim },
      pacientes_novos: pacientesNovos?.total || 0,
      consultas_realizadas: consultasRealizadas?.total || 0,
      por_procedimento: porProcedimento,
      retornaram: retornaram?.total || 0,
      receita_total: receitaTotal?.total || 0,
      repasses_por_dentista: repassesPorDentista,
      consultas_por_dia: consultasPorDia,
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao gerar relatório', detalhe: err.message });
  }
});

module.exports = router;
