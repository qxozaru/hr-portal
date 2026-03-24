import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Modal, DetailPanel, Avatar, Field, FormField } from '../components/UI';
import { Search, Download, Plus, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function EmployeesPage() {
  const { can } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [form, setForm] = useState({});
  const [photoFile, setPhotoFile] = useState(null);

  const load = useCallback(async () => {
    const [empRes, deptRes, posRes, statsRes] = await Promise.all([
      api.get('/employees'), api.get('/departments'), api.get('/positions'), api.get('/stats')
    ]);
    setEmployees(empRes.data);
    setDepartments(deptRes.data);
    setPositions(posRes.data);
    setStats(statsRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    const res = await api.get(`/employees/${id}`);
    setDetail(res.data);
  };

  const fmt = n => Number(n).toLocaleString('ru-RU');

  const filtered = employees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [e.name, e.department_name, e.position_title, e.status].some(v => v?.toLowerCase().includes(q));
  });

  const openAdd = () => {
    setForm({ name: '', department_id: departments[0]?.id, position_id: positions[0]?.id, salary: '', hire_date: '', status: 'Активен', phone: '', email: '', bio: '' });
    setPhotoFile(null);
    setModal('add');
  };

  const openEdit = (emp) => {
    setForm({ ...emp });
    setPhotoFile(null);
    setModal('edit');
  };

  const saveEmployee = async () => {
    try {
      if (modal === 'add') {
        const res = await api.post('/employees', form);
        if (photoFile) {
          const fd = new FormData();
          fd.append('photo', photoFile);
          await api.post(`/employees/${res.data.id}/photo`, fd);
        }
      } else {
        await api.put(`/employees/${form.id}`, form);
        if (photoFile) {
          const fd = new FormData();
          fd.append('photo', photoFile);
          await api.post(`/employees/${form.id}/photo`, fd);
        }
      }
      setModal(null);
      setDetail(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  const deleteEmp = async (id) => {
    if (!confirm('Удалить сотрудника?')) return;
    await api.delete(`/employees/${id}`);
    setDetail(null);
    load();
  };

  const exportXlsx = () => {
    const data = [['ID', 'ФИО', 'Отдел', 'Должность', 'Зарплата', 'Дата', 'Статус', 'Телефон', 'Email']];
    filtered.forEach(e => data.push([e.id, e.name, e.department_name, e.position_title, e.salary, e.hire_date, e.status, e.phone, e.email]));
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники');
    XLSX.writeFile(wb, 'hr_report.xlsx');
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Сотрудников</div><div className="stat-value">{stats.empCount}</div></div>
        <div className="stat-card"><div className="stat-label">ФОТ</div><div className="stat-value">{fmt(stats.totalSalary)} ₽</div></div>
        <div className="stat-card"><div className="stat-label">Активных</div><div className="stat-value">{stats.activeCount}</div></div>
        <div className="stat-card"><div className="stat-label">Отделов</div><div className="stat-value">{stats.deptCount}</div></div>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Сотрудники</h2>
          <span className="page-meta">{filtered.length} записей</span>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><List size={16} /></button>
            <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}><LayoutGrid size={16} /></button>
          </div>
          {can('add') && <button className="btn btn-blue" onClick={openAdd}><Plus size={16} /> Добавить</button>}
          {can('export') && <button className="btn btn-green" onClick={exportXlsx}><Download size={16} /> Экспорт</button>}
        </div>
      </div>

      {/* Search */}
      {can('search') && (
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Поиск по имени, отделу, должности..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>ID</th>
                <th>Сотрудник</th><th>Отдел</th><th>Должность</th>
                <th>Зарплата ₽</th><th>Дата</th><th>Статус</th>
                {can('del') && <th style={{ width: 80 }}></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} onClick={() => openDetail(e.id)}>
                  <td className="col-id">{e.id}</td>
                  <td className="col-name"><Avatar name={e.name} photo={e.photo} size={30} />{e.name}</td>
                  <td>{e.department_name || '—'}</td>
                  <td>{e.position_title || '—'}</td>
                  <td className="col-salary">{fmt(e.salary)}</td>
                  <td className="col-date">{e.hire_date}</td>
                  <td><StatusBadge status={e.status} /></td>
                  {can('del') && (
                    <td><button className="btn btn-danger-sm" onClick={ev => { ev.stopPropagation(); deleteEmp(e.id); }}>Удалить</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {view === 'cards' && (
        <div className="cards-grid">
          {filtered.map(e => (
            <div key={e.id} className="emp-card" onClick={() => openDetail(e.id)}>
              <div className="emp-card-top">
                <Avatar name={e.name} photo={e.photo} size={48} />
                <div><h4>{e.name}</h4><p>{e.position_title}</p></div>
              </div>
              <div className="emp-card-rows">
                <div className="card-row"><span>Отдел</span><span>{e.department_name}</span></div>
                <div className="card-row"><span>Зарплата</span><span>{fmt(e.salary)} ₽</span></div>
                <div className="card-row"><span>Статус</span><StatusBadge status={e.status} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel open={!!detail} onClose={() => setDetail(null)} title="Карточка сотрудника"
        actions={<>
          {can('edit') && <button className="btn btn-blue" onClick={() => openEdit(detail)}>Редактировать</button>}
          {can('del') && <button className="btn btn-danger" onClick={() => deleteEmp(detail.id)}>Удалить</button>}
          <button className="btn btn-outline" onClick={() => setDetail(null)}>Закрыть</button>
        </>}>
        {detail && (
          <>
            <div className="dp-photo-section">
              <Avatar name={detail.name} photo={detail.photo} size={88} />
              <div className="dp-name">{detail.name}</div>
              <div className="dp-role">{detail.position_title} · {detail.department_name}</div>
            </div>
            <div className="dp-section">
              <h4>Информация</h4>
              <div className="dp-grid">
                <Field label="Отдел" value={detail.department_name} />
                <Field label="Должность" value={detail.position_title} />
                <Field label="Зарплата" value={`${fmt(detail.salary)} ₽`} />
                <Field label="Дата начала" value={detail.hire_date} />
                <Field label="Телефон" value={detail.phone} />
                <Field label="Email" value={detail.email} />
                <Field label="Статус" value={<StatusBadge status={detail.status} />} />
                <Field label="О сотруднике" value={detail.bio} full />
              </div>
            </div>
            {detail.projects?.length > 0 && (
              <div className="dp-section">
                <h4>Проекты ({detail.projects.length})</h4>
                <div className="dp-list">
                  {detail.projects.map(p => (
                    <div key={p.id} className="dp-list-item">
                      <div><div className="item-name">{p.name}</div><div className="item-desc">{p.description}</div></div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detail.documents?.length > 0 && (
              <div className="dp-section">
                <h4>Документы ({detail.documents.length})</h4>
                <div className="dp-list">
                  {detail.documents.map(d => (
                    <div key={d.id} className="dp-list-item">
                      <div><div className="item-name">{d.name}</div><div className="item-desc">{d.type} · {d.doc_date}</div></div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DetailPanel>

      {/* Add/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Добавить сотрудника' : 'Редактировать'}>
        <div className="photo-upload">
          <Avatar name={form.name || 'N'} photo={photoFile ? URL.createObjectURL(photoFile) : form.photo} size={56} />
          <label className="btn btn-outline upload-btn">
            Загрузить фото
            <input type="file" accept="image/*" hidden onChange={e => setPhotoFile(e.target.files[0])} />
          </label>
        </div>
        <FormField label="ФИО"><input value={form.name || ''} onChange={e => set('name', e.target.value)} /></FormField>
        <div className="form-row">
          <FormField label="Отдел">
            <select value={form.department_id || ''} onChange={e => set('department_id', +e.target.value)}>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Должность">
            <select value={form.position_id || ''} onChange={e => set('position_id', +e.target.value)}>
              {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </FormField>
        </div>
        <div className="form-row">
          <FormField label="Зарплата"><input type="number" value={form.salary || ''} onChange={e => set('salary', +e.target.value)} /></FormField>
          <FormField label="Статус">
            <select value={form.status || 'Активен'} onChange={e => set('status', e.target.value)}>
              {['Активен', 'В отпуске', 'Удалённо', 'Уволен'].map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <div className="form-row">
          <FormField label="Телефон"><input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></FormField>
          <FormField label="Email"><input value={form.email || ''} onChange={e => set('email', e.target.value)} /></FormField>
        </div>
        <FormField label="Дата начала"><input type="date" value={form.hire_date || ''} onChange={e => set('hire_date', e.target.value)} /></FormField>
        <FormField label="О сотруднике"><textarea value={form.bio || ''} onChange={e => set('bio', e.target.value)} /></FormField>
        <div className="modal-actions">
          <button className="btn btn-green" onClick={saveEmployee}>{modal === 'add' ? 'Добавить' : 'Сохранить'}</button>
          <button className="btn btn-outline" onClick={() => setModal(null)}>Отмена</button>
        </div>
      </Modal>
    </div>
  );
}
