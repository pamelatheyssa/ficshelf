import { getFicCategory } from '../lib/ficUtils';

function Stars({ rating }) {
  const r = Number(rating);
  if (!r || r <= 0) return null;
  const full = Math.round(r / 2);
  const empty = 5 - full;
  return (
    <span className="rating-stars">
      {'★'.repeat(Math.max(0, full))}{'☆'.repeat(Math.max(0, empty))}
    </span>
  );
}

function ChaptersDisplay({ fanfic }) {
  const { chapters, totalChapters, totalChaptersUnknown } = fanfic;
  if (!chapters && !totalChapters && !totalChaptersUnknown) return null;
  const total = totalChaptersUnknown ? '?' : (totalChapters || '?');
  const text = chapters && (totalChapters || totalChaptersUnknown)
    ? `${chapters}/${total} cap.`
    : chapters ? `${chapters} cap.` : `/${total} cap.`;
  return <span className="card-meta-item">📖 {text}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const READ_ON_LABEL = { phone: '📱', kindle: '📕' };

export default function FanficCard({ fanfic, allShelves = [], onEdit, onDelete, onMarkRead, onStartReading, onMarkWant, onAuthorClick }) {
  const spineClass = `spine-${fanfic.site === 'ao3' ? 'ao3' : fanfic.site === 'wattpad' ? 'wattpad' : 'other'}`;
  const siteBadgeClass = `badge-${fanfic.site === 'ao3' ? 'ao3' : fanfic.site === 'wattpad' ? 'wattpad' : 'other'}`;
  const siteLabel = fanfic.site === 'ao3' ? 'AO3' : fanfic.site === 'wattpad' ? 'Wattpad' : 'Outro';
  const category = getFicCategory(fanfic);
  const readingHours = fanfic.wordCount ? (fanfic.wordCount / 2600 * 0.25).toFixed(1) : null;
  const showSeriesWarning = fanfic.complete && fanfic._seriesHasIncomplete;
  const ficShelves = allShelves.filter(s => (fanfic.shelves || []).includes(s.id));

  return (
    <div className={`fanfic-card ${fanfic.favorite ? 'card-favorite' : ''}`}>
      <div className={`card-spine ${spineClass}`} />
      <div className="card-body">

        {/* Header */}
        <div className="card-header">
          <h3 className="card-title">
            {fanfic.favorite && <span className="fav-star">★</span>}
            {fanfic.link
              ? <a href={fanfic.link} target="_blank" rel="noopener noreferrer">{fanfic.title}</a>
              : fanfic.title}
          </h3>
          <div className="card-badges">
            <span className={`badge ${siteBadgeClass}`}>{siteLabel}</span>
            <span className={`badge ${fanfic.complete ? 'badge-complete' : 'badge-incomplete'}`}>
              {fanfic.complete ? 'Completa' : 'Em andamento'}
            </span>
            {fanfic.readOn && <span className="badge badge-device">{READ_ON_LABEL[fanfic.readOn]}</span>}
          </div>
        </div>

        {/* Autor */}
        {fanfic.author && (
          <p className="card-author">
            por <button className="author-link" onClick={() => onAuthorClick(fanfic.author)}>{fanfic.author}</button>
          </p>
        )}

        {/* Série */}
        {fanfic.series && (
          <p className="card-series">
            📚 {fanfic.series}{fanfic.seriesPart ? ` — Parte ${fanfic.seriesPart}` : ''}
          </p>
        )}

        {/* Aviso série incompleta */}
        {showSeriesWarning && (
          <div className="series-warning">⚠️ Série com partes ainda em andamento</div>
        )}

        {/* Shelves — mantidas no card pois são organização visual */}
        {ficShelves.length > 0 && (
          <div className="card-chips">
            {ficShelves.map(s => (
              <span key={s.id} className="chip chip-shelf" style={{ '--shelf-color': s.color }}>
                🗂️ {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta: capítulos, tamanho, palavras, dispositivo */}
        <div className="card-meta">
          <ChaptersDisplay fanfic={fanfic} />
          {category && (
            <span className="card-meta-item card-category" style={{ color: category.color }}>
              {category.label}
            </span>
          )}
          {fanfic.wordCount > 0 && (
            <span className="card-meta-item">✍️ {Number(fanfic.wordCount).toLocaleString('pt-BR')}</span>
          )}
        </div>

        {/* Data lida + horas */}
        {(fanfic.readDate || readingHours) && (
          <div className="card-read-info">
            {fanfic.readDate && <span>📅 {formatDate(fanfic.readDate)}</span>}
            {readingHours && <span>⏱ ~{readingHours}h</span>}
          </div>
        )}

        {/* Nota — só para lidas */}
        {fanfic.status === 'read' && fanfic.rating > 0 && (
          <div className="card-rating">
            <Stars rating={fanfic.rating} />
            <span className="rating-num">{fanfic.rating}/10</span>
          </div>
        )}

        {/* Mini resumo */}
        {fanfic.miniSummary && <p className="card-mini-summary">{fanfic.miniSummary}</p>}

        {/* Resumo de lidas */}
        {fanfic.summary && <p className="card-summary">{fanfic.summary}</p>}

        {/* Motivo não quero */}
        {fanfic.status === 'skip' && fanfic.skipReason && (
          <p className="card-skip-reason">🚫 {fanfic.skipReason}</p>
        )}

        {/* Ações */}
        <div className="card-actions">
          {fanfic.status === 'want' && (
            <button className="action-btn btn-reading" onClick={() => onStartReading(fanfic)}>📖 Começar</button>
          )}
          {(fanfic.status === 'want' || fanfic.status === 'reading') && (
            <button className="action-btn btn-read" onClick={() => onMarkRead(fanfic)}>✓ Marcar lida</button>
          )}
          {fanfic.status === 'reading' && (
            <button className="action-btn btn-want" onClick={() => onMarkWant(fanfic)}>↩ Quero ler</button>
          )}
          <button className="action-btn btn-edit" onClick={() => onEdit(fanfic)}>✏️ Editar</button>
          <button className="action-btn btn-delete" onClick={() => onDelete(fanfic.id)}>🗑️</button>
        </div>
      </div>
    </div>
  );
}
