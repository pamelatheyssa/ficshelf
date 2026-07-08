import { useState } from 'react';

// Componente reutilizável para ships, tags, fandoms
export default function TagInput({ label, values = [], onChange, placeholder, color = 'var(--lilac)' }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (!val) return;
    if (!values.includes(val)) onChange([...values, val]);
    setInput('');
  };

  const remove = (v) => onChange(values.filter(x => x !== v));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input && values.length) remove(values[values.length - 1]);
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="tag-input-wrap">
        {values.map(v => (
          <span key={v} className="tag-chip" style={{ '--chip-color': color }}>
            {v}
            <button type="button" onClick={() => remove(v)}>✕</button>
          </span>
        ))}
        <input
          className="tag-input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={values.length === 0 ? placeholder : ''}
        />
      </div>
      <p className="form-hint">Pressione Enter ou vírgula para adicionar</p>
    </div>
  );
}
