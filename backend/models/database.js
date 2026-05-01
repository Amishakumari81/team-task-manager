const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DB_DIR, 'taskmanager.db');

let db;
let SQL;

async function loadSql() {
  if (SQL) return SQL;
  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();
  return SQL;
}

function getDb() {
  if (!db) throw new Error('Database not initialized.');
  return db;
}

function dbGet(sql, params = []) {
  const database = getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function dbAll(sql, params = []) {
  const database = getDb();
  const stmt = database.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function dbRun(sql, params = []) {
  const database = getDb();
  database.run(sql, params);
}

function dbInsert(sql, params = []) {
  const database = getDb();
  database.run(sql, params);
  const result = dbGet('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: result ? result.id : null };
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch(e) {}
}

async function initialize() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const sqlJs = await loadSql();
  if (fs.existsSync(DB_PATH)) {
    db = new sqlJs.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new sqlJs.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at DATETIME DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    owner_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATETIME DEFAULT (datetime('now')),
    UNIQUE(project_id, user_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    project_id INTEGER NOT NULL,
    assignee_id INTEGER,
    creator_id INTEGER NOT NULL,
    due_date DATE,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  )`);

  saveDb();
  setInterval(saveDb, 5000);
  console.log('✅ Database initialized successfully');
}

module.exports = { getDb, initialize, dbGet, dbAll, dbRun, dbInsert, saveDb };
