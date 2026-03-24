import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Building2, FolderOpen, Layers, FileText, Settings, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColors = { admin: '#ef4444', manager: '#f59e0b', employee: '#22c55e' };
  const roleLabels = { admin: 'Администратор', manager: 'Менеджер', employee: 'Сотрудник' };

  const navItems = [
    { to: '/', icon: Users, label: 'Сотрудники', end: true },
    { to: '/departments', icon: Building2, label: 'Отделы' },
    { to: '/positions', icon: FolderOpen, label: 'Должности' },
    { to: '/projects', icon: Layers, label: 'Проекты' },
    { to: '/documents', icon: FileText, label: 'Документы' },
  ];

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="logo">HR<span>Portal</span></div>
        <div className="top-right">
          <div className="user-pill">
            <span className="role-dot" style={{ background: roleColors[user.role] }} />
            <span>{user.fullname}</span>
            <span className="role-label">{roleLabels[user.role]}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </header>

      <div className="main-layout">
        <nav className="sidebar">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
          {can('roles') && (
            <>
              <div className="nav-sep" />
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Settings size={18} /> Роли
              </NavLink>
            </>
          )}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
