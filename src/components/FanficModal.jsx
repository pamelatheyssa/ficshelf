import { useState, useEffect } from 'react';

const EMPTY = {
  title: '', author: '', chapters: '', totalChapters: '',
  link: '', site: 'ao3', complete: false, status: 'want',
  rating: 0, summary: '',
};

export default function FanficModal({ fanfic, onSave, onClose, defaultStatus }) {
  const [form, setForm] = useState(fanfic ? { ...fanfic } : { ...EMPTY, status: defaultStatus || 'want' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return alert('Informe o nome da fanfic!');
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{fanfic ? 'Editar fanfic' : 'Adicionar fanfic'}</h2>

        <div className="form-group">
          <label className="form-label">Nome da fanfic *</label>
          <input className="form-input" value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="Título da história" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Autor</label>
            <input className="form-input" value={form.author}
              onChange={e => set('author', e.target.value)} placeholder="Nome do autor" />
          </div>
          <div className="form-group">
            <label className="form-label">Plataforma</label>
            <select className="form-select" value={form.site} onChange={e => set('site', e.target.value)}>
              <option value="ao3">AO3</option>
              <option value="wattpad">Wattpad</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Capítulos lidos</label>
            <input className="form-input" type="number" min="0" value={form.chapters}
              onChange={e => set('chapters', e.target.value)} placeholder="ex: 12" />
          </div>
          <div className="form-group">
            <label className="form-label">Total de capítulos</label>
            <input className="form-input" type="number" min="0" value={form.totalChapters}
              onChange={e => set('totalChapters', e.target.value)} placeholder="ex: 40" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Link</label>
          <input className="form-input" type="url" value={form.link}
            onChange={e => set('link', e.target.value)} placeholder="https://..." />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="want">Quero ler</option>
              <option value="read">Lida</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Obra completa?</label>
            <select className="form-select" value={form.complete ? 'yes' : 'no'}
              onChange={e => set('complete', e.target.value === 'yes')}>
              <option value="no">Incompleta</option>
              <option value="yes">Completa</option>
            </select>
          </div>
        </div>

        {form.status === 'read' && (
          <>
            <div className="form-group">
              <label className="form-label">Nota (1–10)</label>
              <div className="rating-input">
                <input type="range" min="1" max="10" value={form.rating || 5}
                  onChange={e => set('rating', Number(e.target.value))} />
                <span className="rating-display">{form.rating || 5}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Resumo / Anotação</label>
              <textarea className="form-textarea" value={form.summary}
                onChange={e => set('summary', e.target.value)}
                placeholder="Suas impressões sobre a história..." />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
