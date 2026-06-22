import { useState, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFanfics } from './hooks/useFanfics';
import FanficCard from './components/FanficCard';
import FanficModal from './components/FanficModal';
import MarkReadModal from './components/MarkReadModal';
import AuthorModal from './components/AuthorModal';
import AuthorModal from './components/AuthorModal';
import './styles/main.css';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const STATUS_LABEL = { want: 'Quero ler', reading: 'Lendo', read: 'Lida' };

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { fanfics, loading, addFanfic, updateFanfic, deleteFanfic, markAsRead } = useFanfics(user?.uid);

  const [activeTab, setActiveTab] = useState('want');
  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [authorFilter, setAuthorFilter] = useState(null);

  const sorted = (list) => [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));

  // Global search across all tabs
  const globalResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    return sorted(fanfics.filter(f =>
      f.title?.toLowerCase().includes(q) ||
      f.author?.toLowerCase().includes(q) ||
      f.series?.toLowerCase().includes(q)
    ));
  }, [fanfics, globalSearch]);

  const filtered = useMemo(() => {
    let list = fanfics.filter(f => f.status === activeTab);
    if (activeTab === 'want') {
      if (subTab === 'complete') list = list.filter(f => f.complete);
      if (subTab === 'incomplete') list = list.filter(f => !f.complete);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.title?.toLowerCase().includes(q) ||
        f.author?.toLowerCase().includes(q) ||
        f.series?.toLowerCase().includes(q)
      );
    }
    return sorted(list);
  }, [fanfics, activeTab, subTab, search]);

  const counts = useMemo(() => ({
    want: fanfics.filter(f => f.status === 'want').length,
    reading: fanfics.filter(f => f.status === 'reading').length,
    read: fanfics.filter(f => f.status === 'read').length,
    wantComplete: fanfics.filter(f => f.status === 'want' && f.complete).length,
    wantIncomplete: fanfics.filter(f => f.status === 'want' && !f.complete).length,
  }), [fanfics]);

  if (authLoading) return <div className="loading">Carregando...</div>;

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">📚 FicShelf</div>
          <p className="login-tagline">Sua estante particular de fanfics</p>
          <button className="login-btn" onClick={login}>
            <GoogleIcon /> Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (form) => {
    if (form.id) {
      await updateFanfic(form.id, form);
    } else {
      await addFanfic(form);
    }
    setModal(null);
  };

  const handleMarkRead = async (rating, summary) => {
    await markAsRead(modal.fanfic.id, rating, summary);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remover esta fanfic?')) await deleteFanfic(id);
  };

  const isGlobalSearching = globalSearch.trim().length > 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-logo">📚 FicShelf</div>
        <div className="topbar-center">
          <div className="global-search-wrap">
            <span className="global-search-icon">🔍</span>
            <input
              className="global-search-input"
              placeholder="Buscar em todas as fics..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
            />
            {globalSearch && (
              <button className="global-search-clear" onClick={() => setGlobalSearch('')}>✕</button>
            )}
          </div>
        </div>
        <div className="topbar-right">
          {user.photoURL && <img className="user-avatar" src={user.photoURL} alt="" />}
          <span className="user-name">{user.displayName?.split(' ')[0]}</span>
          <button className="logout-btn" onClick={logout}>Sair</button>
        </div>
      </header>

      {/* Global search results panel */}
      {isGlobalSearching && (
        <div className="global-results-panel">
          <div className="global-results-header">
            {globalResults.length === 0
              ? `Nenhuma fanfic encontrada para "${globalSearch}"`
              : `${globalResults.length} fanfic${globalResults.length > 1 ? 's' : ''} encontrada${globalResults.length > 1 ? 's' : ''} em toda a estante`}
          </div>
          {globalResults.length > 0 && (
            <div className="global-results-list">
              {globalResults.map(f => (
                <div key={f.id} className="global-result-item">
                  <div className="global-result-info">
                    <span className="global-result-title">
                      {f.link
                        ? <a href={f.link} target="_blank" rel="noopener noreferrer">{f.title}</a>
                        : f.title}
                    </span>
                    {f.author && <span className="global-result-author">por {f.author}</span>}
                  </div>
                  <div className="global-result-tags">
                    <span className={`badge badge-${f.site === 'ao3' ? 'ao3' : f.site === 'wattpad' ? 'wattpad' : 'other'}`}>
                      {f.site === 'ao3' ? 'AO3' : f.site === 'wattpad' ? 'Wattpad' : 'Outro'}
                    </span>
                    <span className="badge badge-status">
                      {STATUS_LABEL[f.status] || f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="tabs-container">
        <button className={`tab-btn ${activeTab === 'want' ? 'active' : ''}`}
          onClick={() => { setActiveTab('want'); setSubTab('all'); }}>
          Quero ler <span className="count">{counts.want}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'reading' ? 'active' : ''}`}
          onClick={() => setActiveTab('reading')}>
          Lendo <span className="count">{counts.reading}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'read' ? 'active' : ''}`}
          onClick={() => setActiveTab('read')}>
          Lidas <span className="count">{counts.read}</span>
        </button>
      </nav>

      <main className="main">
        {activeTab === 'want' && (
          <div className="subtabs">
            <button className={`subtab-btn ${subTab === 'all' ? 'active' : ''}`} onClick={() => setSubTab('all')}>
              Todas ({counts.want})
            </button>
            <button className={`subtab-btn ${subTab === 'complete' ? 'active' : ''}`} onClick={() => setSubTab('complete')}>
              ✅ Completas ({counts.wantComplete})
            </button>
            <button className={`subtab-btn ${subTab === 'incomplete' ? 'active' : ''}`} onClick={() => setSubTab('incomplete')}>
              🔄 Em andamento ({counts.wantIncomplete})
            </button>
          </div>
        )}

        <div className="toolbar">
          <div className="toolbar-left">
            <input className="search-input"
              placeholder="Filtrar nesta aba..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="add-btn" onClick={() => setModal({ type: 'add', defaultStatus: activeTab })}>
            + Adicionar fanfic
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray)' }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3 className="empty-title">
              {search ? 'Nenhuma fanfic encontrada' : activeTab === 'want' ? 'Sua lista está vazia' : activeTab === 'reading' ? 'Nenhuma fic em andamento' : 'Nenhuma fanfic lida ainda'}
            </h3>
            <p className="empty-text">
              {search ? 'Tente outro termo.' : 'Clique em "+ Adicionar fanfic" para começar!'}
            </p>
          </div>
        ) : (
          <div className="cards-grid">
            {filtered.map(f => (
              <FanficCard key={f.id} fanfic={f}
                onEdit={fanfic => setModal({ type: 'edit', fanfic })}
                onDelete={handleDelete}
                onMarkRead={fanfic => setModal({ type: 'markRead', fanfic })}
                onStartReading={async (fanfic) => await updateFanfic(fanfic.id, { status: 'reading' })}
                onMarkWant={async (fanfic) => await updateFanfic(fanfic.id, { status: 'want' })}
                onAuthorClick={(name) => setAuthorFilter(name)}
              />
            ))}
          </div>
        )}
      </main>

      {modal?.type === 'add' && (
        <FanficModal
          defaultStatus={modal.defaultStatus}
          allFanfics={fanfics}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'edit' && (
        <FanficModal
          fanfic={modal.fanfic}
          allFanfics={fanfics}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'markRead' && (
      {authorFilter && (
        <AuthorModal
          author={authorFilter}
          fanfics={fanfics.filter(f => f.author?.toLowerCase() === authorFilter.toLowerCase())}
          onClose={() => setAuthorFilter(null)}
        />
      )}
        <MarkReadModal fanfic={modal.fanfic} onConfirm={handleMarkRead} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
