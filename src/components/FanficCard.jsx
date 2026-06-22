function Stars({ rating }) {
  const full = Math.round(rating / 2);
  return (
    <span className="rating-stars">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

export default function FanficCard({ fanfic, onEdit, onDelete, onMarkRead }) {
  const spineClass = fanfic.site === 'ao3' ? 'spine-ao3'
    : fanfic.site === 'wattpad' ? 'spine-wattpad' : 'spine-other';

  const siteBadgeClass = fanfic.site === 'ao3' ? 'badge-ao3'
    : fanfic.site === 'wattpad' ? 'badge-wattpad' : 'badge-other';

  const siteLabel = fanfic.site === 'ao3' ? 'AO3'
    : fanfic.site === 'wattpad' ? 'Wattpad' : 'Outro';

  const chaptersText = fanfic.chapters && fanfic.totalChapters
    ? `${fanfic.chapters}/${fanfic.totalChapters} cap.`
    : fanfic.chapters ? `${fanfic.chapters} cap.`
    : fanfic.totalChapters ? `/${fanfic.totalChapters} cap.` : null;

  return (
    <div className="fanfic-card">
      <div className={`card-spine ${spineClass}`} />
      <div className="card-body">
        <div className="card-header">
          <h3 className="card-title">
            {fanfic.link
              ? <a href={fanfic.link} target="_blank" rel="noopener noreferrer">{fanfic.title}</a>
              : fanfic.title}
          </h3>
          <div className="card-badges">
            <span className={`badge ${siteBadgeClass}`}>{siteLabel}</span>
            <span className={`badge ${fanfic.complete ? 'badge-complete' : 'badge-incomplete'}`}>
              {fanfic.complete ? 'Completa' : 'Em andamento'}
            </span>
          </div>
        </div>

        {fanfic.author && (
          <p className="card-author">por <span>{fanfic.author}</span></p>
        )}

        {chaptersText && (
          <div className="card-meta">
            <span className="card-meta-item">📖 {chaptersText}</span>
          </div>
        )}

        {fanfic.status === 'read' && fanfic.rating > 0 && (
          <div className="card-rating">
            <Stars rating={fanfic.rating} />
            <span className="rating-num">{fanfic.rating}/10</span>
          </div>
        )}

        {fanfic.summary && (
          <p className="card-summary">{fanfic.summary}</p>
        )}

        <div className="card-actions">
          {fanfic.status === 'want' && (
            <button className="action-btn btn-read" onClick={() => onMarkRead(fanfic)}>
              ✓ Marcar lida
            </button>
          )}
          <button className="action-btn btn-edit" onClick={() => onEdit(fanfic)}>
            ✏️ Editar
          </button>
          <button className="action-btn btn-delete" onClick={() => onDelete(fanfic.id)}>
            🗑️ Remover
          </button>
        </div>
      </div>
    </div>
  );
}
