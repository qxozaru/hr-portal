import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Modal, DetailPanel, Field, FormField, Avatar } from '../components/UI';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  const { can } = useAuth();
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const [p, d, e] = await Promise.all([api.get('/projects'), api.get('/departments'), api.get('/employees')]);
    setProjects(p.data); setDepartments(d.data); setEmployees(e.data);
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openDetail = async (id) => { const r = await api.get(`/projects/${id}`); setDetail(r.data); };

  const save = async () => {
    try {
      if (modal === 'add') await api.post('/projects', form);
      else await api.put(`/projects/${form.id}`, form);
      setModal(null); setDetail(null); load();
    } catch (err) { alert(err.response?.data?.error || 'Ошибка'); }
  };

  const del = async (id) => {
    if (!confirm('Удалить проект?')) return;
    await api.delete(`/projects/${id}`); setDetail(null); load();
  };

  const openAdd = () => {
    setForm({ name: '', department_id: departments[0]?.id, status: 'Планирование', start_date: '', end_date: '', description: '', member_ids: [] });
    setModal('add');
  };

  const openEdit = () => {
    setForm({ ...detail, member_ids: detail.members?.map(m => m.id) || [] });
    setModal('edit');
  };

  const toggleMember = (eid) => {
    setForm(prev => {
      const ids = prev.member_ids || [];
      return { ...prev, member_ids: ids.includes(eid) ? ids.filter(x => x !== eid) : [...ids, eid] };
    });
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Проекты</h2><span className="page-meta">{projects.length} проектов</span></div>
        <div className="page-actions">
          {can('add') && <button className="btn btn-blue" onClick={openAdd}><Plus size={16} /> Добавить</button>}
        </div>
      </div>

      <div className="cards-grid">
        {projects.map(pr => (
          <div key={pr.id} className="emp-card" onClick={() => openDetail(pr.id)}>
            <div className="emp-card-top">
              <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--purple-bg)', color: 'var(--purple)' }}>{pr.name[0]}</div>
              <div><h4>{pr.name}</h4><p>{pr.department_name || '—'}</p></div>
            </div>
            <div className="emp-card-rows">
              <div className="card-row"><span>Статус</span><StatusBadge status={pr.status} /></div>
              <div className="card-row"><span>Сроки</span><span>{pr.start_date} — {pr.end_date}</span></div>
              <div className="card-row"><span>Участников</span><span>{pr.member_count}</span></div>
            </div>
          </div>
        ))}
      </div>

      <DetailPanel open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ''}
        actions={<>
          {can('edit') && <button className="btn btn-blue" onClick={openEdit}>Редактировать</button>}
          {can('del') && <button className="btn btn-danger" onClick={() => del(detail.id)}>Удалить</button>}
          <button className="btn btn-outline" onClick={() => setDetail(null)}>Закрыть</button>
        </>}>
        {detail && (
          <>
            <div className="dp-section">
              <h4>Информация</h4>
              <div className="dp-grid">
                <Field label="Отдел" value={detail.department_name} />
                <Field label="Статус" value={<StatusBadge status={detail.status} />} />
                <Field label="Начало" value={detail.start_date} />
                <Field label="Окончание" value={detail.end_date} />
                <Field label="Описание" value={detail.description} full />
              </div>
            </div>
            {detail.members?.length > 0 && (
              <div className="dp-section">
                <h4>Участники ({detail.members.length})</h4>
                <div className="dp-list">
                  {detail.members.map(m => (
                    <div key={m.id} className="dp-list-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={m.name} photo={m.photo} size={28} />
                        <div><div className="item-name">{m.name}</div><div className="item-desc">{m.position_title}</div></div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DetailPanel>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Добавить проект' : 'Редактировать проект'}>
        <FormField label="Название"><input value={form.name || ''} onChange={e => set('name', e.target.value)} /></FormField>
        <FormField label="Отдел">
          <select value={form.department_id || ''} onChange={e => set('department_id', +e.target.value)}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        <FormField label="Описание"><textarea value={form.description || ''} onChange={e => set('description', e.target.value)} /></FormField>
        <div className="form-row">
          <FormField label="Начало"><input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></FormField>
          <FormField label="Окончание"><input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} /></FormField>
        </div>
        <FormField label="Статус">
          <select value={form.status || 'Планирование'} onChange={e => set('status', e.target.value)}>
            {['Планирование', 'В работе', 'Завершён'].map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Участники">
          <div className="member-select">
            {employees.map(e => (
              <label key={e.id} className={`member-chip ${(form.member_ids || []).includes(e.id) ? 'selected' : ''}`}>
                <input type="checkbox" checked={(form.member_ids || []).includes(e.id)} onChange={() => toggleMember(e.id)} />
                {e.name}
              </label>
            ))}
          </div>
        </FormField>
        <div className="modal-actions">
          <button className="btn btn-green" onClick={save}>{modal === 'add' ? 'Добавить' : 'Сохранить'}</button>
          <button className="btn btn-outline" onClick={() => setModal(null)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
