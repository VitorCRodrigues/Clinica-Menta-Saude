const { Database } = require('node-sqlite3-wasm');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'menta.db');
const db = new Database(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    data_nascimento TEXT,
    anamnese TEXT,
    historico_clinico TEXT,
    status_retorno TEXT DEFAULT 'ativo',
    origem TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especialidade TEXT,
    percentual_padrao REAL,
    percentual_cartao REAL,
    percentual_parcelado REAL,
    observacoes TEXT,
    ativo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    valor_padrao REAL,
    duracao_minutos INTEGER,
    ativo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS atendimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER REFERENCES pacientes(id),
    profissional_id INTEGER REFERENCES profissionais(id),
    servico_id INTEGER REFERENCES servicos(id),
    data_realizacao TEXT NOT NULL,
    horario TEXT,
    valor_cobrado REAL,
    status TEXT DEFAULT 'agendado',
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS financeiro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    atendimento_id INTEGER REFERENCES atendimentos(id),
    valor_recebido REAL,
    forma_pagamento TEXT,
    num_parcelas INTEGER DEFAULT 1,
    status_pagamento TEXT DEFAULT 'pendente',
    data_pagamento TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS repasses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profissional_id INTEGER REFERENCES profissionais(id),
    atendimento_id INTEGER REFERENCES atendimentos(id),
    financeiro_id INTEGER REFERENCES financeiro(id),
    valor_bruto REAL,
    percentual_aplicado REAL,
    valor_repasse REAL,
    forma_pagamento TEXT,
    status TEXT DEFAULT 'pendente',
    competencia TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

process.on('exit', () => db.close());
process.on('SIGINT', () => { db.close(); process.exit(); });
process.on('SIGTERM', () => { db.close(); process.exit(); });

module.exports = db;
