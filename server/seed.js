const { initDb, run, exec } = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
  await initDb();
  const h = pw => bcrypt.hashSync(pw, 10);

  exec(`DELETE FROM project_members; DELETE FROM documents; DELETE FROM projects; DELETE FROM employees; DELETE FROM positions; DELETE FROM departments; DELETE FROM users;`);

  run('INSERT INTO users (username,password,fullname,role) VALUES (?,?,?,?)', ['admin', h('admin'), 'Администратор Системы', 'admin']);
  run('INSERT INTO users (username,password,fullname,role) VALUES (?,?,?,?)', ['manager', h('manager'), 'Петров Пётр Петрович', 'manager']);
  run('INSERT INTO users (username,password,fullname,role) VALUES (?,?,?,?)', ['user', h('user'), 'Сидоров Сидор Сидорович', 'employee']);

  const depts = [
    [1,'Разработка','Алексей Петров','Отдел разработки ПО'],
    [2,'Дизайн','Мария Иванова','UX/UI дизайн и графика'],
    [3,'Маркетинг','Дмитрий Сидоров','Маркетинг и продвижение'],
    [4,'HR','Ольга Новикова','Управление персоналом'],
    [5,'Финансы','Анна Лебедева','Бухгалтерия и финансы'],
    [6,'Аналитика','Игорь Волков','Бизнес-аналитика']
  ];
  depts.forEach(d => run('INSERT INTO departments (id,name,head,description) VALUES (?,?,?,?)', d));

  const poss = [
    [1,'Senior Developer',1,170000,220000,'Senior'],[2,'UX Designer',2,130000,170000,'Middle'],
    [3,'Marketing Lead',3,140000,180000,'Lead'],[4,'Frontend Developer',1,140000,180000,'Middle'],
    [5,'Data Analyst',6,120000,160000,'Middle'],[6,'HR Manager',4,120000,150000,'Senior'],
    [7,'Backend Developer',1,160000,200000,'Senior'],[8,'Бухгалтер',5,100000,140000,'Middle'],
    [9,'DevOps Engineer',1,170000,220000,'Senior'],[10,'Graphic Designer',2,110000,150000,'Junior']
  ];
  poss.forEach(p => run('INSERT INTO positions (id,title,department_id,salary_min,salary_max,level) VALUES (?,?,?,?,?,?)', p));

  const emps = [
    [1,'Алексей Петров',1,1,185000,'2021-03-15','Активен','+7 913 111-22-33','petrov@company.ru','','Опытный разработчик, 10+ лет'],
    [2,'Мария Иванова',2,2,145000,'2022-01-10','Активен','+7 913 222-33-44','ivanova@company.ru','','Специалист по UX'],
    [3,'Дмитрий Сидоров',3,3,160000,'2020-07-22','Активен','+7 913 333-44-55','sidorov@company.ru','','Руководитель маркетинга'],
    [4,'Елена Козлова',1,4,155000,'2023-05-01','Активен','+7 913 444-55-66','kozlova@company.ru','','Frontend, React/Vue'],
    [5,'Игорь Волков',6,5,140000,'2022-09-18','В отпуске','+7 913 555-66-77','volkov@company.ru','','Аналитик данных'],
    [6,'Ольга Новикова',4,6,135000,'2019-11-03','Активен','+7 913 666-77-88','novikova@company.ru','','HR-менеджер, 8 лет опыта'],
    [7,'Сергей Морозов',1,7,175000,'2021-08-12','Активен','+7 913 777-88-99','morozov@company.ru','','Backend, Node.js/Go'],
    [8,'Анна Лебедева',5,8,120000,'2020-02-28','Активен','+7 913 888-99-00','lebedeva@company.ru','','Главный бухгалтер'],
    [9,'Павел Кузнецов',1,9,190000,'2022-04-15','Удалённо','+7 913 999-00-11','kuznetsov@company.ru','','DevOps, Docker/K8s'],
    [10,'Наталья Соколова',2,10,130000,'2023-01-20','Активен','+7 913 000-11-22','sokolova@company.ru','','Графический дизайнер']
  ];
  emps.forEach(e => run('INSERT INTO employees (id,name,department_id,position_id,salary,hire_date,status,phone,email,photo,bio) VALUES (?,?,?,?,?,?,?,?,?,?,?)', e));

  const projs = [
    [1,'HR Portal v2',1,'В работе','2025-02-01','2025-06-30','Редизайн портала'],
    [2,'Ребрендинг 2025',3,'В работе','2025-01-15','2025-05-15','Обновление стиля'],
    [3,'Data Warehouse',6,'Планирование','2025-04-01','2025-12-31','Хранилище данных'],
    [4,'Автоматизация HR',4,'Завершён','2024-06-01','2024-12-31','Автоматизация найма'],
    [5,'Мобильное приложение',1,'В работе','2025-03-01','2025-09-30','Мобильный портал']
  ];
  projs.forEach(p => run('INSERT INTO projects (id,name,department_id,status,start_date,end_date,description) VALUES (?,?,?,?,?,?,?)', p));

  [[1,1],[1,4],[1,7],[2,2],[2,3],[2,10],[3,5],[3,9],[4,6],[4,4],[5,1],[5,7],[5,9]].forEach(([p,e]) =>
    run('INSERT INTO project_members (project_id,employee_id) VALUES (?,?)', [p,e]));

  const docs = [
    ['Трудовой договор',1,'Договор','2021-03-15','Действует'],['NDA',1,'Соглашение','2021-03-15','Действует'],
    ['Трудовой договор',2,'Договор','2022-01-10','Действует'],['Заявление на отпуск',5,'Заявление','2025-09-01','Одобрено'],
    ['Трудовой договор',3,'Договор','2020-07-22','Действует'],['Допсоглашение',7,'Допсоглашение','2025-01-01','Действует'],
    ['Трудовой договор',9,'Договор','2022-04-15','Действует'],['Заявление на удалёнку',9,'Заявление','2025-03-01','Одобрено'],
    ['Трудовой договор',6,'Договор','2019-11-03','Действует'],['Сертификат обучения',4,'Сертификат','2024-12-15','Действует']
  ];
  docs.forEach(d => run('INSERT INTO documents (name,employee_id,type,doc_date,status) VALUES (?,?,?,?,?)', d));

  console.log('Database seeded!');
  console.log('Accounts: admin/admin, manager/manager, user/user');
}

seed().catch(console.error);
