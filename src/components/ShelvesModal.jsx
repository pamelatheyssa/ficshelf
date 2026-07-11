import { useState } from 'react';

const PRESET_COLORS = [
  '#5B7F5B', '#C0607A', '#4A7AA8', '#A07830',
  '#7A5BAF', '#4A8A6A', '#C06040', '#5A8AAA',
  '#8A5B7A', '#6A8A4A', '#AA6040', '#4A6AAA',
];

function ShelfRow({ shelf, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(shelf.name);
  const [color, setColor] = useState(shelf.color || '#5B7F5B');

  const save = () => {
    if (name.trim()) onEdit(shelf.id, { name: name.trim(), color });
    setEditing(false);
  };

  if (editing) return (
    <div className="shelf-row editing">
      <input className="form-input shelf-name-input" value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
      <div className="color-picks">
        {PRESET_COLORS.map(c => (
          <button key={c} type="button" className={`color-dot ${color === c ? 'selected' : ''}`}
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
      <span className="shelf-dot" style={{ background: shelf.color || '#5B7F5B' }} />
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

export default function ShelvesModal({ shelves, onAdd, onEdit, onDelete, onClose, error }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#5B7F5B');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await onAdd(newName.trim(), newColor);
      setNewName('');
      setNewColor('#5B7F5B');
    } catch (e) {
      setAddError('Erro ao criar shelf: ' + (e.message || 'tente novamente'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-shelves">
        <h2 className="modal-title">🗂️ Gerenciar Shelves</h2>

        <div className="new-shelf-form">
          <input className="form-input" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nome da nova shelf..." />
          <div className="color-picks">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" className={`color-dot ${newColor === c ? 'selected' : ''}`}
                style={{ background: c }} onClick={() => setNewColor(c)} />
            ))}
          </div>
          {addError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{addError}</p>}
          <button className="btn-save" style={{ width: '100%' }} onClick={handleAdd} disabled={adding}>
            {adding ? '⏳ Criando...' : '+ Criar shelf'}
          </button>
        </div>

        <div className="shelf-list">
          {shelves.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              Nenhuma shelf criada ainda. Digite um nome acima e clique em "+ Criar shelf".
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
