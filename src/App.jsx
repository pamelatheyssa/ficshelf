import { useState, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFanfics } from './hooks/useFanfics';
import { useShelves } from './hooks/useShelves';
import FanficCard from './components/FanficCard';
import FanficModal from './components/FanficModal';
import MarkReadModal from './components/MarkReadModal';
import AuthorModal from './components/AuthorModal';
import StatsPanel from './components/StatsPanel';
import ShelvesModal from './components/ShelvesModal';
import { fuzzyMatch, getFicCategory } from './lib/ficUtils';
import './styles/main.css';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.09 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const STATUS_LABEL = { want: 'Quero ler', reading: 'Lendo', read: 'Lida', skip: 'Não quero ler' };
const SIZE_OPTIONS = [
  { value: '', label: 'Qualquer tamanho' },
  { value: 'Curta', label: 'Curta (até 5 cap.)' },
  { value: 'Média', label: 'Média (6–15 cap.)' },
  { value: 'Longa', label: 'Longa (16–30 cap.)' },
  { value: 'Super longa', label: 'Super longa (31–70 cap.)' },
  { value: 'Hiper longa', label: 'Hiper longa (71+ cap.)' },
];

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { fanfics, loading, addFanfic, updateFanfic, deleteFanfic, markAsRead } = useFanfics(user?.uid);
  const { shelves, addShelf, updateShelf, deleteShelf } = useShelves(user?.uid);

  const [activeTab, setActiveTab] = useState('want');
  const [subTab, setSubTab] = useState('all');
  const [activeShelf, setActiveShelf] = useState(null);
  const [search, setSearch] = useState('');
  const [summarySearch, setSummarySearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [shipFilter, setShipFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [authorFilter, setAuthorFilter] = useState(null);
  const [showShelves, setShowShelves] = useState(false);

  const sorted = (list) => [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));

  const seriesIncompleteMap = useMemo(() => {
    const map = {};
    fanfics.forEach(f => { if (f.series && !f.complete) map[f.series.toLowerCase()] = true; });
    return map;
  }, [fanfics]);

  const enriched = useMemo(() =>
    fanfics.map(f => ({ ...f, _seriesHasIncomplete: f.series ? !!seriesIncompleteMap[f.series.toLowerCase()] : false })),
    [fanfics, seriesIncompleteMap]
  );

  const globalResults = useMemo(() => {
    const q = globalSearch.trim();
    if (!q) return [];
    return sorted(enriched.filter(f =>
      fuzzyMatch(f.title, q) || fuzzyMatch(f.author, q) ||
      fuzzyMatch(f.series, q) || fuzzyMatch(f.fandom, q) ||
      f.ships?.some(s => fuzzyMatch(s, q)) || f.tags?.some(t => fuzzyMatch(t, q))
    ));
  }, [enriched, globalSearch]);

  const filtered = useMemo(() => {
    if (activeTab === 'stats') return [];
    let list = enriched.filter(f => f.status === activeTab);

    if (activeTab === 'want') {
      if (subTab === 'complete') list = list.filter(f => f.complete);
      if (subTab === 'incomplete') list = list.filter(f => !f.complete);
      if (subTab === 'fav') list = list.filter(f => f.favorite);
    }
    if (activeTab === 'read' && subTab === 'fav') list = list.filter(f => f.favorite);

    if (activeShelf) list = list.filter(f => (f.shelves || []).includes(activeShelf));
    if (tagFilter) list = list.filter(f => f.tags?.some(t => fuzzyMatch(t, tagFilter)));
    if (shipFilter) list = list.filter(f => f.ships?.some(s => fuzzyMatch(s, shipFilter)));
    if (sizeFilter) list = list.filter(f => getFicCategory(f)?.label === sizeFilter);

    if (search.trim()) {
      const q = search.trim();
      list = list.filter(f =>
        fuzzyMatch(f.title, q) || fuzzyMatch(f.author, q) || fuzzyMatch(f.series, q) || fuzzyMatch(f.fandom, q)
      );
    }
    if (summarySearch.trim()) {
      const q = summarySearch.trim();
      list = list.filter(f =>
        fuzzyMatch(f.miniSummary, q) || fuzzyMatch(f.summary, q) || fuzzyMatch(f.skipReason, q)
      );
    }

    return sorted(list);
  }, [enriched, activeTab, subTab, activeShelf, search, summarySearch, tagFilter, shipFilter, sizeFilter]);

  const counts = useMemo(() => ({
    want: fanfics.filter(f => f.status === 'want').length,
    reading: fanfics.filter(f => f.status === 'reading').length,
    read: fanfics.filter(f => f.status === 'read').length,
    skip: fanfics.filter(f => f.status === 'skip').length,
    wantComplete: fanfics.filter(f => f.status === 'want' && f.complete).length,
    wantIncomplete: fanfics.filter(f => f.status === 'want' && !f.complete).length,
    wantFav: fanfics.filter(f => f.status === 'want' && f.favorite).length,
    readFav: fanfics.filter(f => f.status === 'read' && f.favorite).length,
  }), [fanfics]);

  if (authLoading) return <div className="loading">Carregando...</div>;

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">📚 FicShelf</div>
          <p className="login-tagline">Sua estante particular de fanfics</p>
          <button className="login-btn" onClick={login}><GoogleIcon /> Entrar com Google</button>
        </div>
      </div>
    );
  }

  const handleSave = async (form) => {
    if (form.id) await updateFanfic(form.id, form);
    else await addFanfic(form);
    setModal(null);
  };

  const handleMarkRead = async (rating, summary, wordCount, readDate, chapData, favorite) => {
    await markAsRead(modal.fanfic.id, rating, summary, wordCount, readDate, chapData, favorite);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remover esta fanfic?')) await deleteFanfic(id);
  };

  const clearFilters = () => { setTagFilter(''); setShipFilter(''); setActiveShelf(null); setSizeFilter(''); };
  const hasActiveFilter = tagFilter || shipFilter || activeShelf || sizeFilter;
  const isGlobalSearching = globalSearch.trim().length > 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-logo">📚 FicShelf</div>
        <div className="topbar-center">
          <div className="global-search-wrap">
            <span className="global-search-icon">🔍</span>
            <input className="global-search-input"
              placeholder="Buscar título, autor, tag, ship..."
              value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
            {globalSearch && <button className="global-search-clear" onClick={() => setGlobalSearch('')}>✕</button>}
          </div>
        </div>
        <div className="topbar-right">
          <button className="shelf-mgr-btn" onClick={() => setShowShelves(true)} title="Gerenciar Shelves">🗂️</button>
          {user.photoURL && <img className="user-avatar" src={user.photoURL} alt="" />}
          <span className="user-name">{user.displayName?.split(' ')[0]}</span>
          <button className="logout-btn" onClick={logout}>Sair</button>
        </div>
      </header>

      {isGlobalSearching && (
        <div className="global-results-panel">
          <div className="global-results-header">
            {globalResults.length === 0
              ? `Nenhuma fanfic encontrada para "${globalSearch}"`
              : `${globalResults.length} fanfic${globalResults.length > 1 ? 's' : ''} encontrada${globalResults.length > 1 ? 's' : ''}`}
          </div>
          {globalResults.length > 0 && (
            <div className="global-results-list">
              {globalResults.map(f => (
                <div key={f.id} className="global-result-item">
                  <div className="global-result-info">
                    <span className="global-result-title">
                      {f.favorite && <span style={{ color: 'var(--gold)' }}>★ </span>}
                      {f.link ? <a href={f.link} target="_blank" rel="noopener noreferrer">{f.title}</a> : f.title}
                    </span>
                    {f.author && (
                      <button className="global-result-author-btn"
                        onClick={() => { setGlobalSearch(''); setAuthorFilter(f.author); }}>
                        por {f.author}
                      </button>
                    )}
                    {f.fandom && <span className="global-result-mini">🎭 {f.fandom}</span>}
                  </div>
                  <div className="global-result-tags">
                    <span className={`badge badge-${f.site === 'ao3' ? 'ao3' : f.site === 'wattpad' ? 'wattpad' : 'other'}`}>
                      {f.site === 'ao3' ? 'AO3' : f.site === 'wattpad' ? 'Wattpad' : 'Outro'}
                    </span>
                    <span className="badge badge-status">{STATUS_LABEL[f.status] || f.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="tabs-container">
        {[
          { key: 'want', label: 'Quero ler', count: counts.want },
          { key: 'reading', label: 'Lendo', count: counts.reading },
          { key: 'read', label: 'Lidas', count: counts.read },
          { key: 'skip', label: 'Não quero ler', count: counts.skip },
          { key: 'stats', label: '📊 Perfil', count: null },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.key); setSubTab('all'); setSearch(''); setSummarySearch(''); clearFilters(); }}>
            {t.label} {t.count !== null && <span className="count">{t.count}</span>}
          </button>
        ))}
      </nav>

      <main className="main">
        {activeTab === 'stats' ? (
          <StatsPanel fanfics={fanfics} shelves={shelves} />
        ) : (
          <div className="main-layout">
            {shelves.length > 0 && (
              <aside className="shelves-sidebar">
                <p className="sidebar-title">Shelves</p>
                <button className={`sidebar-shelf-btn ${!activeShelf ? 'active' : ''}`} onClick={() => setActiveShelf(null)}>
                  📚 Todas
                </button>
                {shelves.map(s => (
                  <button key={s.id}
                    className={`sidebar-shelf-btn ${activeShelf === s.id ? 'active' : ''}`}
                    style={{ '--shelf-color': s.color }}
                    onClick={() => setActiveShelf(activeShelf === s.id ? null : s.id)}>
                    <span className="sidebar-dot" style={{ background: s.color }} />
                    {s.name}
                  </button>
                ))}
              </aside>
            )}

            <div className="main-content">
              {activeTab === 'want' && (
                <div className="subtabs">
                  <button className={`subtab-btn ${subTab === 'all' ? 'active' : ''}`} onClick={() => setSubTab('all')}>Todas ({counts.want})</button>
                  <button className={`subtab-btn ${subTab === 'complete' ? 'active' : ''}`} onClick={() => setSubTab('complete')}>✅ Completas ({counts.wantComplete})</button>
                  <button className={`subtab-btn ${subTab === 'incomplete' ? 'active' : ''}`} onClick={() => setSubTab('incomplete')}>🔄 Em andamento ({counts.wantIncomplete})</button>
                  <button className={`subtab-btn ${subTab === 'fav' ? 'active' : ''}`} onClick={() => setSubTab('fav')}>★ Favoritas ({counts.wantFav})</button>
                </div>
              )}
              {activeTab === 'read' && (
                <div className="subtabs">
                  <button className={`subtab-btn ${subTab === 'all' ? 'active' : ''}`} onClick={() => setSubTab('all')}>Todas ({counts.read})</button>
                  <button className={`subtab-btn ${subTab === 'fav' ? 'active' : ''}`} onClick={() => setSubTab('fav')}>★ Favoritas ({counts.readFav})</button>
                </div>
              )}

              <div className="toolbar">
                <div className="toolbar-left">
                  <div className="search-wrap">
                    <span className="search-icon">🔎</span>
                    <input className="search-input" placeholder="Título, autor, série..."
                      value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
                  </div>
                  <div className="search-wrap">
                    <span className="search-icon">📝</span>
                    <input className="search-input" placeholder="Buscar nos resumos..."
                      value={summarySearch} onChange={e => setSummarySearch(e.target.value)} />
                    {summarySearch && <button className="search-clear" onClick={() => setSummarySearch('')}>✕</button>}
                  </div>
                  <select className="size-filter-select"
                    value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}>
                    {SIZE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <button className="add-btn" onClick={() => setModal({ type: 'add', defaultStatus: activeTab })}>
                  + Adicionar fanfic
                </button>
              </div>

              {hasActiveFilter && (
                <div className="active-filters">
                  {tagFilter && <span className="filter-chip">🏷️ {tagFilter} <button onClick={() => setTagFilter('')}>✕</button></span>}
                  {shipFilter && <span className="filter-chip">⚓ {shipFilter} <button onClick={() => setShipFilter('')}>✕</button></span>}
                  {sizeFilter && <span className="filter-chip">📏 {sizeFilter} <button onClick={() => setSizeFilter('')}>✕</button></span>}
                  {activeShelf && (
                    <span className="filter-chip">
                      🗂️ {shelves.find(s => s.id === activeShelf)?.name}
                      <button onClick={() => setActiveShelf(null)}>✕</button>
                    </span>
                  )}
                  <button className="clear-filters-btn" onClick={clearFilters}>Limpar filtros</button>
                </div>
              )}

              {(search || summarySearch) && (
                <div className="filter-info">
                  {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                  {search && <span> para "<strong>{search}</strong>"</span>}
                  {summarySearch && <span> nos resumos com "<strong>{summarySearch}</strong>"</span>}
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📖</div>
                  <h3 className="empty-title">
                    {search || summarySearch || hasActiveFilter ? 'Nenhuma fanfic encontrada'
                      : activeTab === 'want' ? 'Sua lista está vazia'
                      : activeTab === 'reading' ? 'Nenhuma fic em andamento'
                      : activeTab === 'skip' ? 'Nenhuma fic aqui'
                      : 'Nenhuma fanfic lida ainda'}
                  </h3>
                  <p className="empty-text">
                    {search || summarySearch || hasActiveFilter ? 'Tente outros termos ou limpe os filtros.' : 'Clique em "+ Adicionar fanfic" para começar!'}
                  </p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filtered.map(f => (
                    <FanficCard key={f.id} fanfic={f} allShelves={shelves}
                      onEdit={fanfic => setModal({ type: 'edit', fanfic })}
                      onDelete={handleDelete}
                      onMarkRead={fanfic => setModal({ type: 'markRead', fanfic })}
                      onStartReading={async (fanfic) => await updateFanfic(fanfic.id, { status: 'reading' })}
                      onMarkWant={async (fanfic) => await updateFanfic(fanfic.id, { status: 'want' })}
                      onAuthorClick={(name) => setAuthorFilter(name)}
                      onTagClick={(tag) => setTagFilter(tag)}
                      onShipClick={(ship) => setShipFilter(ship)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {modal?.type === 'add' && (
        <FanficModal defaultStatus={modal.defaultStatus} allFanfics={fanfics} allShelves={shelves}
          onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <FanficModal fanfic={modal.fanfic} allFanfics={fanfics} allShelves={shelves}
          onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'markRead' && (
        <MarkReadModal fanfic={modal.fanfic} allShelves={shelves}
          onConfirm={handleMarkRead} onClose={() => setModal(null)} />
      )}
      {authorFilter && (
        <AuthorModal author={authorFilter}
          fanfics={fanfics.filter(f => f.author?.toLowerCase() === authorFilter.toLowerCase())}
          onClose={() => setAuthorFilter(null)} />
      )}
      {showShelves && (
        <ShelvesModal shelves={shelves}
          onAdd={addShelf} onEdit={updateShelf} onDelete={deleteShelf}
          onClose={() => setShowShelves(false)} />
      )}
    </div>
  );
}
