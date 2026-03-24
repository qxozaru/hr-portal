import { X } from 'lucide-react';

// Status Badge
const statusStyles = {
  'Активен': 'st-green', 'Действует': 'st-green', 'Одобрено': 'st-green', 'Завершён': 'st-green',
  'В отпуске': 'st-amber', 'Планирование': 'st-amber',
  'Удалённо': 'st-blue', 'В работе': 'st-purple',
  'Уволен': 'st-red', 'Просрочен': 'st-red',
};

export function StatusBadge({ status }) {
  return <span className={`status-badge ${statusStyles[status] || 'st-green'}`}>{status}</span>;
}

// Modal
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// Detail Panel (slide-in from right)
export function DetailPanel({ open, onClose, title, children, actions }) {
  if (!open) return null;
  return (
    <div className="detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-panel">
        <div className="dp-header">
          <span className="dp-title">{title}</span>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="dp-body">{children}</div>
        {actions && <div className="dp-actions">{actions}</div>}
      </div>
    </div>
  );
}

// Avatar
export function Avatar({ name, photo, size = 40 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
  if (photo) {
    return <img src={photo} alt={name} className="avatar" style={{ width: size, height: size }} />;
  }
  return <div className="avatar-placeholder" style={{ width: size, height: size, fontSize: size * 0.35 }}>{initials}</div>;
}

// Field display
export function Field({ label, value, full }) {
  return (
    <div className={`dp-field ${full ? 'full' : ''}`}>
      <div className="field-label">{label}</div>
      <div className="field-value">{value || '—'}</div>
    </div>
  );
}

// Form field
export function FormField({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}
