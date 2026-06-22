const STATUS_LABEL = { want: 'Quero ler', reading: 'Lendo', read: 'Lida' };
const STATUS_EMOJI = { want: '📋', reading: '📖', read: '✅' };

function Stars({ rating }) {
  const full = Math.round(rating / 2);
  return <span className="rating-stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

export default function AuthorModal({ author, fanfics, onClose }) {
  const byStatus = {
    reading: fanfics.filter(f => f.status === 'reading'),
    want: fanfics.filter(f => f.status === 'want'),
    read: fanfics.filter(f => f.status === 'read'),
  };

  const sorted = (list) => [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-author">
        <div className="author-modal-header">
          <div>
            <h2 className="modal-title" style={{ marginBottom: 2 }}>✍️ {author}</h2>
            <p className="author-modal-count">{fanfics.length} fanfic{fanfics.length !== 1 ? 's' : ''} salva{fanfics.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="author-modal-close" onClick={onClose}>✕</button>
        </div>

        {['reading', 'want', 'read'].map(status => {
          const list = sorted(byStatus[status]);
          if (list.length === 0) return null;
          return (
            <div key={status} className="author-section">
              <h3 className="author-section-title">
                {STATUS_EMOJI[status]} {STATUS_LABEL[status]} <span className="count">{list.length}</span>
              </h3>
              <div className="author-fic-list">
                {list.map(f => (
                  <div key={f.id} className="author-fic-item">
                    <div className="author-fic-left">
                      <span className={`card-spine-dot spine-${f.site === 'ao3' ? 'ao3' : f.site === 'wattpad' ? 'wattpad' : 'other'}`} />
                      <div>
                        <p className="author-fic-title">
                          {f.link
                            ? <a href={f.link} target="_blank" rel="noopener noreferrer">{f.title}</a>
                            : f.title}
                        </p>
                        {f.series && (
                          <p className="author-fic-series">
                            📚 {f.series}{f.seriesPart ? ` — Parte ${f.seriesPart}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="author-fic-right">
                      {f.status === 'read' && f.rating > 0 && (
                        <span className="author-fic-rating">
                          <Stars rating={f.rating} /> <span className="rating-num">{f.rating}/10</span>
                        </span>
                      )}
                      <span className={`badge ${f.complete ? 'badge-complete' : 'badge-incomplete'}`}>
                        {f.complete ? 'Completa' : 'Em andamento'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="modal-actions">
          <button className="btn-save" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
