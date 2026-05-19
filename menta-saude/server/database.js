const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'menta.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db;

async function inicializarBanco() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS pacientes (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS profissionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especialidade TEXT,
    percentual_padrao REAL,
    percentual_cartao REAL,
    percentual_parcelado REAL,
    observacoes TEXT,
    ativo INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS servicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    valor_padrao REAL,
    duracao_minutos INTEGER,
    ativo INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS atendimentos (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS financeiro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    atendimento_id INTEGER REFERENCES atendimentos(id),
    valor_recebido REAL,
    forma_pagamento TEXT,
    num_parcelas INTEGER DEFAULT 1,
    status_pagamento TEXT DEFAULT 'pendente',
    data_pagamento TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS repasses (
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
  )`);

  salvarBanco();
  return db;
}

function salvarBanco() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function normalizar(params) {
  if (params === undefined || params === null) return [];
  return Array.isArray(params) ? params : [params];
}

function run(sql, params = []) {
  db.run(sql, normalizar(params));
  const result = db.exec('SELECT last_insert_rowid()');
  const lastInsertRowid = result[0].values[0][0];
  salvarBanco();
  return { lastInsertRowid };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(normalizar(params));
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(normalizar(params));
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { inicializarBanco, run, get, all, salvarBanco };
