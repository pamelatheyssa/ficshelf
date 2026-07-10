import { useState } from 'react';
import { exportToExcel } from '../lib/exportExcel';

function TopList({ title, items, icon }) {
  if (!items.length) return null;
  return (
    <div className="stats-top-list">
      <h3 className="stats-section-title">{icon} {title}</h3>
      {items.map((item, i) => (
        <div key={item.name} className="stats-top-item">
          <span className="stats-top-rank">#{i + 1}</span>
          <span className="stats-top-name">{item.name}</span>
          <span className="stats-top-count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityCalendar({ fanfics }) {
  const readDates = fanfics
    .filter(f => f.status === 'read' && f.readDate)
    .reduce((acc, f) => { acc[f.readDate] = (acc[f.readDate] || 0) + 1; return acc; }, {});

  // Last 12 weeks
  const today = new Date();
  const weeks = [];
  for (let w = 11; w >= 0; w--) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (6 - d)));
      const key = date.toISOString().split('T')[0];
      days.push({ key, count: readDates[key] || 0, date });
    }
    weeks.push(days);
  }

  return (
    <div className="stats-calendar">
      <h3 className="stats-section-title">📅 Atividade de leitura (12 semanas)</h3>
      <div className="calendar-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="cal-week">
            {week.map(day => (
              <div key={day.key}
                className={`cal-day ${day.count > 0 ? 'cal-active' : ''}`}
                style={{ opacity: day.count > 0 ? Math.min(0.3 + day.count * 0.35, 1) : 0.12 }}
                title={day.count > 0 ? `${day.key}: ${day.count} fic${day.count > 1 ? 's' : ''}` : day.key}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="cal-legend">Cada quadrado = 1 dia. Mais escuro = mais fics lidas.</p>
    </div>
  );
}

export default function StatsPanel({ fanfics, shelves = [] }) {
  const [exporting, setExporting] = useState(false);
  const [favoriteAuthors, setFavoriteAuthors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ficshelf_fav_authors') || '[]'); } catch { return []; }
  });
  const [newFavAuthor, setNewFavAuthor] = useState('');

  const saveFavAuthors = (list) => {
    setFavoriteAuthors(list);
    localStorage.setItem('ficshelf_fav_authors', JSON.stringify(list));
  };

  const addFavAuthor = () => {
    const name = newFavAuthor.trim();
    if (name && !favoriteAuthors.includes(name)) saveFavAuthors([...favoriteAuthors, name]);
    setNewFavAuthor('');
  };

  const removeFavAuthor = (name) => saveFavAuthors(favoriteAuthors.filter(a => a !== name));

  const readFics = fanfics.filter(f => f.status === 'read');
  const totalWords = readFics.reduce((sum, f) => sum + (Number(f.wordCount) || 0), 0);
  const totalHours = totalWords / 2600 * 0.25;
  const favorites = fanfics.filter(f => f.favorite).length;

  // Top ships
  const shipCount = {};
  fanfics.forEach(f => (f.ships || []).forEach(s => { shipCount[s] = (shipCount[s] || 0) + 1; }));
  const topShips = Object.entries(shipCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Top tags
  const tagCount = {};
  fanfics.forEach(f => (f.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Top fandoms
  const fandomCount = {};
  fanfics.forEach(f => { if (f.fandom) fandomCount[f.fandom] = (fandomCount[f.fandom] || 0) + 1; });
  const topFandoms = Object.entries(fandomCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const ao3Count = fanfics.filter(f => f.site === 'ao3').length;
  const wattpadCount = fanfics.filter(f => f.site === 'wattpad').length;

  const handleExport = async () => {
    setExporting(true);
    try { await exportToExcel(fanfics, shelves); }
    catch (e) { alert('Erro ao exportar: ' + e.message); }
    finally { setExporting(false); }
  };

  const statCards = [
    { label: 'Total na estante', value: fanfics.length, icon: '📚', color: 'var(--lilac)' },
    { label: 'Fics lidas', value: readFics.length, icon: '✅', color: 'var(--success)' },
    { label: 'Favoritas', value: favorites, icon: '★', color: 'var(--gold)' },
    { label: 'Palavras lidas', value: totalWords > 0 ? Number(totalWords).toLocaleString('pt-BR') : '—', icon: '✍️', color: 'var(--blue)' },
    { label: 'Horas de leitura', value: totalHours > 0 ? `~${totalHours.toFixed(1)}h` : '—', icon: '⏱', color: 'var(--gold)' },
  ];

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h2 className="stats-title">📊 Minha estante</h2>
        <button className="export-btn" onClick={handleExport} disabled={exporting}>
          {exporting ? '⏳ Exportando...' : '📥 Exportar para Excel'}
        </button>
      </div>

      {/* Cards */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {totalWords > 0 && <div className="stats-note">💡 Média de 15 min para cada 2.600 palavras</div>}

      {/* Calendário */}
      <ActivityCalendar fanfics={fanfics} />

      {/* Tops */}
      <div className="stats-tops">
        <TopList title="Top Ships" items={topShips} icon="⚓" />
        <TopList title="Top Tags" items={topTags} icon="🏷️" />
        <TopList title="Top Fandoms" items={topFandoms} icon="🎭" />
      </div>

      {/* Autores favoritos — manual */}
      <div className="stats-section">
        <h3 className="stats-section-title">★ Autores favoritos</h3>
        <div className="fav-authors-list">
          {favoriteAuthors.length === 0 && (
            <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>Nenhum autor favorito ainda.</p>
          )}
          {favoriteAuthors.map(a => (
            <div key={a} className="fav-author-item">
              <span>{a}</span>
              <button onClick={() => removeFavAuthor(a)}>✕</button>
            </div>
          ))}
        </div>
        <div className="fav-author-add">
          <input className="form-input" value={newFavAuthor}
            onChange={e => setNewFavAuthor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addFavAuthor()}
            placeholder="Nome do autor..." />
          <button className="btn-save" onClick={addFavAuthor}>Adicionar</button>
        </div>
      </div>

      {/* Plataformas */}
      <div className="stats-platforms">
        <div className="platform-bar-label">
          <span className="badge badge-ao3">AO3</span>
          <span>{ao3Count} fic{ao3Count !== 1 ? 's' : ''}</span>
        </div>
        <div className="platform-bar-track">
          <div className="platform-bar-fill fill-ao3"
            style={{ width: fanfics.length > 0 ? `${(ao3Count / fanfics.length) * 100}%` : '0%' }} />
        </div>
        <div className="platform-bar-label">
          <span className="badge badge-wattpad">Wattpad</span>
          <span>{wattpadCount} fic{wattpadCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="platform-bar-track">
          <div className="platform-bar-fill fill-wattpad"
            style={{ width: fanfics.length > 0 ? `${(wattpadCount / fanfics.length) * 100}%` : '0%' }} />
        </div>
      </div>
    </div>
  );
}
