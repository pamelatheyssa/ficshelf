import { useState, useMemo } from 'react';
import { parseWordCount, formatWordCount, wordsToHours } from '../lib/wordCount';
import { fuzzyMatch } from '../lib/ficUtils';

const EMPTY = {
  title: '', author: '', series: '', seriesPart: '',
  chapters: '', totalChapters: '', totalChaptersUnknown: false,
  link: '', site: 'ao3', complete: false, status: 'want',
  rating: 0, summary: '', wordCount: null, readDate: '',
  readOn: '', // 'phone' | 'kindle' | ''
  miniSummary: '', // para quero ler / não quero ler
  skipReason: '', // motivo para não quero ler
  favorite: false,
};

const STATUS_LABEL = { want: 'Quero ler', reading: 'Lendo', read: 'Lida', skip: 'Não quero ler' };

export default function FanficModal({ fanfic, allFanfics = [], onSave, onClose, defaultStatus }) {
  const [form, setForm] = useState(fanfic
    ? { ...EMPTY, ...fanfic, wordInput: fanfic.wordCount ? formatWordCount(fanfic.wordCount) : '' }
    : { ...EMPTY, status: defaultStatus || 'want', wordInput: '' }
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const parsedWords = parseWordCount(form.wordInput);
  const hours = wordsToHours(parsedWords);

  // Fuzzy duplicate detection
  const duplicates = useMemo(() => {
    const q = form.title.trim();
    if (q.length < 2) return [];
    return allFanfics.filter(f =>
      fuzzyMatch(f.title, q) && f.id !== fanfic?.id
    );
  }, [form.title, allFanfics, fanfic?.id]);

  const handleSave = () => {
    if (!form.title.trim()) return alert('Informe o nome da fanfic!');
    const { wordInput, ...rest } = form;
    onSave({ ...rest, wordCount: parsedWords || null });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{fanfic ? 'Editar fanfic' : 'Adicionar fanfic'}</h2>

        {/* Título + duplicata */}
        <div className="form-group">
          <label className="form-label">Nome da fanfic *</label>
          <input className="form-input" value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="Título da história" />
          {duplicates.length > 0 && (
            <div className="duplicate-warning">
              ⚠️ Fic parecida já salva:
              {duplicates.map(d => (
                <div key={d.id} className="duplicate-item">
                  <span className={`badge badge-${d.site}`}>{d.site === 'ao3' ? 'AO3' : d.site === 'wattpad' ? 'Wattpad' : 'Outro'}</span>
                  <span className="duplicate-status">📌 {STATUS_LABEL[d.status] || d.status}</span>
                  <span className="duplicate-author">{d.title}</span>
                  {d.author && <span className="duplicate-author">por {d.author}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Autor + favorito */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Autor</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" value={form.author}
                onChange={e => set('author', e.target.value)} placeholder="Nome do autor" />
              <button
                type="button"
                className={`fav-btn ${form.favorite ? 'fav-on' : ''}`}
                onClick={() => set('favorite', !form.favorite)}
                title={form.favorite ? 'Remover favorito' : 'Favoritar'}
              >
                {form.favorite ? '★' : '☆'}
              </button>
            </div>
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

        {/* Série */}
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

        {/* Capítulos */}
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
          <p className="form-hint">Marque "?" se o total ainda não é definido</p>
        </div>

        {/* Link + melhor leitura */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Link</label>
            <input className="form-input" type="url" value={form.link || ''}
              onChange={e => set('link', e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">Melhor ler no</label>
            <select className="form-select" value={form.readOn || ''} onChange={e => set('readOn', e.target.value)}>
              <option value="">Sem preferência</option>
              <option value="phone">📱 Celular</option>
              <option value="kindle">📕 Kindle</option>
            </select>
          </div>
        </div>

        {/* Status + completa */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="want">Quero ler</option>
              <option value="reading">Lendo</option>
              <option value="read">Lida</option>
              <option value="skip">Não quero ler</option>
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

        {/* Mini resumo — para want / reading / skip */}
        {(form.status === 'want' || form.status === 'reading' || form.status === 'skip') && (
          <div className="form-group">
            <label className="form-label">Mini resumo</label>
            <textarea className="form-textarea" rows="2" value={form.miniSummary || ''}
              onChange={e => set('miniSummary', e.target.value)}
              placeholder="Sobre o que é essa história?" />
          </div>
        )}

        {/* Motivo — só para skip */}
        {form.status === 'skip' && (
          <div className="form-group">
            <label className="form-label">Motivo para não querer ler</label>
            <textarea className="form-textarea" rows="2" value={form.skipReason || ''}
              onChange={e => set('skipReason', e.target.value)}
              placeholder="Por que não quer ler?" />
          </div>
        )}

        {/* Campos de lida */}
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
                <input className="form-input" value={form.wordInput || ''}
                  onChange={e => set('wordInput', e.target.value)}
                  placeholder="ex: 17,162" />
              </div>
            </div>
            {parsedWords > 0 && (
              <div className="wordcount-preview">
                📖 {formatWordCount(parsedWords)} palavras ≈ <strong>~{hours}h</strong> de leitura
              </div>
            )}
            {form.wordInput && !parsedWords && (
              <div className="wordcount-error">⚠️ Valor inválido — tente: 17162, 17.162 ou 17,162</div>
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
