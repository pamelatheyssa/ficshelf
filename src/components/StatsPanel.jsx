export default function StatsPanel({ fanfics }) {
  const readFics = fanfics.filter(f => f.status === 'read');
  const totalWords = readFics.reduce((sum, f) => sum + (Number(f.wordCount) || 0), 0);
  const totalHours = totalWords / 2600 * 0.25;
  const ficsWithWords = readFics.filter(f => f.wordCount > 0);
  const avgWords = ficsWithWords.length > 0
    ? Math.round(totalWords / ficsWithWords.length) : 0;

  // Most read author
  const authorCount = {};
  fanfics.forEach(f => {
    if (f.author) authorCount[f.author] = (authorCount[f.author] || 0) + 1;
  });
  const topAuthor = Object.entries(authorCount).sort((a, b) => b[1] - a[1])[0];

  // Fics by site
  const ao3Count = fanfics.filter(f => f.site === 'ao3').length;
  const wattpadCount = fanfics.filter(f => f.site === 'wattpad').length;

  const statCards = [
    { label: 'Total na estante', value: fanfics.length, icon: '📚', color: 'var(--lilac)' },
    { label: 'Fics lidas', value: readFics.length, icon: '✅', color: 'var(--success)' },
    { label: 'Palavras lidas', value: totalWords > 0 ? Number(totalWords).toLocaleString('pt-BR') : '—', icon: '✍️', color: 'var(--blue)' },
    { label: 'Horas de leitura', value: totalHours > 0 ? `~${totalHours.toFixed(1)}h` : '—', icon: '⏱', color: 'var(--gold)' },
    { label: 'Média por fic', value: avgWords > 0 ? Number(avgWords).toLocaleString('pt-BR') + ' palavras' : '—', icon: '📊', color: 'var(--lilac)' },
    { label: 'Autor favorito', value: topAuthor ? `${topAuthor[0]} (${topAuthor[1]})` : '—', icon: '✨', color: 'var(--rose)' },
  ];

  return (
    <div className="stats-panel">
      <h2 className="stats-title">📊 Minha estante</h2>

      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {totalWords > 0 && (
        <div className="stats-note">
          💡 Média de 15 min para cada 2.600 palavras
        </div>
      )}

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
