const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
    cpf TEXT,
    endereco TEXT,
    profissao TEXT,
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
    ativo INTEGER DEFAULT 1,
    tipo_repasse TEXT DEFAULT 'percentual_por_procedimento',
    valor_diaria REAL,
    regras_especiais TEXT
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
    forma_pagamento_2 TEXT,
    valor_pagamento_2 REAL,
    num_parcelas_2 INTEGER DEFAULT 1,
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

  db.run(`CREATE TABLE IF NOT EXISTS horarios_funcionamento (
    dia_semana INTEGER PRIMARY KEY,
    hora_inicio TEXT DEFAULT '09:00',
    hora_fim TEXT DEFAULT '18:00',
    ativo INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil TEXT DEFAULT 'secretaria',
    ativo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  migrar();
  seedServicos();
  seedHorarios();
  await seedAdmin();
  salvarBanco();
  return db;
}

function seedServicos() {
  const existem = db.exec('SELECT COUNT(*) FROM servicos');
  if (existem[0].values[0][0] > 0) return;

  const servicos = [
    ['Limpeza',             250,    60],
    ['Restauração',         250,    60],
    ['Extração',            300,    60],
    ['Extração siso',       550,    60],
    ['Implante cirúrgico',  1800,   60],
    ['Implante protetivo',  2000,   60],
    ['Ortodontia (Orto)',   150,    15],
    ['Periodontia (Perio)', 0,      40],
    ['Endodontia (Endo)',   0,      90],
    ['Primeira vez',        0,      30],
  ];
  for (const [nome, valor, duracao] of servicos) {
    db.run('INSERT INTO servicos (nome, valor_padrao, duracao_minutos, ativo) VALUES (?, ?, ?, 1)', [nome, valor, duracao]);
  }
}

function seedHorarios() {
  const existem = db.exec('SELECT COUNT(*) FROM horarios_funcionamento');
  if (existem[0].values[0][0] > 0) return;

  // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  for (let dia = 0; dia <= 6; dia++) {
    const ativo = dia >= 1 && dia <= 6 ? 1 : 0; // Seg-Sab ativos
    db.run(
      'INSERT INTO horarios_funcionamento (dia_semana, hora_inicio, hora_fim, ativo) VALUES (?, ?, ?, ?)',
      [dia, '09:00', '18:00', ativo]
    );
  }
}

async function seedAdmin() {
  const existe = db.exec("SELECT COUNT(*) FROM usuarios WHERE email = 'admin@mentasaude.com'");
  if (existe[0].values[0][0] > 0) return;
  const senha_hash = await bcrypt.hash('menta2026', 10);
  db.run(
    "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)",
    ['Administrador', 'admin@mentasaude.com', senha_hash, 'admin']
  );
}

function migrar() {
  const migrações = [
    ['pacientes', 'cpf', 'TEXT'],
    ['pacientes', 'endereco', 'TEXT'],
    ['pacientes', 'profissao', 'TEXT'],
    ['financeiro', 'forma_pagamento_2', 'TEXT'],
    ['financeiro', 'valor_pagamento_2', 'REAL'],
    ['financeiro', 'num_parcelas_2', 'INTEGER DEFAULT 1'],
    ['profissionais', 'tipo_repasse', "TEXT DEFAULT 'percentual_por_procedimento'"],
    ['profissionais', 'valor_diaria', 'REAL'],
    ['profissionais', 'regras_especiais', 'TEXT'],
  ];
  for (const [tabela, coluna, definicao] of migrações) {
    try {
      const colunas = db.exec(`PRAGMA table_info(${tabela})`);
      if (colunas.length > 0) {
        const nomes = colunas[0].values.map((r) => r[1]);
        if (!nomes.includes(coluna)) {
          db.run(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
        }
      }
    } catch (_) {}
  }
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
