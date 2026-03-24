import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Modal, FormField } from '../components/UI';
import { Plus, Search } from 'lucide-react';

export default function DocumentsPage() {
  const { can } = useAuth();
  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    const [d, e] = await Promise.all([api.get('/documents'), api.get('/employees')]);
    setDocs(d.data); setEmployees(e.data);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = docs.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [d.name, d.type, d.employee_name, d.status].some(v => v?.toLowerCase().includes(q));
  });

  const save = async () => {
    try {
      await api.post('/documents', form);
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Ошибка'); }
  };

  const del = async (id) => {
    if (!confirm('Удалить документ?')) return;
    await api.delete(`/documents/${id}`); load();
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Документы</h2><span className="page-meta">{filtered.length} документов</span></div>
        <div className="page-actions">
          {can('add') && <button className="btn btn-blue" onClick={() => { setForm({ name: '', employee_id: employees[0]?.id, type: 'Договор', doc_date: '', status: 'Действует' }); setModal(true); }}><Plus size={16} /> Добавить</button>}
        </div>
      </div>

      {can('search') && (
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Поиск документов..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      <div className="table-card">
        <table>
          <thead><tr><th>Документ</th><th>Тип</th><th>Сотрудник</th><th>Дата</th><th>Статус</th>{can('del') && <th></th>}</tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} style={{ cursor: 'default' }}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td>{d.type}</td>
                <td>{d.employee_name || '—'}</td>
                <td className="col-date">{d.doc_date}</td>
                <td><StatusBadge status={d.status} /></td>
                {can('del') && <td><button className="btn btn-danger-sm" onClick={() => del(d.id)}>Удалить</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Добавить документ">
        <FormField label="Название"><input value={form.name || ''} onChange={e => set('name', e.target.value)} /></FormField>
        <FormField label="Тип">
          <select value={form.type || 'Договор'} onChange={e => set('type', e.target.value)}>
            {['Договор', 'Соглашение', 'Заявление', 'Допсоглашение', 'Сертификат'].map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Сотрудник">
          <select value={form.employee_id || ''} onChange={e => set('employee_id', +e.target.value)}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </FormField>
        <FormField label="Дата"><input type="date" value={form.doc_date || ''} onChange={e => set('doc_date', e.target.value)} /></FormField>
        <FormField label="Статус">
          <select value={form.status || 'Действует'} onChange={e => set('status', e.target.value)}>
            {['Действует', 'Одобрено', 'Просрочен'].map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <div className="modal-actions">
          <button className="btn btn-green" onClick={save}>Добавить</button>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
