import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', password2: '', fullname: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) return setError('Пароли не совпадают');
    try {
      await register(form.username, form.password, form.fullname);
      setSuccess('Регистрация выполнена. Войдите в систему.');
      setIsLogin(true);
      setForm({ username: '', password: '', password2: '', fullname: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {isLogin ? (
          <form onSubmit={handleLogin}>
            <h2>HR Portal</h2>
            <p className="auth-sub">Система управления персоналом</p>
            {error && <div className="msg-error">{error}</div>}
            {success && <div className="msg-success">{success}</div>}
            <div className="form-group">
              <label>Логин</label>
              <input value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="Введите логин" autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Введите пароль" />
            </div>
            <button type="submit" className="btn-auth">Войти</button>
            <div className="auth-switch">
              Нет аккаунта?{' '}
              <a onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>Зарегистрироваться</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2>Регистрация</h2>
            <p className="auth-sub">Создайте аккаунт для работы</p>
            {error && <div className="msg-error">{error}</div>}
            <div className="form-group">
              <label>ФИО</label>
              <input value={form.fullname} onChange={e => set('fullname', e.target.value)}
                placeholder="Иванов Иван Иванович" />
            </div>
            <div className="form-group">
              <label>Логин</label>
              <input value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="Придумайте логин" autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Придумайте пароль" />
            </div>
            <div className="form-group">
              <label>Подтвердите пароль</label>
              <input type="password" value={form.password2} onChange={e => set('password2', e.target.value)}
                placeholder="Повторите пароль" />
            </div>
            <button type="submit" className="btn-auth">Зарегистрироваться</button>
            <div className="auth-switch">
              Уже есть аккаунт?{' '}
              <a onClick={() => { setIsLogin(true); setError(''); }}>Войти</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
