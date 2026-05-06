const express = require('express');
const cors = require('cors');

const app = express();
const PORTA = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/servicos', require('./routes/servicos'));
app.use('/api/atendimentos', require('./routes/atendimentos'));
app.use('/api/financeiro', require('./routes/financeiro'));
app.use('/api/repasses', require('./routes/repasses'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor', detalhe: err.message });
});

app.listen(PORTA, () => {
  console.log(`Servidor Menta Saúde rodando na porta ${PORTA}`);
});
