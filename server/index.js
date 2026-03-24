const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initDb, all, get, run, exec } = require('./database');
const { authMiddleware, requireRole, SECRET } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (r, f, cb) => cb(null, uploadsDir),
  filename: (r, f, cb) => cb(null, Date.now() + '-' + f.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Заполните все поля' });
  const user = get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  const token = jwt.sign({ id: user.id, username: user.username, fullname: user.fullname, role: user.role }, SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username, fullname: user.fullname, role: user.role } });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, fullname } = req.body;
  if (!username || !password || !fullname) return res.status(400).json({ error: 'Заполните все поля' });
  if (password.length < 3) return res.status(400).json({ error: 'Пароль минимум 3 символа' });
  if (get('SELECT id FROM users WHERE username = ?', [username])) return res.status(400).json({ error: 'Логин занят' });
  const r = run('INSERT INTO users (username,password,fullname,role) VALUES (?,?,?,?)', [username, bcrypt.hashSync(password, 10), fullname, 'employee']);
  res.json({ message: 'Регистрация выполнена', userId: r.lastId });
});

app.get('/api/auth/me', authMiddleware, (req, res) => res.json(req.user));

// USERS
app.get('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  res.json(all('SELECT id,username,fullname,role,created_at FROM users'));
});
app.put('/api/users/:id/role', authMiddleware, requireRole('admin'), (req, res) => {
  const { role } = req.body;
  if (!['admin','manager','employee'].includes(role)) return res.status(400).json({ error: 'Недопустимая роль' });
  run('UPDATE users SET role=? WHERE id=?', [role, +req.params.id]);
  res.json({ message: 'ok' });
});

// DEPARTMENTS
app.get('/api/departments', authMiddleware, (req, res) => {
  res.json(all(`SELECT d.*, (SELECT COUNT(*) FROM employees WHERE department_id=d.id) as employee_count, (SELECT COALESCE(SUM(salary),0) FROM employees WHERE department_id=d.id) as total_salary FROM departments d ORDER BY d.name`));
});
app.get('/api/departments/:id', authMiddleware, (req, res) => {
  const d = get('SELECT * FROM departments WHERE id=?', [+req.params.id]);
  if (!d) return res.status(404).json({ error: 'Не найден' });
  d.employees = all('SELECT e.*, p.title as position_title FROM employees e LEFT JOIN positions p ON e.position_id=p.id WHERE e.department_id=?', [+req.params.id]);
  d.positions = all('SELECT * FROM positions WHERE department_id=?', [+req.params.id]);
  res.json(d);
});
app.post('/api/departments', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, head, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название' });
  const r = run('INSERT INTO departments (name,head,description) VALUES (?,?,?)', [name, head||'', description||'']);
  res.json({ id: r.lastId });
});
app.put('/api/departments/:id', authMiddleware, requireRole('admin','manager'), (req, res) => {
  const { name, head, description } = req.body;
  run('UPDATE departments SET name=?,head=?,description=? WHERE id=?', [name, head, description, +req.params.id]);
  res.json({ message: 'ok' });
});
app.delete('/api/departments/:id', authMiddleware, requireRole('admin'), (req, res) => {
  run('DELETE FROM departments WHERE id=?', [+req.params.id]); res.json({ message: 'ok' });
});

// POSITIONS
app.get('/api/positions', authMiddleware, (req, res) => {
  res.json(all(`SELECT p.*, d.name as department_name, (SELECT COUNT(*) FROM employees WHERE position_id=p.id) as employee_count FROM positions p LEFT JOIN departments d ON p.department_id=d.id ORDER BY p.title`));
});
app.post('/api/positions', authMiddleware, requireRole('admin'), (req, res) => {
  const { title, department_id, salary_min, salary_max, level } = req.body;
  if (!title) return res.status(400).json({ error: 'Укажите название' });
  const r = run('INSERT INTO positions (title,department_id,salary_min,salary_max,level) VALUES (?,?,?,?,?)', [title, department_id, salary_min||0, salary_max||0, level||'Middle']);
  res.json({ id: r.lastId });
});
app.put('/api/positions/:id', authMiddleware, requireRole('admin','manager'), (req, res) => {
  const { title, department_id, salary_min, salary_max, level } = req.body;
  run('UPDATE positions SET title=?,department_id=?,salary_min=?,salary_max=?,level=? WHERE id=?', [title, department_id, salary_min, salary_max, level, +req.params.id]);
  res.json({ message: 'ok' });
});
app.delete('/api/positions/:id', authMiddleware, requireRole('admin'), (req, res) => {
  run('DELETE FROM positions WHERE id=?', [+req.params.id]); res.json({ message: 'ok' });
});

// EMPLOYEES
app.get('/api/employees', authMiddleware, (req, res) => {
  res.json(all(`SELECT e.*, d.name as department_name, p.title as position_title, p.level as position_level FROM employees e LEFT JOIN departments d ON e.department_id=d.id LEFT JOIN positions p ON e.position_id=p.id ORDER BY e.name`));
});
app.get('/api/employees/:id', authMiddleware, (req, res) => {
  const emp = get(`SELECT e.*, d.name as department_name, p.title as position_title FROM employees e LEFT JOIN departments d ON e.department_id=d.id LEFT JOIN positions p ON e.position_id=p.id WHERE e.id=?`, [+req.params.id]);
  if (!emp) return res.status(404).json({ error: 'Не найден' });
  emp.projects = all('SELECT pr.* FROM projects pr JOIN project_members pm ON pr.id=pm.project_id WHERE pm.employee_id=?', [+req.params.id]);
  emp.documents = all('SELECT * FROM documents WHERE employee_id=?', [+req.params.id]);
  res.json(emp);
});
app.post('/api/employees', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, department_id, position_id, salary, hire_date, status, phone, email, photo, bio } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите ФИО' });
  const r = run('INSERT INTO employees (name,department_id,position_id,salary,hire_date,status,phone,email,photo,bio) VALUES (?,?,?,?,?,?,?,?,?,?)', [name, department_id, position_id, salary||0, hire_date||new Date().toISOString().split('T')[0], status||'Активен', phone||'', email||'', photo||'', bio||'']);
  res.json({ id: r.lastId });
});
app.put('/api/employees/:id', authMiddleware, requireRole('admin','manager'), (req, res) => {
  const { name, department_id, position_id, salary, hire_date, status, phone, email, photo, bio } = req.body;
  run('UPDATE employees SET name=?,department_id=?,position_id=?,salary=?,hire_date=?,status=?,phone=?,email=?,photo=?,bio=? WHERE id=?', [name, department_id, position_id, salary, hire_date, status, phone, email, photo, bio, +req.params.id]);
  res.json({ message: 'ok' });
});
app.delete('/api/employees/:id', authMiddleware, requireRole('admin'), (req, res) => {
  run('DELETE FROM project_members WHERE employee_id=?', [+req.params.id]);
  run('DELETE FROM documents WHERE employee_id=?', [+req.params.id]);
  run('DELETE FROM employees WHERE id=?', [+req.params.id]);
  res.json({ message: 'ok' });
});
app.post('/api/employees/:id/photo', authMiddleware, requireRole('admin','manager'), upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  const photoUrl = `/uploads/${req.file.filename}`;
  run('UPDATE employees SET photo=? WHERE id=?', [photoUrl, +req.params.id]);
  res.json({ photo: photoUrl });
});

// PROJECTS
app.get('/api/projects', authMiddleware, (req, res) => {
  res.json(all(`SELECT pr.*, d.name as department_name, (SELECT COUNT(*) FROM project_members WHERE project_id=pr.id) as member_count FROM projects pr LEFT JOIN departments d ON pr.department_id=d.id ORDER BY pr.name`));
});
app.get('/api/projects/:id', authMiddleware, (req, res) => {
  const p = get('SELECT pr.*, d.name as department_name FROM projects pr LEFT JOIN departments d ON pr.department_id=d.id WHERE pr.id=?', [+req.params.id]);
  if (!p) return res.status(404).json({ error: 'Не найден' });
  p.members = all('SELECT e.id,e.name,e.status,e.photo,pos.title as position_title FROM employees e JOIN project_members pm ON e.id=pm.employee_id LEFT JOIN positions pos ON e.position_id=pos.id WHERE pm.project_id=?', [+req.params.id]);
  res.json(p);
});
app.post('/api/projects', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, department_id, status, start_date, end_date, description, member_ids } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название' });
  const r = run('INSERT INTO projects (name,department_id,status,start_date,end_date,description) VALUES (?,?,?,?,?,?)', [name, department_id, status||'Планирование', start_date||'', end_date||'', description||'']);
  if (member_ids?.length) member_ids.forEach(eid => run('INSERT INTO project_members (project_id,employee_id) VALUES (?,?)', [r.lastId, eid]));
  res.json({ id: r.lastId });
});
app.put('/api/projects/:id', authMiddleware, requireRole('admin','manager'), (req, res) => {
  const { name, department_id, status, start_date, end_date, description, member_ids } = req.body;
  run('UPDATE projects SET name=?,department_id=?,status=?,start_date=?,end_date=?,description=? WHERE id=?', [name, department_id, status, start_date, end_date, description, +req.params.id]);
  if (member_ids) {
    run('DELETE FROM project_members WHERE project_id=?', [+req.params.id]);
    member_ids.forEach(eid => run('INSERT INTO project_members (project_id,employee_id) VALUES (?,?)', [+req.params.id, eid]));
  }
  res.json({ message: 'ok' });
});
app.delete('/api/projects/:id', authMiddleware, requireRole('admin'), (req, res) => {
  run('DELETE FROM project_members WHERE project_id=?', [+req.params.id]);
  run('DELETE FROM projects WHERE id=?', [+req.params.id]);
  res.json({ message: 'ok' });
});

// DOCUMENTS
app.get('/api/documents', authMiddleware, (req, res) => {
  res.json(all('SELECT doc.*, e.name as employee_name FROM documents doc LEFT JOIN employees e ON doc.employee_id=e.id ORDER BY doc.doc_date DESC'));
});
app.post('/api/documents', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, employee_id, type, doc_date, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Укажите название' });
  const r = run('INSERT INTO documents (name,employee_id,type,doc_date,status) VALUES (?,?,?,?,?)', [name, employee_id, type||'Договор', doc_date||new Date().toISOString().split('T')[0], status||'Действует']);
  res.json({ id: r.lastId });
});
app.put('/api/documents/:id', authMiddleware, requireRole('admin','manager'), (req, res) => {
  const { name, employee_id, type, doc_date, status } = req.body;
  run('UPDATE documents SET name=?,employee_id=?,type=?,doc_date=?,status=? WHERE id=?', [name, employee_id, type, doc_date, status, +req.params.id]);
  res.json({ message: 'ok' });
});
app.delete('/api/documents/:id', authMiddleware, requireRole('admin'), (req, res) => {
  run('DELETE FROM documents WHERE id=?', [+req.params.id]); res.json({ message: 'ok' });
});

// STATS
app.get('/api/stats', authMiddleware, (req, res) => {
  res.json({
    empCount: get('SELECT COUNT(*) as c FROM employees').c,
    totalSalary: get('SELECT COALESCE(SUM(salary),0) as s FROM employees').s,
    activeCount: get("SELECT COUNT(*) as c FROM employees WHERE status='Активен'").c,
    deptCount: get('SELECT COUNT(*) as c FROM departments').c,
    projCount: get('SELECT COUNT(*) as c FROM projects').c,
    docCount: get('SELECT COUNT(*) as c FROM documents').c
  });
});

// SPA fallback
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html')));
}

// Start
initDb().then(() => {
  app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
}).catch(console.error);
