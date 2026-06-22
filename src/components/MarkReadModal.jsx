import { useState } from 'react';

export default function MarkReadModal({ fanfic, onConfirm, onClose }) {
  const [rating, setRating] = useState(7);
  const [summary, setSummary] = useState('');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">✨ Marcar como lida</h2>
        <p style={{ color: 'var(--gray-light)', marginBottom: 20, fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--cream)' }}>{fanfic.title}</strong> vai para a aba Lidas.
          Quer deixar uma nota ou resumo?
        </p>

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
          <button className="btn-save" onClick={() => onConfirm(rating, summary)}>
            Marcar como lida
          </button>
        </div>
      </div>
    </div>
  );
}
