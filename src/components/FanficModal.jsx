import { useState, useMemo } from 'react';
import { parseWordCount, formatWordCount, wordsToHours } from '../lib/wordCount';
import { fuzzyMatch } from '../lib/ficUtils';
import TagInput from './TagInput';

const EMPTY = {
  title: '', author: '', series: '', seriesPart: '',
  chapters: '', totalChapters: '', totalChaptersUnknown: false,
  link: '', site: 'ao3', complete: false, status: 'want',
  rating: 0, summary: '', wordCount: null, readDate: '',
  readOn: '', miniSummary: '', skipReason: '', favorite: false,
  ships: [], tags: [], fandom: '', shelves: [],
};

const STATUS_LABEL = { want: 'Quero ler', reading: 'Lendo', read: 'Lida', skip: 'Não quero ler' };

export default function FanficModal({ fanfic, allFanfics = [], allShelves = [], onSave, onClose, defaultStatus }) {
  const [form, setForm] = useState(fanfic
    ? { ...EMPTY, ...fanfic, wordInput: fanfic.wordCount ? formatWordCount(fanfic.wordCount) : '' }
    : { ...EMPTY, status: defaultStatus || 'want', wordInput: '' }
  );
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const parsedWords = parseWordCount(form.wordInput);
  const hours = wordsToHours(parsedWords);

  const duplicates = useMemo(() => {
    const q = form.title.trim();
    if (q.length < 2) return [];
    return allFanfics.filter(f => fuzzyMatch(f.title, q) && f.id !== fanfic?.id);
  }, [form.title, allFanfics, fanfic?.id]);

  // Import from AO3 link
  const handleImport = async () => {
    const link = form.link?.trim();
    if (!link) { setImportError('Cole o link primeiro!'); return; }

    setImporting(true);
    setImportError('');

    try {
      // AO3: extract work ID and call their JSON API
      const ao3Match = link.match(/archiveofourown\.org\/works\/(\d+)/);
      if (ao3Match) {
        const workId = ao3Match[1];
        const res = await fetch(`https://archiveofourown.org/works/${workId}.json?view_adult=true`, {
          headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) throw new Error('Não foi possível acessar o AO3');
        const data = await res.json();

        setForm(f => ({
          ...f,
          title: data.title || f.title,
          author: data.authors?.[0]?.name || data.author_byline || f.author,
          totalChapters: data.stats?.chapters_expected || data.chapters?.length || f.totalChapters,
          chapters: data.stats?.chapters_written || data.chapters?.length || f.chapters,
          complete: data.complete ?? f.complete,
          wordInput: data.stats?.words ? String(data.stats.words) : f.wordInput,
          fandom: data.fandoms?.[0] || f.fandom,
          ships: data.relationships || f.ships,
          tags: [...(data.freeform_tags || []), ...(data.warnings || [])].slice(0, 10),
          site: 'ao3',
        }));
        return;
      }

      // Wattpad: extract story ID
      const wattpadMatch = link.match(/wattpad\.com\/story\/(\d+)/);
      if (wattpadMatch) {
        const storyId = wattpadMatch[1];
        const res = await fetch(`https://www.wattpad.com/api/v3/stories/${storyId}?fields=title,user,numParts,completed,mainCategory,tags`);
        if (!res.ok) throw new Error('Não foi possível acessar o Wattpad');
        const data = await res.json();

        setForm(f => ({
          ...f,
          title: data.title || f.title,
          author: data.user?.name || f.author,
          totalChapters: data.numParts || f.totalChapters,
          complete: data.completed ?? f.complete,
          fandom: data.mainCategory || f.fandom,
          tags: data.tags?.slice(0, 8) || f.tags,
          site: 'wattpad',
        }));
        return;
      }

      setImportError('Link não reconhecido. Suportamos AO3 e Wattpad por enquanto.');
    } catch (e) {
      setImportError('Não foi possível importar automaticamente. Preencha manualmente.');
    } finally {
      setImporting(false);
    }
  };

  const toggleShelf = (shelfId) => {
    const current = form.shelves || [];
    if (current.includes(shelfId)) set('shelves', current.filter(s => s !== shelfId));
    else set('shelves', [...current, shelfId]);
  };

  const handleSave = () => {
    if (!form.title.trim()) return alert('Informe o nome da fanfic!');
    const { wordInput, ...rest } = form;
    onSave({ ...rest, wordCount: parsedWords || null });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{fanfic ? 'Editar fanfic' : 'Adicionar fanfic'}</h2>

        {/* IMPORT pelo link */}
        <div className="form-group">
          <label className="form-label">Link</label>
          <div className="import-row">
            <input className="form-input" type="url" value={form.link || ''}
              onChange={e => set('link', e.target.value)} placeholder="https://archiveofourown.org/works/..." />
            <button type="button" className="import-btn" onClick={handleImport} disabled={importing}>
              {importing ? '⏳' : '⬇️ Importar'}
            </button>
          </div>
          {importError && <p className="import-error">{importError}</p>}
          {!fanfic && <p className="form-hint">Cole o link do AO3 ou Wattpad e clique em Importar para preencher automaticamente</p>}
        </div>

        {/* Título */}
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
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" value={form.author}
                onChange={e => set('author', e.target.value)} placeholder="Nome do autor" />
              <button type="button" className={`fav-btn ${form.favorite ? 'fav-on' : ''}`}
                onClick={() => set('favorite', !form.favorite)}>
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

        {/* Fandom */}
        <div className="form-group">
          <label className="form-label">Fandom</label>
          <input className="form-input" value={form.fandom || ''}
            onChange={e => set('fandom', e.target.value)} placeholder="ex: Harry Potter, Naruto..." />
        </div>

        {/* Ships */}
        <TagInput
          label="Ships"
          values={form.ships || []}
          onChange={v => set('ships', v)}
          placeholder="ex: Harry/Draco, Hermione/Ron..."
          color="var(--rose)"
        />

        {/* Tags */}
        <TagInput
          label="Tags"
          values={form.tags || []}
          onChange={v => set('tags', v)}
          placeholder="ex: slow burn, angst, hurt/comfort..."
          color="var(--blue)"
        />

        {/* Série */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Série</label>
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
              onChange={e => set('chapters', e.target.value)} placeholder="Lidos" />
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
        </div>

        {/* Melhor ler + Status */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Melhor ler no</label>
            <select className="form-select" value={form.readOn || ''} onChange={e => set('readOn', e.target.value)}>
              <option value="">Sem preferência</option>
              <option value="phone">📱 Celular</option>
              <option value="kindle">📕 Kindle</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="want">Quero ler</option>
              <option value="reading">Lendo</option>
              <option value="read">Lida</option>
              <option value="skip">Não quero ler</option>
            </select>
          </div>
        </div>

        {/* Completa */}
        <div className="form-group">
          <label className="form-label">Obra completa?</label>
          <select className="form-select" value={form.complete ? 'yes' : 'no'}
            onChange={e => set('complete', e.target.value === 'yes')}>
            <option value="no">Incompleta</option>
            <option value="yes">Completa</option>
          </select>
        </div>

        {/* Shelves */}
        {allShelves.length > 0 && (
          <div className="form-group">
            <label className="form-label">Shelves</label>
            <div className="shelf-picker">
              {allShelves.map(s => (
                <button key={s.id} type="button"
                  className={`shelf-pick-btn ${(form.shelves || []).includes(s.id) ? 'selected' : ''}`}
                  style={{ '--shelf-color': s.color || '#A78BFA' }}
                  onClick={() => toggleShelf(s.id)}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mini resumo */}
        {(form.status === 'want' || form.status === 'reading' || form.status === 'skip') && (
          <div className="form-group">
            <label className="form-label">Mini resumo</label>
            <textarea className="form-textarea" rows="2" value={form.miniSummary || ''}
              onChange={e => set('miniSummary', e.target.value)}
              placeholder="Sobre o que é essa história?" />
          </div>
        )}

        {form.status === 'skip' && (
          <div className="form-group">
            <label className="form-label">Motivo para não querer ler</label>
            <textarea className="form-textarea" rows="2" value={form.skipReason || ''}
              onChange={e => set('skipReason', e.target.value)}
              placeholder="Por que não quer ler?" />
          </div>
        )}

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
                  onChange={e => set('wordInput', e.target.value)} placeholder="ex: 17,162" />
              </div>
            </div>
            {parsedWords > 0 && (
              <div className="wordcount-preview">
                📖 {formatWordCount(parsedWords)} palavras ≈ <strong>~{hours}h</strong> de leitura
              </div>
            )}
            {form.wordInput && !parsedWords && (
              <div className="wordcount-error">⚠️ Tente: 17162, 17.162 ou 17,162</div>
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
