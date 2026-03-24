import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Modal, DetailPanel, Field, FormField, Avatar } from '../components/UI';
import { Plus } from 'lucide-react';

export default function DepartmentsPage() {
  const { can } = useAuth();
  const [depts, setDepts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => { const r = await api.get('/departments'); setDepts(r.data); };
  useEffect(() => { load(); }, []);

  const fmt = n => Number(n).toLocaleString('ru-RU');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openDetail = async (id) => { const r = await api.get(`/departments/${id}`); setDetail(r.data); };

  const save = async () => {
    if (modal === 'add') await api.post('/departments', form);
    else await api.put(`/departments/${form.id}`, form);
    setModal(null); setDetail(null); load();
  };

  const del = async (id) => {
    if (!confirm('Удалить отдел?')) return;
    await api.delete(`/departments/${id}`); setDetail(null); load();
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Отделы</h2><span className="page-meta">{depts.length} отделов</span></div>
        <div className="page-actions">
          {can('add') && <button className="btn btn-blue" onClick={() => { setForm({ name: '', head: '', description: '' }); setModal('add'); }}><Plus size={16} /> Добавить</button>}
        </div>
      </div>

      <div className="cards-grid">
        {depts.map(d => (
          <div key={d.id} className="emp-card" onClick={() => openDetail(d.id)}>
            <div className="emp-card-top">
              <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--blue-bg)', color: 'var(--blue)' }}>{d.name[0]}</div>
              <div><h4>{d.name}</h4><p>{d.description}</p></div>
            </div>
            <div className="emp-card-rows">
              <div className="card-row"><span>Руководитель</span><span>{d.head || '—'}</span></div>
              <div className="card-row"><span>Сотрудников</span><span>{d.employee_count}</span></div>
              <div className="card-row"><span>ФОТ</span><span>{fmt(d.total_salary)} ₽</span></div>
            </div>
          </div>
        ))}
      </div>

      <DetailPanel open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ''}
        actions={<>
          {can('edit') && <button className="btn btn-blue" onClick={() => { setForm(detail); setModal('edit'); }}>Редактировать</button>}
          {can('del') && <button className="btn btn-danger" onClick={() => del(detail.id)}>Удалить</button>}
          <button className="btn btn-outline" onClick={() => setDetail(null)}>Закрыть</button>
        </>}>
        {detail && (
          <>
            <div className="dp-section">
              <h4>Информация</h4>
              <div className="dp-grid">
                <Field label="Название" value={detail.name} />
                <Field label="Руководитель" value={detail.head} />
                <Field label="Описание" value={detail.description} full />
              </div>
            </div>
            {detail.employees?.length > 0 && (
              <div className="dp-section">
                <h4>Сотрудники ({detail.employees.length})</h4>
                <div className="dp-list">
                  {detail.employees.map(e => (
                    <div key={e.id} className="dp-list-item">
                      <div><div className="item-name">{e.name}</div><div className="item-desc">{e.position_title} · {fmt(e.salary)} ₽</div></div>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail.positions?.length > 0 && (
              <div className="dp-section">
                <h4>Должности ({detail.positions.length})</h4>
                <div className="dp-list">
                  {detail.positions.map(p => (
                    <div key={p.id} className="dp-list-item">
                      <div className="item-name">{p.title}</div>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmt(p.salary_min)}–{fmt(p.salary_max)} ₽</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DetailPanel>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Добавить отдел' : 'Редактировать'}>
        <FormField label="Название"><input value={form.name || ''} onChange={e => set('name', e.target.value)} /></FormField>
        <FormField label="Руководитель"><input value={form.head || ''} onChange={e => set('head', e.target.value)} /></FormField>
        <FormField label="Описание"><textarea value={form.description || ''} onChange={e => set('description', e.target.value)} /></FormField>
        <div className="modal-actions">
          <button className="btn btn-green" onClick={save}>{modal === 'add' ? 'Добавить' : 'Сохранить'}</button>
          <button className="btn btn-outline" onClick={() => setModal(null)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
