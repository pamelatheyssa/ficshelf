import { useState, useMemo } from 'react';

const EMPTY = {
  title: '', author: '', series: '', seriesPart: '',
  chapters: '', totalChapters: '', totalChaptersUnknown: false,
  link: '', site: 'ao3', complete: false, status: 'want',
  rating: 0, summary: '', wordCount: '', readDate: '',
};

const STATUS_LABEL = { want: 'Quero ler', reading: 'Lendo', read: 'Lida' };

export default function FanficModal({ fanfic, allFanfics = [], onSave, onClose, defaultStatus }) {
  const [form, setForm] = useState(fanfic ? { ...fanfic } : { ...EMPTY, status: defaultStatus || 'want' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const duplicates = useMemo(() => {
    const q = form.title.trim().toLowerCase();
    if (!q) return [];
    return allFanfics.filter(f => f.title?.toLowerCase() === q && f.id !== fanfic?.id);
  }, [form.title, allFanfics, fanfic?.id]);

  const handleSave = () => {
    if (!form.title.trim()) return alert('Informe o nome da fanfic!');
    onSave({ ...form, wordCount: form.wordCount ? Number(form.wordCount) : null });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{fanfic ? 'Editar fanfic' : 'Adicionar fanfic'}</h2>

        <div className="form-group">
          <label className="form-label">Nome da fanfic *</label>
          <input className="form-input" value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="Título da história" />
          {duplicates.length > 0 && (
            <div className="duplicate-warning">
              ⚠️ Você já tem {duplicates.length > 1 ? 'fics' : 'uma fic'} com esse título:
              {duplicates.map(d => (
                <div key={d.id} className="duplicate-item">
                  <span className={`badge badge-${d.site === 'ao3' ? 'ao3' : d.site === 'wattpad' ? 'wattpad' : 'other'}`}>
                    {d.site === 'ao3' ? 'AO3' : d.site === 'wattpad' ? 'Wattpad' : 'Outro'}
                  </span>
                  <span className="duplicate-status">📌 {STATUS_LABEL[d.status] || d.status}</span>
                  {d.author && <span className="duplicate-author">por {d.author}</span>}
                </div>
              ))}
            </div>
          )}
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
            <label className="form-label">Série (opcional)</label>
            <input className="form-input" value={form.series || ''}
              onChange={e => set('series', e.target.value)} placeholder="Nome da série" />
          </div>
          <div className="form-group">
            <label className="form-label">Parte nº</label>
            <input className="form-input" type="number" min="1" value={form.seriesPart || ''}
              onChange={e => set('seriesPart', e.target.value)} placeholder="ex: 2" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Capítulos</label>
          <div className="chapters-row">
            <input className="form-input" type="number" min="0" value={form.chapters || ''}
              onChange={e => set('chapters', e.target.value)} placeholder="Lidos/disponíveis" />
            <span style={{ color: 'var(--gray)', alignSelf: 'center', flexShrink: 0 }}>/</span>
            <input className="form-input" type="number" min="0"
              value={form.totalChaptersUnknown ? '' : (form.totalChapters || '')}
              onChange={e => set('totalChapters', e.target.value)}
              placeholder="Total" disabled={form.totalChaptersUnknown} />
            <label className="unknown-check">
              <input type="checkbox" checked={!!form.totalChaptersUnknown}
                onChange={e => set('totalChaptersUnknown', e.target.checked)} />
              <span>?</span>
            </label>
          </div>
          <p className="form-hint">Marque "?" se o total de capítulos ainda não é definido</p>
        </div>

        <div className="form-group">
          <label className="form-label">Link</label>
          <input className="form-input" type="url" value={form.link || ''}
            onChange={e => set('link', e.target.value)} placeholder="https://..." />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="want">Quero ler</option>
              <option value="reading">Lendo</option>
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
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data de conclusão</label>
                <input className="form-input" type="date" value={form.readDate || ''}
                  onChange={e => set('readDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nº de palavras</label>
                <input className="form-input" type="number" min="0" value={form.wordCount || ''}
                  onChange={e => set('wordCount', e.target.value)} placeholder="ex: 45000" />
              </div>
            </div>
            {form.wordCount && Number(form.wordCount) > 0 && (
              <div className="wordcount-preview">
                📖 {Number(form.wordCount).toLocaleString('pt-BR')} palavras ≈ <strong>{(Number(form.wordCount) / 2600 * 0.25).toFixed(1)}h</strong> de leitura
              </div>
            )}
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
              <textarea className="form-textarea" value={form.summary || ''}
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
