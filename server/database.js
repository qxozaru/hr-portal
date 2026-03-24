const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database.db');

let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');

  const tables = `
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, fullname TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'employee', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, head TEXT, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, department_id INTEGER, salary_min INTEGER DEFAULT 0, salary_max INTEGER DEFAULT 0, level TEXT DEFAULT 'Middle', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, department_id INTEGER, position_id INTEGER, salary INTEGER DEFAULT 0, hire_date TEXT, status TEXT DEFAULT 'Активен', phone TEXT, email TEXT, photo TEXT, bio TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, department_id INTEGER, status TEXT DEFAULT 'Планирование', start_date TEXT, end_date TEXT, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS project_members (project_id INTEGER, employee_id INTEGER, PRIMARY KEY (project_id, employee_id));
    CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, employee_id INTEGER, type TEXT DEFAULT 'Договор', doc_date TEXT, status TEXT DEFAULT 'Действует', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  `;
  db.exec(tables);
  persist();
  return db;
}

function persist() {
  if (db) fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
  const r = db.exec("SELECT last_insert_rowid() as id");
  return { lastId: r[0]?.values[0]?.[0] || 0, changes: db.getRowsModified() };
}

function exec(sql) {
  db.exec(sql);
  persist();
}

module.exports = { initDb, all, get, run, exec };
