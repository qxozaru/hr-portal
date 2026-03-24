# HR Portal — Система управления персоналом

Полноценное веб-приложение на **React + Express + SQLite** с авторизацией, ролями и 5 связанными таблицами БД.

## Структура БД (5 таблиц)

```
departments ──┐
              ├── employees ──── documents
positions ────┘       │
                      └── project_members ──── projects
```

- **departments** — отделы
- **positions** — должности (→ department_id)
- **employees** — сотрудники (→ department_id, position_id)
- **projects** — проекты (→ department_id) + связь many-to-many через project_members
- **documents** — документы (→ employee_id)

## Роли

| Роль | Просмотр | Поиск | Экспорт | Редактирование | Добавление | Удаление | Управление ролями |
|------|----------|-------|---------|----------------|------------|----------|-------------------|
| Администратор | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Менеджер | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Сотрудник | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Тестовые аккаунты

- `admin` / `admin` — Администратор
- `manager` / `manager` — Менеджер
- `user` / `user` — Сотрудник

## Запуск

```bash
# 1. Установить зависимости
npm install
cd client && npm install && cd ..

# 2. Заполнить БД тестовыми данными
npm run seed

# 3. Запустить сервер и клиент
npm run dev
```

Сервер: http://localhost:3001  
Клиент: http://localhost:5173

## Технологии

- **Frontend**: React 18, React Router, Axios, Lucide Icons, SheetJS (xlsx)
- **Backend**: Express, better-sqlite3, JWT, bcryptjs, multer
- **БД**: SQLite (файл database.db)

## Сборка для продакшена

```bash
npm run build
npm start
```

## Возможности

- Авторизация / Регистрация с JWT
- 3 роли с разными уровнями доступа
- CRUD для всех 5 таблиц
- Загрузка фото сотрудников
- 2 режима отображения: таблица и карточки
- Детальная карточка сотрудника (боковая панель)
- Связи между таблицами (проекты, документы сотрудника)
- Поиск и экспорт в XLSX
- Панель статистики
