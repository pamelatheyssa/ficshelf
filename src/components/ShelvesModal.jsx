import { useState } from 'react';

const PRESET_COLORS = [
  '#A78BFA', '#F472B6', '#60A5FA', '#10B981',
  '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#3B82F6', '#14B8A6', '#F97316', '#6366F1',
];

function ShelfRow({ shelf, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(shelf.name);
  const [color, setColor] = useState(shelf.color || '#A78BFA');

  const save = () => {
    if (name.trim()) { onEdit(shelf.id, { name: name.trim(), color }); }
    setEditing(false);
  };

  if (editing) return (
    <div className="shelf-row editing">
      <input className="form-input shelf-name-input" value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
      <div className="color-picks">
        {PRESET_COLORS.map(c => (
          <button key={c} className={`color-dot ${color === c ? 'selected' : ''}`}
            style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <div className="shelf-row-actions">
        <button className="btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
        <button className="btn-save" onClick={save}>Salvar</button>
      </div>
    </div>
  );

  return (
    <div className="shelf-row">
      <span className="shelf-dot" style={{ background: shelf.color || '#A78BFA' }} />
      <span className="shelf-name">{shelf.name}</span>
      <div className="shelf-row-actions">
        <button className="action-btn btn-edit" onClick={() => setEditing(true)}>✏️</button>
        <button className="action-btn btn-delete" onClick={() => {
          if (window.confirm(`Remover shelf "${shelf.name}"? As fics não serão deletadas.`))
            onDelete(shelf.id);
        }}>🗑️</button>
      </div>
    </div>
  );
}

export default function ShelvesModal({ shelves, onAdd, onEdit, onDelete, onClose }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#A78BFA');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newColor);
    setNewName('');
    setNewColor('#A78BFA');
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-shelves">
        <h2 className="modal-title">🗂️ Gerenciar Shelves</h2>

        {/* Criar nova */}
        <div className="new-shelf-form">
          <input className="form-input" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nome da nova shelf..." />
          <div className="color-picks">
            {PRESET_COLORS.map(c => (
              <button key={c} className={`color-dot ${newColor === c ? 'selected' : ''}`}
                style={{ background: c }} onClick={() => setNewColor(c)} />
            ))}
          </div>
          <button className="btn-save" style={{ width: '100%' }} onClick={handleAdd}>
            + Criar shelf
          </button>
        </div>

        <div className="shelf-list">
          {shelves.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              Nenhuma shelf criada ainda.
            </p>
          ) : shelves.map(s => (
            <ShelfRow key={s.id} shelf={s} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-save" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
