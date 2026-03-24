import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { can, user } = useAuth();
  const [users, setUsers] = useState([]);

  const load = async () => { const r = await api.get('/users'); setUsers(r.data); };
  useEffect(() => { if (can('roles')) load(); }, []);

  const changeRole = async (id, role) => {
    await api.put(`/users/${id}/role`, { role });
    load();
  };

  const roleColors = { admin: 'var(--red)', manager: 'var(--amber)', employee: 'var(--green)' };
  const roleLabels = { admin: 'Администратор', manager: 'Менеджер', employee: 'Сотрудник' };

  if (!can('roles')) return <div className="page-header"><h2>Доступ запрещён</h2></div>;

  return (
    <div>
      <div className="page-header">
        <div><h2>Управление ролями</h2><span className="page-meta">{users.length} пользователей</span></div>
      </div>

      <div className="admin-panel">
        <h3>Пользователи системы</h3>
        {users.map(u => (
          <div key={u.id} className="admin-row">
            <div className="admin-row-info">
              <span className="role-dot" style={{ background: roleColors[u.role] }} />
              <span className="admin-name">{u.fullname}</span>
              <span className="admin-login">@{u.username}</span>
            </div>
            <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
              disabled={u.username === 'admin'}>
              <option value="admin">Администратор</option>
              <option value="manager">Менеджер</option>
              <option value="employee">Сотрудник</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
