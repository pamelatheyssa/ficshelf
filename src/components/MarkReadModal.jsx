import { useState } from 'react';
import { parseWordCount, formatWordCount, wordsToHours } from '../lib/wordCount';

export default function MarkReadModal({ fanfic, onConfirm, onClose }) {
  const [rating, setRating] = useState(7);
  const [summary, setSummary] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [readDate, setReadDate] = useState(new Date().toISOString().split('T')[0]);

  const parsedWords = parseWordCount(wordInput);
  const hours = wordsToHours(parsedWords);

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
            <input className="form-input" value={wordInput}
              onChange={e => setWordInput(e.target.value)}
              placeholder="ex: 17,162 ou 17.162" />
          </div>
        </div>

        {parsedWords > 0 && (
          <div className="wordcount-preview">
            📖 {formatWordCount(parsedWords)} palavras ≈ <strong>~{hours}h</strong> de leitura
          </div>
        )}
        {wordInput && !parsedWords && (
          <div className="wordcount-error">⚠️ Valor inválido — tente: 17162, 17.162 ou 17,162</div>
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
          <button className="btn-save" onClick={() => onConfirm(rating, summary, parsedWords, readDate)}>
            Marcar como lida
          </button>
        </div>
      </div>
    </div>
  );
}
