function Stars({ rating }) {
  const full = Math.round(rating / 2);
  return (
    <span className="rating-stars">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

function ChaptersDisplay({ fanfic }) {
  const { chapters, totalChapters, totalChaptersUnknown } = fanfic;
  if (!chapters && !totalChapters && !totalChaptersUnknown) return null;
  const total = totalChaptersUnknown ? '?' : (totalChapters || '?');
  const text = chapters && (totalChapters || totalChaptersUnknown)
    ? `${chapters}/${total} cap.`
    : chapters ? `${chapters} cap.`
    : `/${total} cap.`;
  return <span className="card-meta-item">📖 {text}</span>;
}

export default function FanficCard({ fanfic, onEdit, onDelete, onMarkRead, onStartReading, onMarkWant, onAuthorClick }) {
  const spineClass = fanfic.site === 'ao3' ? 'spine-ao3'
    : fanfic.site === 'wattpad' ? 'spine-wattpad' : 'spine-other';
  const siteBadgeClass = fanfic.site === 'ao3' ? 'badge-ao3'
    : fanfic.site === 'wattpad' ? 'badge-wattpad' : 'badge-other';
  const siteLabel = fanfic.site === 'ao3' ? 'AO3'
    : fanfic.site === 'wattpad' ? 'Wattpad' : 'Outro';

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
          <p className="card-author">
            por{' '}
            <button className="author-link" onClick={() => onAuthorClick(fanfic.author)}>
              {fanfic.author}
            </button>
          </p>
        )}

        {fanfic.series && (
          <p className="card-series">
            📚 {fanfic.series}{fanfic.seriesPart ? ` — Parte ${fanfic.seriesPart}` : ''}
          </p>
        )}

        <div className="card-meta">
          <ChaptersDisplay fanfic={fanfic} />
        </div>

        {fanfic.status === 'read' && fanfic.rating > 0 && (
          <div className="card-rating">
            <Stars rating={fanfic.rating} />
            <span className="rating-num">{fanfic.rating}/10</span>
          </div>
        )}

        {fanfic.summary && <p className="card-summary">{fanfic.summary}</p>}

        <div className="card-actions">
          {fanfic.status === 'want' && (
            <button className="action-btn btn-reading" onClick={() => onStartReading(fanfic)}>
              📖 Começar
            </button>
          )}
          {(fanfic.status === 'want' || fanfic.status === 'reading') && (
            <button className="action-btn btn-read" onClick={() => onMarkRead(fanfic)}>
              ✓ Marcar lida
            </button>
          )}
          {fanfic.status === 'reading' && (
            <button className="action-btn btn-want" onClick={() => onMarkWant(fanfic)}>
              ↩ Quero ler
            </button>
          )}
          <button className="action-btn btn-edit" onClick={() => onEdit(fanfic)}>✏️ Editar</button>
          <button className="action-btn btn-delete" onClick={() => onDelete(fanfic.id)}>🗑️</button>
        </div>
      </div>
    </div>
  );
}
