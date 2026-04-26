import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Zap, Clock, Calendar, Users, Briefcase, FileSpreadsheet, Settings,
  LogOut, Plus, Trash2, Copy, Check, Edit2, Download, X, AlertCircle, Lock
} from 'lucide-react';
import { db } from './lib/supabase.js';

// ===== CONFIG =====
const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'Futuro2026!';

// ===== UTILITIES =====
const generateToken = () =>
  Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateIT = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const monthLabel = (iso) => {
  if (!iso) return '';
  const [y, m] = iso.split('-');
  const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  return `${months[parseInt(m,10)-1]} ${y}`;
};

const calcOre = (oraInizio, oraFine, plusOne, commessa) => {
  if (commessa === 'Ferie' || commessa === 'Malattia') {
    return { lavorate: 0, permesso: 0 };
  }
  if (!oraInizio || !oraFine) return { lavorate: 0, permesso: 0 };
  const [h1, m1] = oraInizio.split(':').map(Number);
  const [h2, m2] = oraFine.split(':').map(Number);
  let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMin <= 0) return { lavorate: 0, permesso: 0 };
  let ore = diffMin / 60 - 1; // pausa obbligatoria 1h
  if (plusOne) ore += 1;
  if (ore < 0) ore = 0;
  const lavorate = Math.round(ore * 100) / 100;
  const permesso = lavorate < 8 ? Math.round((8 - lavorate) * 100) / 100 : 0;
  return { lavorate, permesso };
};

// ===== STYLES =====
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;500;600;700;800&display=swap');

  :root {
    --bg: #f4f1ea;
    --bg-grid: #e8e3d6;
    --ink: #0a0a0a;
    --ink-soft: #2a2a2a;
    --muted: #6b6b6b;
    --paper: #ffffff;
    --accent: #fbbf24;
    --accent-strong: #f59e0b;
    --danger: #dc2626;
    --success: #16a34a;
    --line: #0a0a0a;
  }

  * { box-sizing: border-box; }

  .app-root {
    font-family: 'Manrope', sans-serif;
    color: var(--ink);
    min-height: 100vh;
    background: var(--bg);
    background-image:
      linear-gradient(var(--bg-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--bg-grid) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  .display-font { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }
  .mono-font { font-family: 'JetBrains Mono', monospace; }

  .card {
    background: var(--paper);
    border: 2px solid var(--line);
    box-shadow: 6px 6px 0 var(--line);
    transition: all 0.15s ease;
  }
  .card-hover:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 var(--line);
  }

  .btn {
    font-family: 'Manrope', sans-serif;
    font-weight: 700;
    border: 2px solid var(--line);
    padding: 10px 18px;
    cursor: pointer;
    background: var(--paper);
    color: var(--ink);
    transition: all 0.12s ease;
    box-shadow: 4px 4px 0 var(--line);
    text-transform: uppercase;
    font-size: 13px;
    letter-spacing: 0.04em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--line); }
  .btn:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--line); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 4px 4px 0 var(--line); }
  .btn-primary { background: var(--accent); }
  .btn-primary:hover { background: var(--accent-strong); }
  .btn-dark { background: var(--ink); color: var(--paper); }
  .btn-dark:hover { background: var(--ink-soft); }
  .btn-danger { background: var(--danger); color: var(--paper); border-color: var(--ink); }
  .btn-ghost { background: transparent; box-shadow: none; border: 2px solid transparent; }
  .btn-ghost:hover { background: var(--paper); border-color: var(--line); box-shadow: 4px 4px 0 var(--line); }
  .btn-sm { padding: 6px 12px; font-size: 11px; }

  .input, .select {
    font-family: 'Manrope', sans-serif;
    font-size: 15px;
    padding: 12px 14px;
    border: 2px solid var(--line);
    background: var(--paper);
    width: 100%;
    color: var(--ink);
    outline: none;
    transition: box-shadow 0.12s ease;
  }
  .input:focus, .select:focus { box-shadow: 4px 4px 0 var(--accent); }
  .input.mono-input { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 18px; text-align: center; }

  .label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink);
    margin-bottom: 6px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border: 1.5px solid var(--line);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .tag-yellow { background: var(--accent); }
  .tag-dark { background: var(--ink); color: var(--paper); }

  .stripes {
    background: repeating-linear-gradient(
      45deg,
      var(--ink),
      var(--ink) 8px,
      var(--accent) 8px,
      var(--accent) 16px
    );
  }

  .checkbox-custom {
    width: 28px; height: 28px;
    border: 2px solid var(--line);
    background: var(--paper);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s ease;
    flex-shrink: 0;
  }
  .checkbox-custom.checked { background: var(--accent); }

  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1.5px solid var(--ink); font-size: 14px; }
  th { background: var(--ink); color: var(--paper); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
  tr:hover td { background: #fefbf3; }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(10, 10, 10, 0.6);
    z-index: 50;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .modal-content {
    background: var(--paper);
    border: 2px solid var(--line);
    box-shadow: 10px 10px 0 var(--line);
    max-width: 560px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .scrollbar-thin::-webkit-scrollbar { width: 10px; height: 10px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: var(--bg); }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--ink); }
`;

// ===== TOAST =====
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!message) return null;
  const bg = type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--ink)';
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, background: bg, color: '#fff', padding: '14px 20px', border: '2px solid var(--line)', boxShadow: '6px 6px 0 var(--line)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 400 }}>
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
}

// ===== APP =====
export default function App() {
  const [route, setRoute] = useState({ name: 'loading' });
  const [users, setUsers] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [reports, setReports] = useState([]);
  const [settings, setSettings] = useState({ company_name: 'Studio Elettrico', google_drive_folder_id: '' });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => setToast({ message, type, key: Date.now() });

  const refreshAll = async () => {
    try {
      const [u, c, r, s] = await Promise.all([
        db.users.list(),
        db.commesse.list(),
        db.reports.list(),
        db.settings.get(),
      ]);
      setUsers(u);
      setCommesse(c);
      setReports(r);
      setSettings(s);
    } catch (e) {
      console.error('Errore caricamento dati:', e);
      showToast('Errore di connessione al database', 'error');
    }
  };

  const refreshReports = async () => {
    try { setReports(await db.reports.list()); } catch (e) { console.error(e); }
  };

  // Boot + routing
  useEffect(() => {
    (async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#user/')) {
        const token = hash.slice(6);
        try {
          const user = await db.users.findByToken(token);
          if (user) {
            const [c, r, s] = await Promise.all([db.commesse.list(), db.reports.list(), db.settings.get()]);
            setCommesse(c); setReports(r); setSettings(s);
            setRoute({ name: 'user-form', user });
            return;
          }
        } catch (e) { console.error(e); }
        setRoute({ name: 'invalid-link' });
        return;
      }
      setRoute({ name: 'admin-login' });
    })();

    const onHashChange = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#user/')) {
        const token = hash.slice(6);
        try {
          const user = await db.users.findByToken(token);
          if (user) {
            const [c, r, s] = await Promise.all([db.commesse.list(), db.reports.list(), db.settings.get()]);
            setCommesse(c); setReports(r); setSettings(s);
            setRoute({ name: 'user-form', user });
          } else setRoute({ name: 'invalid-link' });
        } catch (e) { setRoute({ name: 'invalid-link' }); }
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route.name === 'loading') {
    return (
      <div className="app-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{styles}</style>
        <div className="display-font" style={{ fontSize: 32 }}>CARICAMENTO…</div>
      </div>
    );
  }

  if (route.name === 'invalid-link') return <InvalidLink />;

  if (route.name === 'admin-login') {
    return (
      <>
        <AdminLogin
          onSuccess={async () => { await refreshAll(); setRoute({ name: 'admin-dashboard' }); }}
          showToast={showToast}
        />
        {toast && <Toast key={toast.key} {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (route.name === 'admin-dashboard') {
    return (
      <>
        <AdminDashboard
          users={users} commesse={commesse} reports={reports} settings={settings}
          refreshAll={refreshAll}
          showToast={showToast}
          onLogout={() => setRoute({ name: 'admin-login' })}
        />
        {toast && <Toast key={toast.key} {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (route.name === 'user-form') {
    return (
      <>
        <UserForm
          user={route.user} commesse={commesse} reports={reports}
          refreshReports={refreshReports}
          showToast={showToast}
          companyName={settings.company_name}
        />
        {toast && <Toast key={toast.key} {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  return null;
}

// ===== INVALID LINK =====
function InvalidLink() {
  return (
    <div className="app-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{styles}</style>
      <div className="card" style={{ padding: 40, maxWidth: 480 }}>
        <div className="stripes" style={{ height: 8, marginBottom: 24, marginLeft: -40, marginRight: -40, marginTop: -40 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AlertCircle size={32} />
          <div className="display-font" style={{ fontSize: 36, lineHeight: 1 }}>LINK NON VALIDO</div>
        </div>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          Il collegamento che hai aperto non è valido o è stato revocato. Contatta il tuo amministratore per ricevere un nuovo link personale.
        </p>
      </div>
    </div>
  );
}

// ===== ADMIN LOGIN =====
function AdminLogin({ onSuccess, showToast }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      setBusy(true);
      await onSuccess();
      setBusy(false);
    } else {
      showToast('Credenziali non valide', 'error');
    }
  };

  return (
    <div className="app-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{styles}</style>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'var(--ink)', color: 'var(--accent)' }}>
            <Zap size={24} fill="currentColor" />
            <div className="display-font" style={{ fontSize: 28, lineHeight: 1 }}>RAPPORTINI</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--muted)' }}>
            SISTEMA · ORE LAVORATE · ELETTRICISTI
          </div>
        </div>

        <form onSubmit={submit} className="card" style={{ padding: 32, position: 'relative' }}>
          <div className="stripes" style={{ height: 6, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, marginTop: 8 }}>
            <Lock size={20} />
            <div className="display-font" style={{ fontSize: 26, lineHeight: 1 }}>ACCESSO AMMINISTRATORE</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Nome utente</label>
            <input className="input" value={u} onChange={(e) => setU(e.target.value)} autoFocus placeholder="Admin" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
            <Lock size={16} />
            {busy ? 'ACCESSO…' : 'ENTRA'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
          I dipendenti accedono dal proprio link personale fornito dall'amministratore.
        </div>
      </div>
    </div>
  );
}

// ===== ADMIN DASHBOARD =====
function AdminDashboard({ users, commesse, reports, settings, refreshAll, showToast, onLogout }) {
  const [tab, setTab] = useState('rapportini');

  const tabs = [
    { id: 'rapportini', label: 'Rapportini', icon: FileSpreadsheet },
    { id: 'dipendenti', label: 'Dipendenti', icon: Users },
    { id: 'commesse', label: 'Commesse', icon: Briefcase },
    { id: 'impostazioni', label: 'Impostazioni', icon: Settings },
  ];

  return (
    <div className="app-root">
      <style>{styles}</style>

      <header style={{ background: 'var(--ink)', color: 'var(--paper)', borderBottom: '4px solid var(--accent)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Zap size={26} fill="var(--accent)" color="var(--accent)" />
            <div>
              <div className="display-font" style={{ fontSize: 22, lineHeight: 1, color: 'var(--accent)' }}>RAPPORTINI</div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.7 }}>PANNELLO AMMINISTRATORE</div>
            </div>
          </div>
          <button onClick={onLogout} className="btn btn-sm" style={{ background: 'var(--accent)', color: 'var(--ink)' }}>
            <LogOut size={14} /> Esci
          </button>
        </div>
      </header>

      <nav style={{ background: 'var(--paper)', borderBottom: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  border: 'none',
                  padding: '14px 20px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  whiteSpace: 'nowrap',
                  borderRight: '2px solid var(--ink)',
                  borderLeft: active ? '2px solid var(--ink)' : 'none',
                }}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {tab === 'rapportini' && <ReportsTab reports={reports} users={users} commesse={commesse} refreshAll={refreshAll} showToast={showToast} />}
        {tab === 'dipendenti' && <UsersTab users={users} reports={reports} refreshAll={refreshAll} showToast={showToast} />}
        {tab === 'commesse' && <CommesseTab commesse={commesse} refreshAll={refreshAll} showToast={showToast} />}
        {tab === 'impostazioni' && <SettingsTab settings={settings} refreshAll={refreshAll} showToast={showToast} />}
      </main>

      <footer style={{ padding: '40px 24px', textAlign: 'center', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em' }}>
        ⚡ {settings.company_name?.toUpperCase()} · SISTEMA RAPPORTINI · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// ===== USERS TAB =====
function UsersTab({ users, reports, refreshAll, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!nome.trim() || !cognome.trim()) {
      showToast('Inserisci nome e cognome', 'error');
      return;
    }
    setBusy(true);
    try {
      await db.users.create({ nome: nome.trim(), cognome: cognome.trim(), token: generateToken() });
      await refreshAll();
      setNome(''); setCognome(''); setShowModal(false);
      showToast(`${nome.trim()} ${cognome.trim()} creato`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Errore creazione dipendente', 'error');
    }
    setBusy(false);
  };

  const handleDelete = async (user) => {
    setBusy(true);
    try {
      await db.users.delete(user.id);
      await refreshAll();
      setConfirmDelete(null);
      showToast(`${user.nome} ${user.cognome} eliminato`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Errore eliminazione', 'error');
    }
    setBusy(false);
  };

  const buildUserUrl = (token) => {
    const base = window.location.href.split('#')[0];
    return `${base}#user/${token}`;
  };

  const copyLink = async (token) => {
    try {
      await navigator.clipboard.writeText(buildUserUrl(token));
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      showToast('Link copiato', 'success');
    } catch {
      showToast('Impossibile copiare', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="display-font" style={{ fontSize: 42, lineHeight: 1 }}>DIPENDENTI</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{users.length} {users.length === 1 ? 'tecnico registrato' : 'tecnici registrati'}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nuovo dipendente
        </button>
      </div>

      {users.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <div className="display-font" style={{ fontSize: 24 }}>NESSUN DIPENDENTE</div>
          <div style={{ color: 'var(--muted)', marginTop: 8, marginBottom: 20 }}>Aggiungi il primo dipendente per iniziare</div>
          <button className="btn btn-dark" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Aggiungi dipendente
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {users.map(u => {
            const userReportCount = reports.filter(r => r.user_id === u.id).length;
            return (
              <div key={u.id} className="card card-hover" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div className="display-font" style={{ fontSize: 22, lineHeight: 1.1 }}>
                      {u.nome.toUpperCase()}<br />{u.cognome.toUpperCase()}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span className="tag tag-yellow">{userReportCount} rapportini</span>
                    </div>
                  </div>
                  <button className="btn-ghost btn btn-sm" onClick={() => setConfirmDelete(u)} title="Elimina">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="label" style={{ marginBottom: 4 }}>Link personale</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" readOnly value={buildUserUrl(u.token)} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '8px 10px' }} onClick={(e) => e.target.select()} />
                    <button className="btn btn-dark btn-sm" onClick={() => copyLink(u.token)} style={{ minWidth: 44, justifyContent: 'center' }}>
                      {copiedToken === u.token ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="stripes" style={{ height: 6 }} />
            <div style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="display-font" style={{ fontSize: 28 }}>NUOVO DIPENDENTE</div>
                <button className="btn-ghost btn btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="label">Nome</label>
                <input className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario" autoFocus />
              </div>
              <div style={{ marginBottom: 22 }}>
                <label className="label">Cognome</label>
                <input className="input" value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Rossi" onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setShowModal(false)}>Annulla</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={busy}>
                  <Plus size={14} /> {busy ? 'Creazione…' : 'Crea e genera link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="stripes" style={{ height: 6 }} />
            <div style={{ padding: 28 }}>
              <div className="display-font" style={{ fontSize: 28, marginBottom: 12 }}>ELIMINARE?</div>
              <p style={{ marginBottom: 20, lineHeight: 1.6 }}>
                Stai per eliminare <strong>{confirmDelete.nome} {confirmDelete.cognome}</strong> e tutti i suoi rapportini. Questa azione è irreversibile.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setConfirmDelete(null)}>Annulla</button>
                <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)} disabled={busy}>
                  <Trash2 size={14} /> {busy ? 'Eliminazione…' : 'Elimina'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== COMMESSE TAB =====
function CommesseTab({ commesse, refreshAll, showToast }) {
  const [nuova, setNuova] = useState('');
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [busy, setBusy] = useState(false);

  const addCommessa = async () => {
    const trimmed = nuova.trim();
    if (!trimmed) return;
    if (commesse.some(c => c.nome.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Commessa già esistente', 'error');
      return;
    }
    setBusy(true);
    try {
      await db.commesse.create(trimmed);
      await refreshAll();
      setNuova('');
      showToast('Commessa aggiunta', 'success');
    } catch (e) {
      showToast('Errore creazione commessa', 'error');
    }
    setBusy(false);
  };

  const removeCommessa = async (c) => {
    if (c.is_system) {
      showToast('Le commesse "Ferie" e "Malattia" non possono essere eliminate', 'error');
      return;
    }
    setBusy(true);
    try {
      await db.commesse.delete(c.id);
      await refreshAll();
      showToast('Commessa eliminata', 'success');
    } catch (e) {
      showToast('Errore eliminazione', 'error');
    }
    setBusy(false);
  };

  const startEdit = (c) => {
    if (c.is_system) {
      showToast('Le commesse di sistema non sono modificabili', 'error');
      return;
    }
    setEditing(c.id);
    setEditValue(c.nome);
  };

  const saveEdit = async (id) => {
    const trimmed = editValue.trim();
    if (!trimmed) { setEditing(null); return; }
    setBusy(true);
    try {
      await db.commesse.update(id, trimmed);
      await refreshAll();
      setEditing(null);
      showToast('Commessa modificata', 'success');
    } catch (e) {
      showToast('Errore modifica', 'error');
    }
    setBusy(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="display-font" style={{ fontSize: 42, lineHeight: 1 }}>COMMESSE</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Elenco commesse selezionabili dai tecnici nel rapportino</div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <label className="label">Aggiungi nuova commessa</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" value={nuova} onChange={e => setNuova(e.target.value)} placeholder="Es. Cantiere Via Roma 12" onKeyDown={e => e.key === 'Enter' && addCommessa()} />
          <button className="btn btn-primary" onClick={addCommessa} disabled={busy}><Plus size={16} /> Aggiungi</button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="stripes" style={{ height: 4 }} />
        <table>
          <thead>
            <tr>
              <th>Nome commessa</th>
              <th style={{ width: 140 }}>Tipo</th>
              <th style={{ width: 140, textAlign: 'right' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {commesse.map(c => (
              <tr key={c.id}>
                <td>
                  {editing === c.id ? (
                    <input className="input" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditing(null); }} autoFocus style={{ padding: '6px 10px', fontSize: 14 }} />
                  ) : (
                    <span style={{ fontWeight: 600 }}>{c.nome}</span>
                  )}
                </td>
                <td><span className={`tag ${c.is_system ? 'tag-dark' : 'tag-yellow'}`}>{c.is_system ? 'Sistema' : 'Cantiere'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {editing === c.id ? (
                    <>
                      <button className="btn btn-sm btn-primary" onClick={() => saveEdit(c.id)} style={{ marginRight: 6 }}><Check size={12} /></button>
                      <button className="btn btn-sm" onClick={() => setEditing(null)}><X size={12} /></button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm btn-ghost" onClick={() => startEdit(c)} disabled={c.is_system} style={{ opacity: c.is_system ? 0.3 : 1, marginRight: 6 }}><Edit2 size={12} /></button>
                      <button className="btn btn-sm btn-ghost" onClick={() => removeCommessa(c)} disabled={c.is_system} style={{ opacity: c.is_system ? 0.3 : 1 }}><Trash2 size={12} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== REPORTS TAB =====
function ReportsTab({ reports, users, commesse, refreshAll, showToast }) {
  const [filterUser, setFilterUser] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [editingReport, setEditingReport] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  const userById = (id) => users.find(u => u.id === id);

  const months = useMemo(() => {
    const set = new Set();
    reports.forEach(r => { if (r.date) set.add(r.date.slice(0, 7)); });
    return Array.from(set).sort().reverse();
  }, [reports]);

  const filtered = useMemo(() => {
    return reports
      .filter(r => filterUser === 'all' || r.user_id === filterUser)
      .filter(r => filterMonth === 'all' || r.date?.startsWith(filterMonth))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [reports, filterUser, filterMonth]);

  const totals = useMemo(() => {
    let lavorate = 0, permesso = 0;
    filtered.forEach(r => { lavorate += parseFloat(r.ore_lavorate || 0); permesso += parseFloat(r.permesso_ore || 0); });
    return { lavorate: Math.round(lavorate * 100) / 100, permesso: Math.round(permesso * 100) / 100 };
  }, [filtered]);

  const handleDelete = async (id) => {
    setBusy(true);
    try {
      await db.reports.delete(id);
      await refreshAll();
      setConfirmDeleteId(null);
      showToast('Rapportino eliminato', 'success');
    } catch (e) {
      showToast('Errore eliminazione', 'error');
    }
    setBusy(false);
  };

  const exportExcel = (userId, monthKey) => {
    const user = userById(userId);
    if (!user) return;
    const userReports = reports
      .filter(r => r.user_id === userId && r.date?.startsWith(monthKey))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (userReports.length === 0) {
      showToast('Nessun rapportino per questo periodo', 'error');
      return;
    }

    const data = [
      ['RAPPORTINO ORE', '', '', '', '', '', ''],
      [`Dipendente:`, `${user.nome} ${user.cognome}`, '', '', '', '', ''],
      [`Mese:`, monthLabel(`${monthKey}-01`), '', '', '', '', ''],
      [],
      ['Data', 'Commessa', 'Ora Inizio', 'Ora Fine', 'Ore Lavorate', 'Permesso', 'Note'],
      ...userReports.map(r => {
        const note = (r.commessa === 'Ferie' || r.commessa === 'Malattia') ? r.commessa : '';
        return [
          formatDateIT(r.date),
          r.commessa,
          r.ora_inizio || '',
          r.ora_fine || '',
          parseFloat(r.ore_lavorate || 0),
          parseFloat(r.permesso_ore || 0),
          note,
        ];
      }),
    ];

    const totLav = userReports.reduce((s, r) => s + parseFloat(r.ore_lavorate || 0), 0);
    const totPer = userReports.reduce((s, r) => s + parseFloat(r.permesso_ore || 0), 0);
    data.push([]);
    data.push(['', '', '', 'TOTALI:', Math.round(totLav * 100) / 100, Math.round(totPer * 100) / 100, '']);

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 11 }, { wch: 11 }, { wch: 13 }, { wch: 11 }, { wch: 14 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthLabel(`${monthKey}-01`).replace(' ', '_').slice(0, 30));

    const fname = `Rapportino_${user.cognome}_${user.nome}_${monthKey}.xlsx`;
    XLSX.writeFile(wb, fname);
    showToast(`Esportato: ${fname}`, 'success');
  };

  const exportAll = () => {
    if (filtered.length === 0) { showToast('Nessun rapportino da esportare', 'error'); return; }
    const grouped = {};
    filtered.forEach(r => {
      const key = `${r.user_id}__${r.date.slice(0, 7)}`;
      if (!grouped[key]) grouped[key] = { userId: r.user_id, month: r.date.slice(0, 7) };
    });
    Object.values(grouped).forEach(g => exportExcel(g.userId, g.month));
  };

  const numFiles = Object.keys(filtered.reduce((acc, r) => { acc[`${r.user_id}_${r.date.slice(0,7)}`] = 1; return acc; }, {})).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="display-font" style={{ fontSize: 42, lineHeight: 1 }}>RAPPORTINI</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{filtered.length} {filtered.length === 1 ? 'rapportino' : 'rapportini'} · {totals.lavorate}h lavorate · {totals.permesso}h permesso</div>
        </div>
        <button className="btn btn-dark" onClick={exportAll} disabled={filtered.length === 0}>
          <Download size={16} /> Esporta Excel ({numFiles} {numFiles === 1 ? 'file' : 'file'})
        </button>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="label">Dipendente</label>
          <select className="select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
            <option value="all">Tutti i dipendenti</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.nome} {u.cognome}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label className="label">Mese</label>
          <select className="select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="all">Tutti i mesi</option>
            {months.map(m => <option key={m} value={m}>{monthLabel(`${m}-01`)}</option>)}
          </select>
        </div>
        {filterUser !== 'all' && filterMonth !== 'all' && (
          <button className="btn btn-primary" onClick={() => exportExcel(filterUser, filterMonth)}>
            <Download size={14} /> Excel del periodo
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <FileSpreadsheet size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <div className="display-font" style={{ fontSize: 24 }}>NESSUN RAPPORTINO</div>
          <div style={{ color: 'var(--muted)', marginTop: 8 }}>I rapportini compilati dai dipendenti compariranno qui</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="stripes" style={{ height: 4 }} />
          <div style={{ overflowX: 'auto' }} className="scrollbar-thin">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Dipendente</th>
                  <th>Commessa</th>
                  <th>Inizio</th>
                  <th>Fine</th>
                  <th>+1</th>
                  <th>Ore Lav.</th>
                  <th>Permesso</th>
                  <th style={{ textAlign: 'right' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const u = userById(r.user_id);
                  return (
                    <tr key={r.id}>
                      <td className="mono-font" style={{ fontWeight: 600 }}>{formatDateIT(r.date)}</td>
                      <td>{u ? `${u.nome} ${u.cognome}` : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                      <td>{r.commessa}</td>
                      <td className="mono-font">{r.ora_inizio || '—'}</td>
                      <td className="mono-font">{r.ora_fine || '—'}</td>
                      <td>{r.plus_one ? <Check size={14} /> : ''}</td>
                      <td className="mono-font" style={{ fontWeight: 700 }}>{parseFloat(r.ore_lavorate || 0)}h</td>
                      <td className="mono-font" style={{ color: parseFloat(r.permesso_ore || 0) > 0 ? 'var(--accent-strong)' : 'var(--muted)' }}>
                        {parseFloat(r.permesso_ore || 0) > 0 ? `${parseFloat(r.permesso_ore)}h` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingReport(r)} title="Modifica"><Edit2 size={12} /></button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDeleteId(r.id)} title="Elimina"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingReport && (
        <EditReportModal
          report={editingReport}
          users={users}
          commesse={commesse}
          onClose={() => setEditingReport(null)}
          onSave={async (updated) => {
            const recalc = calcOre(updated.ora_inizio, updated.ora_fine, updated.plus_one, updated.commessa);
            try {
              await db.reports.update(updated.id, {
                user_id: updated.user_id,
                date: updated.date,
                commessa: updated.commessa,
                ora_inizio: updated.ora_inizio || null,
                ora_fine: updated.ora_fine || null,
                plus_one: updated.plus_one,
                ore_lavorate: recalc.lavorate,
                permesso_ore: recalc.permesso,
              });
              await refreshAll();
              setEditingReport(null);
              showToast('Rapportino aggiornato', 'success');
            } catch (e) {
              showToast('Errore aggiornamento', 'error');
            }
          }}
        />
      )}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="stripes" style={{ height: 6 }} />
            <div style={{ padding: 28 }}>
              <div className="display-font" style={{ fontSize: 28, marginBottom: 12 }}>ELIMINARE?</div>
              <p style={{ marginBottom: 20 }}>Vuoi eliminare definitivamente questo rapportino?</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setConfirmDeleteId(null)}>Annulla</button>
                <button className="btn btn-danger" onClick={() => handleDelete(confirmDeleteId)} disabled={busy}>
                  <Trash2 size={14} /> {busy ? 'Eliminazione…' : 'Elimina'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== EDIT REPORT MODAL =====
function EditReportModal({ report, users, commesse, onClose, onSave }) {
  const [form, setForm] = useState({ ...report });
  const calc = calcOre(form.ora_inizio, form.ora_fine, form.plus_one, form.commessa);
  const isFerieMalattia = form.commessa === 'Ferie' || form.commessa === 'Malattia';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="stripes" style={{ height: 6 }} />
        <div style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="display-font" style={{ fontSize: 28 }}>MODIFICA RAPPORTINO</div>
            <button className="btn-ghost btn btn-sm" onClick={onClose}><X size={16} /></button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label">Dipendente</label>
            <select className="select" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>
              {users.map(u => <option key={u.id} value={u.id}>{u.nome} {u.cognome}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="label">Data</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Commessa</label>
              <select className="select" value={form.commessa} onChange={e => setForm({ ...form, commessa: e.target.value })}>
                {commesse.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </div>
          </div>

          {!isFerieMalattia && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="label">Ora Inizio</label>
                  <input className="input mono-input" type="time" value={form.ora_inizio || ''} onChange={e => setForm({ ...form, ora_inizio: e.target.value })} />
                </div>
                <div>
                  <label className="label">Ora Fine</label>
                  <input className="input mono-input" type="time" value={form.ora_fine || ''} onChange={e => setForm({ ...form, ora_fine: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className={`checkbox-custom ${form.plus_one ? 'checked' : ''}`}
                  onClick={() => setForm({ ...form, plus_one: !form.plus_one })}
                >
                  {form.plus_one && <Check size={18} strokeWidth={3} />}
                </button>
                <label style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => setForm({ ...form, plus_one: !form.plus_one })}>
                  +1 ora aggiuntiva
                </label>
              </div>
            </>
          )}

          <div style={{ background: 'var(--bg)', border: '2px solid var(--ink)', padding: 14, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>Lavorate</div>
                <div className="display-font mono-font" style={{ fontSize: 28, lineHeight: 1 }}>{calc.lavorate}h</div>
              </div>
              <div style={{ borderLeft: '2px solid var(--ink)' }} />
              <div>
                <div className="label" style={{ marginBottom: 4 }}>Permesso</div>
                <div className="display-font mono-font" style={{ fontSize: 28, lineHeight: 1, color: calc.permesso > 0 ? 'var(--accent-strong)' : 'var(--muted)' }}>{calc.permesso}h</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={onClose}>Annulla</button>
            <button className="btn btn-primary" onClick={() => onSave(form)}><Check size={14} /> Salva modifiche</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SETTINGS TAB =====
function SettingsTab({ settings, refreshAll, showToast }) {
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await db.settings.update({
        company_name: form.company_name,
        google_drive_folder_id: form.google_drive_folder_id,
      });
      await refreshAll();
      showToast('Impostazioni salvate', 'success');
    } catch (e) {
      showToast('Errore salvataggio', 'error');
    }
    setBusy(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="display-font" style={{ fontSize: 42, lineHeight: 1 }}>IMPOSTAZIONI</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Configurazione generale dell'applicazione</div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="display-font" style={{ fontSize: 22, marginBottom: 18 }}>GENERALE</div>
        <div style={{ marginBottom: 16 }}>
          <label className="label">Nome azienda</label>
          <input className="input" value={form.company_name || ''} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Es. Studio Elettrico Rossi" />
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="display-font" style={{ fontSize: 22, marginBottom: 6 }}>GOOGLE DRIVE</div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Inserisci l'ID della cartella Google Drive di destinazione. <strong>Nota:</strong> i file Excel vengono generati e scaricati localmente. Per il caricamento automatico su Drive serve un'integrazione aggiuntiva (Google Apps Script o OAuth).
        </p>
        <div>
          <label className="label">ID cartella Google Drive</label>
          <input className="input mono-font" style={{ fontSize: 13 }} value={form.google_drive_folder_id || ''} onChange={e => setForm({ ...form, google_drive_folder_id: e.target.value })} placeholder="1aBcD-eFgH_iJkLmNoPqRsTuVwXyZ..." />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            Lo trovi nell'URL della cartella: drive.google.com/drive/folders/<strong style={{ color: 'var(--ink)' }}>QUESTO_È_L'ID</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20, background: 'var(--bg)' }}>
        <div className="display-font" style={{ fontSize: 22, marginBottom: 12 }}>REGOLE DI CALCOLO</div>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }}>
          <li>Pausa pranzo obbligatoria di <strong>1 ora</strong> sempre detratta</li>
          <li>Spunta "+1": aggiunge <strong>1 ora</strong> al totale lavorato</li>
          <li>Commesse <strong>"Ferie"</strong> e <strong>"Malattia"</strong>: tutto a zero</li>
          <li>Ore lavorate inferiori a 8: la differenza è marcata come <strong>"Permesso"</strong></li>
          <li>Un file Excel separato per <strong>ogni dipendente</strong> e <strong>ogni mese</strong>; ogni rapportino è una riga del mese</li>
        </ul>
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={busy}>
        <Check size={16} /> {busy ? 'Salvataggio…' : 'Salva impostazioni'}
      </button>
    </div>
  );
}

// ===== USER FORM =====
function UserForm({ user, commesse, reports, refreshReports, showToast, companyName }) {
  const [data, setData] = useState(todayISO());
  const [commessa, setCommessa] = useState('');
  const [oraInizio, setOraInizio] = useState('08:00');
  const [oraFine, setOraFine] = useState('17:00');
  const [plusOne, setPlusOne] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const calc = calcOre(oraInizio, oraFine, plusOne, commessa);
  const isFerieMalattia = commessa === 'Ferie' || commessa === 'Malattia';

  const userReports = reports
    .filter(r => r.user_id === user.id)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  const submit = async () => {
    if (!commessa) { showToast('Seleziona una commessa', 'error'); return; }
    if (!data) { showToast('Seleziona la data', 'error'); return; }
    if (!isFerieMalattia && (!oraInizio || !oraFine)) {
      showToast('Inserisci ora inizio e ora fine', 'error');
      return;
    }
    setSubmitting(true);

    try {
      await db.reports.create({
        user_id: user.id,
        date: data,
        commessa,
        ora_inizio: isFerieMalattia ? null : oraInizio,
        ora_fine: isFerieMalattia ? null : oraFine,
        plus_one: isFerieMalattia ? false : plusOne,
        ore_lavorate: calc.lavorate,
        permesso_ore: calc.permesso,
      });
      await refreshReports();
      showToast('Rapportino inviato!', 'success');
      setCommessa('');
      setOraInizio('08:00');
      setOraFine('17:00');
      setPlusOne(false);
    } catch (e) {
      console.error(e);
      showToast('Errore invio rapportino', 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="app-root">
      <style>{styles}</style>

      <header style={{ background: 'var(--ink)', color: 'var(--paper)', borderBottom: '4px solid var(--accent)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Zap size={24} fill="var(--accent)" color="var(--accent)" />
          <div>
            <div className="display-font" style={{ fontSize: 20, lineHeight: 1, color: 'var(--accent)' }}>RAPPORTINO ORE</div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.7 }}>{companyName?.toUpperCase()}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div className="card" style={{ padding: 24, marginBottom: 24, position: 'relative' }}>
          <div className="stripes" style={{ height: 6, position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, background: 'var(--accent)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div className="display-font" style={{ fontSize: 28, lineHeight: 1 }}>
                {user.nome[0]}{user.cognome[0]}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--muted)' }}>BENVENUTO</div>
              <div className="display-font" style={{ fontSize: 32, lineHeight: 1 }}>
                {user.nome.toUpperCase()} {user.cognome.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileSpreadsheet size={22} />
            <div className="display-font" style={{ fontSize: 26, lineHeight: 1 }}>NUOVO RAPPORTINO</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label"><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} /> Data</label>
            <input className="input mono-font" type="date" value={data} onChange={e => setData(e.target.value)} style={{ fontSize: 16, fontWeight: 600 }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label"><Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} /> Commessa</label>
            <select className="select" value={commessa} onChange={e => setCommessa(e.target.value)}>
              <option value="">— Seleziona commessa —</option>
              {commesse.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>

          {isFerieMalattia && (
            <div style={{ background: 'var(--accent)', border: '2px solid var(--ink)', padding: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 14 }}>
                <strong>{commessa}:</strong> tutte le ore saranno registrate a zero.
              </div>
            </div>
          )}

          {!isFerieMalattia && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label className="label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Ora inizio</label>
                  <input className="input mono-input" type="time" value={oraInizio} onChange={e => setOraInizio(e.target.value)} />
                </div>
                <div>
                  <label className="label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Ora fine</label>
                  <input className="input mono-input" type="time" value={oraFine} onChange={e => setOraFine(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--bg)', border: '2px solid var(--ink)' }}>
                <button
                  type="button"
                  className={`checkbox-custom ${plusOne ? 'checked' : ''}`}
                  onClick={() => setPlusOne(!plusOne)}
                  aria-pressed={plusOne}
                >
                  {plusOne && <Check size={18} strokeWidth={3} />}
                </button>
                <label style={{ fontWeight: 700, cursor: 'pointer', flex: 1 }} onClick={() => setPlusOne(!plusOne)}>
                  +1 ora aggiuntiva
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', marginTop: 2 }}>Spunta per aggiungere un'ora al totale</div>
                </label>
              </div>
            </>
          )}

          <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 20, marginBottom: 24, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 8, right: 12, fontSize: 9, letterSpacing: '0.2em', opacity: 0.5 }}>RIEPILOGO</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 4 }}>ORE LAVORATE</div>
                <div className="display-font mono-font" style={{ fontSize: 48, lineHeight: 1 }}>{calc.lavorate}<span style={{ fontSize: 24, opacity: 0.6 }}>h</span></div>
              </div>
              <div style={{ borderLeft: '2px solid var(--paper)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: 4 }}>PERMESSO</div>
                <div className="display-font mono-font" style={{ fontSize: 48, lineHeight: 1, opacity: calc.permesso > 0 ? 1 : 0.4 }}>{calc.permesso}<span style={{ fontSize: 24, opacity: 0.6 }}>h</span></div>
              </div>
            </div>
            {!isFerieMalattia && oraInizio && oraFine && (
              <div style={{ marginTop: 12, fontSize: 11, opacity: 0.6, textAlign: 'center', letterSpacing: '0.05em' }}>
                Pausa di 1h detratta automaticamente {plusOne && '· +1h aggiunta'}
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={submit} disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: 15 }}>
            {submitting ? '⚡ INVIO IN CORSO…' : <>⚡ INVIO RAPPORTINO</>}
          </button>
        </div>

        {userReports.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="stripes" style={{ height: 4 }} />
            <div style={{ padding: '20px 24px 12px' }}>
              <div className="display-font" style={{ fontSize: 22 }}>ULTIMI RAPPORTINI</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>I tuoi ultimi 5 invii</div>
            </div>
            <div style={{ overflowX: 'auto' }} className="scrollbar-thin">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Commessa</th>
                    <th>Ore</th>
                    <th>Permesso</th>
                  </tr>
                </thead>
                <tbody>
                  {userReports.map(r => (
                    <tr key={r.id}>
                      <td className="mono-font" style={{ fontWeight: 600 }}>{formatDateIT(r.date)}</td>
                      <td>{r.commessa}</td>
                      <td className="mono-font" style={{ fontWeight: 700 }}>{parseFloat(r.ore_lavorate || 0)}h</td>
                      <td className="mono-font" style={{ color: parseFloat(r.permesso_ore || 0) > 0 ? 'var(--accent-strong)' : 'var(--muted)' }}>
                        {parseFloat(r.permesso_ore || 0) > 0 ? `${parseFloat(r.permesso_ore)}h` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.15em' }}>
        ⚡ {companyName?.toUpperCase()} · LINK PERSONALE
      </footer>
    </div>
  );
}
