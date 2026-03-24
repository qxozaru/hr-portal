import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Modal, FormField } from '../components/UI';
import { Plus } from 'lucide-react';

export default function PositionsPage() {
  const { can } = useAuth();
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    const [p, d] = await Promise.all([api.get('/positions'), api.get('/departments')]);
    setPositions(p.data); setDepartments(d.data);
  };
  useEffect(() => { load(); }, []);

  const fmt = n => Number(n).toLocaleString('ru-RU');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    await api.post('/positions', form);
    setModal(false); load();
  };

  const del = async (id) => {
    if (!confirm('Удалить должность?')) return;
    await api.delete(`/positions/${id}`); load();
  };

  const lvlClass = l => l === 'Senior' ? 'st-purple' : l === 'Lead' ? 'st-amber' : l === 'Junior' ? 'st-blue' : 'st-green';

  return (
    <div>
      <div className="page-header">
        <div><h2>Должности</h2><span className="page-meta">{positions.length} должностей</span></div>
        <div className="page-actions">
          {can('add') && <button className="btn btn-blue" onClick={() => { setForm({ title: '', department_id: departments[0]?.id, salary_min: '', salary_max: '', level: 'Middle' }); setModal(true); }}><Plus size={16} /> Добавить</button>}
        </div>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Должность</th><th>Отдел</th><th>Уровень</th><th>Вилка зарплат</th><th>Сотрудников</th>{can('del') && <th></th>}</tr></thead>
          <tbody>
            {positions.map(p => (
              <tr key={p.id} style={{ cursor: 'default' }}>
                <td style={{ fontWeight: 600 }}>{p.title}</td>
                <td>{p.department_name || '—'}</td>
                <td><span className={`status-badge ${lvlClass(p.level)}`}>{p.level}</span></td>
                <td>{fmt(p.salary_min)} – {fmt(p.salary_max)} ₽</td>
                <td>{p.employee_count}</td>
                {can('del') && <td><button className="btn btn-danger-sm" onClick={() => del(p.id)}>Удалить</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Добавить должность">
        <FormField label="Название"><input value={form.title || ''} onChange={e => set('title', e.target.value)} /></FormField>
        <FormField label="Отдел">
          <select value={form.department_id || ''} onChange={e => set('department_id', +e.target.value)}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        <FormField label="Уровень">
          <select value={form.level || 'Middle'} onChange={e => set('level', e.target.value)}>
            {['Junior', 'Middle', 'Senior', 'Lead'].map(l => <option key={l}>{l}</option>)}
          </select>
        </FormField>
        <div className="form-row">
          <FormField label="Мин. зарплата"><input type="number" value={form.salary_min || ''} onChange={e => set('salary_min', +e.target.value)} /></FormField>
          <FormField label="Макс. зарплата"><input type="number" value={form.salary_max || ''} onChange={e => set('salary_max', +e.target.value)} /></FormField>
        </div>
        <div className="modal-actions">
          <button className="btn btn-green" onClick={save}>Добавить</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
