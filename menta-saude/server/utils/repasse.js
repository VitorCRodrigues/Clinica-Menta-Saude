/**
 * Calcula o valor de repasse baseado no tipo_repasse do profissional.
 *
 * percentual_cartao é reinterpretado como taxa de máquina de cartão (ex: 3%)
 * quando o tipo_repasse usa fórmula base. percentual_padrao é o corte do profissional.
 */

function isCartao(fp) {
  if (!fp) return false;
  const s = fp.toLowerCase();
  return s.includes('cartao') || s.includes('cartão') ||
    s.includes('credito') || s.includes('crédito') ||
    s.includes('débito') || s.includes('debito');
}

function calcularRepasseValor({ profissional, valorTotal, formaPagamento1, numParcelas1 = 1, valorPag2 = 0, formaPagamento2 = null, numParcelas2 = 1, procedimento = '' }) {
  const tipo = profissional.tipo_repasse || 'percentual_por_procedimento';

  if (tipo === 'diaria') {
    return profissional.valor_diaria || 0;
  }

  if (tipo === 'fixo_por_dente') {
    let regras = {};
    try { regras = JSON.parse(profissional.regras_especiais || '{}'); } catch (_) {}
    const proc = (procedimento || '').toLowerCase();
    const chave = Object.keys(regras).find((k) => proc.includes(k.toLowerCase()));
    return chave ? (regras[chave] || 0) : 0;
  }

  // percentual_por_procedimento ou percentual_mensal
  const percentual = profissional.percentual_padrao || 0;
  if (!percentual) return null;

  // Forma predominante = a de maior valor
  const v1 = valorTotal - (valorPag2 || 0);
  const formaPred = (valorPag2 || 0) > v1 ? (formaPagamento2 || formaPagamento1) : formaPagamento1;
  const parcelasPred = (valorPag2 || 0) > v1 ? (numParcelas2 || 1) : (numParcelas1 || 1);

  const temCartao = isCartao(formaPred) || parcelasPred > 1;
  const taxaCartao = temCartao ? (profissional.percentual_cartao || 0) : 0;
  const descontoCartao = valorTotal * (taxaCartao / 100);
  const imposto = valorTotal * 0.15;
  const base = Math.max(0, valorTotal - descontoCartao - imposto);

  return base * (percentual / 100);
}

function getFormaPredominante(formaPagamento1, valorTotal, valorPag2, formaPagamento2) {
  const v1 = valorTotal - (valorPag2 || 0);
  return (valorPag2 || 0) > v1 ? (formaPagamento2 || formaPagamento1) : formaPagamento1;
}

module.exports = { calcularRepasseValor, getFormaPredominante };
