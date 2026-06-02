const express = require('express');
const cors = require('cors');
const { inicializarBanco } = require('./database');

const app = express();
const PORTA = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/profissionais', require('./routes/profissionais'));
app.use('/api/servicos', require('./routes/servicos'));
app.use('/api/atendimentos', require('./routes/atendimentos'));
app.use('/api/financeiro', require('./routes/financeiro'));
app.use('/api/repasses', require('./routes/repasses'));
app.use('/api/relatorios', require('./routes/relatorios'));
app.use('/api/horarios', require('./routes/horarios'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor', detalhe: err.message });
});

inicializarBanco().then(() => {
  app.listen(PORTA, () => {
    console.log(`Servidor Menta Saúde rodando na porta ${PORTA}`);
  });
}).catch(err => {
  console.error('Erro ao inicializar banco:', err);
  process.exit(1);
});
