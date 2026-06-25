import { useState } from 'react';

export default function MarkReadModal({ fanfic, onConfirm, onClose }) {
  const [rating, setRating] = useState(7);
  const [summary, setSummary] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [readDate, setReadDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">✨ Marcar como lida</h2>
        <p style={{ color: 'var(--gray-light)', marginBottom: 20, fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--cream)' }}>{fanfic.title}</strong> vai para a aba Lidas.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Data de conclusão</label>
            <input className="form-input" type="date" value={readDate}
              onChange={e => setReadDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Nº de palavras</label>
            <input className="form-input" type="number" min="0" value={wordCount}
              onChange={e => setWordCount(e.target.value)} placeholder="ex: 45000" />
          </div>
        </div>

        {wordCount && Number(wordCount) > 0 && (
          <div className="wordcount-preview">
            📖 {Number(wordCount).toLocaleString('pt-BR')} palavras ≈{' '}
            <strong>{(Number(wordCount) / 2600 * 0.25).toFixed(1)}h</strong> de leitura
          </div>
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
          <button className="btn-save" onClick={() => onConfirm(rating, summary, wordCount, readDate)}>
            Marcar como lida
          </button>
        </div>
      </div>
    </div>
  );
}
