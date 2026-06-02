const express = require('express');
const cors = require('cors');
const { inicializarBanco } = require('./database');
const autenticar = require('./middlewares/auth');

const app = express();
const PORTA = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota pública
app.use('/api/auth', require('./routes/auth'));

// Rotas protegidas
app.use('/api/webhook', autenticar, require('./routes/webhook'));
app.use('/api/dashboard', autenticar, require('./routes/dashboard'));
app.use('/api/pacientes', autenticar, require('./routes/pacientes'));
app.use('/api/profissionais', autenticar, require('./routes/profissionais'));
app.use('/api/servicos', autenticar, require('./routes/servicos'));
app.use('/api/atendimentos', autenticar, require('./routes/atendimentos'));
app.use('/api/financeiro', autenticar, require('./routes/financeiro'));
app.use('/api/repasses', autenticar, require('./routes/repasses'));
app.use('/api/relatorios', autenticar, require('./routes/relatorios'));
app.use('/api/horarios', autenticar, require('./routes/horarios'));

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
