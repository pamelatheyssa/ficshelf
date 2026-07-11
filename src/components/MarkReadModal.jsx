import { useState } from 'react';
import { parseWordCount, formatWordCount, wordsToHours } from '../lib/wordCount';

export default function MarkReadModal({ fanfic, allShelves = [], onConfirm, onClose }) {
  const [rating, setRating] = useState(fanfic.rating || 7);
  const [summary, setSummary] = useState(fanfic.summary || '');
  const [wordInput, setWordInput] = useState(fanfic.wordCount ? formatWordCount(fanfic.wordCount) : '');
  const [readDate, setReadDate] = useState(new Date().toISOString().split('T')[0]);
  const [chapters, setChapters] = useState(fanfic.chapters || '');
  const [totalChapters, setTotalChapters] = useState(fanfic.totalChapters || '');
  const [totalChaptersUnknown, setTotalChaptersUnknown] = useState(fanfic.totalChaptersUnknown || false);
  const [favorite, setFavorite] = useState(fanfic.favorite || false);
  const [shelves, setShelves] = useState(fanfic.shelves || []);

  const parsedWords = parseWordCount(wordInput);
  const hours = wordsToHours(parsedWords);

  const currentChapText = fanfic.chapters
    ? `${fanfic.chapters}/${fanfic.totalChaptersUnknown ? '?' : (fanfic.totalChapters || '?')}`
    : null;

  const toggleShelf = (id) =>
    setShelves(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">✨ Marcar como lida</h2>
        <p style={{ color: 'var(--gray-light)', marginBottom: 20, fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--cream)' }}>{fanfic.title}</strong>
        </p>

        {/* Favoritar */}
        <div className="form-group">
          <label className="form-label">Favoritar esta fic?</label>
          <button type="button"
            className={`fav-toggle-btn ${favorite ? 'fav-on' : ''}`}
            onClick={() => setFavorite(f => !f)}>
            {favorite ? '★ Favoritada' : '☆ Adicionar aos favoritos'}
          </button>
        </div>

        {/* Shelves */}
        {allShelves.length > 0 && (
          <div className="form-group">
            <label className="form-label">Adicionar a uma shelf</label>
            <div className="shelf-picker">
              {allShelves.map(s => (
                <button key={s.id} type="button"
                  className={`shelf-pick-btn ${shelves.includes(s.id) ? 'selected' : ''}`}
                  style={{ '--shelf-color': s.color || '#A78BFA' }}
                  onClick={() => toggleShelf(s.id)}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Capítulos */}
        <div className="form-group">
          <label className="form-label">
            Atualizar capítulos
            {currentChapText && <span style={{ color: 'var(--gray)', fontWeight: 400, marginLeft: 8 }}>(atual: {currentChapText})</span>}
          </label>
          <div className="chapters-row">
            <input className="form-input" type="number" min="0" value={chapters}
              onChange={e => setChapters(e.target.value)} placeholder="Lidos" />
            <span style={{ color: 'var(--gray)', alignSelf: 'center', flexShrink: 0 }}>/</span>
            <input className="form-input" type="number" min="0"
              value={totalChaptersUnknown ? '' : totalChapters}
              onChange={e => setTotalChapters(e.target.value)}
              placeholder="Total" disabled={totalChaptersUnknown} />
            <label className="unknown-check">
              <input type="checkbox" checked={totalChaptersUnknown}
                onChange={e => setTotalChaptersUnknown(e.target.checked)} />
              <span>?</span>
            </label>
          </div>
        </div>

        {/* Data + palavras */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data de conclusão</label>
            <input className="form-input" type="date" value={readDate}
              onChange={e => setReadDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Nº de palavras</label>
            <input className="form-input" value={wordInput}
              onChange={e => setWordInput(e.target.value)} placeholder="ex: 17,162" />
          </div>
        </div>

        {parsedWords > 0 && (
          <div className="wordcount-preview">
            📖 {formatWordCount(parsedWords)} palavras ≈ <strong>~{hours}h</strong> de leitura
          </div>
        )}
        {wordInput && !parsedWords && (
          <div className="wordcount-error">⚠️ Tente: 17162, 17.162 ou 17,162</div>
        )}

        <div className="form-group">
          <label className="form-label">Nota (1–10)</label>
          <div className="rating-input">
            <input type="range" min="1" max="10" value={rating}
              onChange={e => setRating(Number(e.target.value))} />
            <span className="rating-display">{rating}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Resumo / Anotação (opcional)</label>
          <textarea className="form-textarea" value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Suas impressões sobre a história..." />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={() => onConfirm(
            rating, summary, parsedWords, readDate,
            { chapters, totalChapters, totalChaptersUnknown, shelves },
            favorite
          )}>Marcar como lida</button>
        </div>
      </div>
    </div>
  );
}
