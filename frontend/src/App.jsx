import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Send, Zap, Eye, Code2, BarChart2, Trash2, Search,
  ChevronRight, AlertTriangle, ShieldAlert, Info, Copy, RefreshCw,
  Plus, X, Play, Square, Download, Upload, Clock, Globe, Hash
} from 'lucide-react';

const API = '';

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #0a0a0f; color: #e2e8f0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0f0f1a; }
  ::-webkit-scrollbar-thumb { background: #2d2d4a; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #4a4a7a; }
  
  .app { display: flex; height: 100vh; overflow: hidden; }
  
  .sidebar {
    width: 56px; background: #0d0d18; border-right: 1px solid #1e1e30;
    display: flex; flex-direction: column; align-items: center;
    padding: 12px 0; gap: 4px; flex-shrink: 0;
  }
  .logo { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
  .logo svg { filter: drop-shadow(0 0 8px #f97316); }
  .nav-btn {
    width: 40px; height: 40px; border-radius: 8px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: transparent; color: #4a4a6a; transition: all 0.15s;
    position: relative;
  }
  .nav-btn:hover { background: #1a1a2e; color: #a0a0c0; }
  .nav-btn.active { background: #1e1040; color: #f97316; }
  .nav-btn .badge {
    position: absolute; top: 4px; right: 4px; width: 8px; height: 8px;
    background: #f97316; border-radius: 50%;
  }
  
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  
  .topbar {
    height: 44px; background: #0d0d18; border-bottom: 1px solid #1e1e30;
    display: flex; align-items: center; padding: 0 16px; gap: 12px;
    flex-shrink: 0;
  }
  .topbar-title { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #f97316; font-weight: 700; }
  .topbar-sep { color: #2d2d4a; }
  .topbar-sub { font-size: 12px; color: #4a4a6a; }
  .ws-indicator { margin-left: auto; display: flex; align-items: center; gap: 6px; font-size: 11px; }
  .ws-dot { width: 7px; height: 7px; border-radius: 50%; }
  .ws-dot.connected { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
  .ws-dot.disconnected { background: #ef4444; }
  
  .content { flex: 1; overflow: hidden; display: flex; }
  
  /* History */
  .history-panel { display: flex; flex-direction: column; width: 100%; overflow: hidden; }
  .history-toolbar {
    padding: 10px 16px; background: #0d0d18; border-bottom: 1px solid #1e1e30;
    display: flex; gap: 8px; align-items: center;
  }
  .search-input {
    flex: 1; background: #13131f; border: 1px solid #1e1e30; border-radius: 6px;
    padding: 6px 10px 6px 32px; color: #e2e8f0; font-size: 12px; outline: none;
  }
  .search-input:focus { border-color: #f97316; }
  .search-wrap { position: relative; flex: 1; }
  .search-wrap .search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #4a4a6a; }
  .history-split { display: flex; flex: 1; overflow: hidden; }
  .history-list { width: 420px; border-right: 1px solid #1e1e30; overflow-y: auto; flex-shrink: 0; }
  .history-item {
    padding: 8px 14px; border-bottom: 1px solid #13131f; cursor: pointer;
    display: flex; align-items: center; gap: 8px; transition: background 0.1s;
  }
  .history-item:hover { background: #13131f; }
  .history-item.selected { background: #1a1040; border-left: 2px solid #f97316; }
  .method-badge {
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
    padding: 2px 6px; border-radius: 4px; min-width: 44px; text-align: center;
  }
  .method-GET { background: #0d2e1a; color: #22c55e; }
  .method-POST { background: #1a2040; color: #60a5fa; }
  .method-PUT { background: #2a1a10; color: #f97316; }
  .method-DELETE { background: #2a0d0d; color: #ef4444; }
  .method-PATCH { background: #1a1a30; color: #a78bfa; }
  .history-url { font-size: 11px; color: #a0a0c0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .status-code { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; }
  .status-2xx { color: #22c55e; }
  .status-3xx { color: #f59e0b; }
  .status-4xx { color: #f97316; }
  .status-5xx { color: #ef4444; }
  .time-badge { font-size: 10px; color: #4a4a6a; font-family: 'JetBrains Mono', monospace; }
  .history-detail { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .detail-tabs { display: flex; gap: 1px; padding: 8px 16px 0; background: #0d0d18; border-bottom: 1px solid #1e1e30; }
  .tab-btn {
    padding: 6px 14px; font-size: 12px; border: none; cursor: pointer;
    background: transparent; color: #4a4a6a; border-radius: 6px 6px 0 0;
    border-bottom: 2px solid transparent; transition: all 0.1s;
  }
  .tab-btn.active { color: #f97316; border-bottom-color: #f97316; background: #13131f; }
  .tab-btn:hover:not(.active) { color: #a0a0c0; }
  .detail-content { flex: 1; overflow: auto; padding: 16px; }
  .code-block {
    background: #0d0d18; border: 1px solid #1e1e30; border-radius: 6px;
    padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px;
    color: #a0c4ff; line-height: 1.6; overflow: auto; white-space: pre-wrap;
    word-break: break-all; max-height: 60vh;
  }
  .header-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .header-table td { padding: 5px 8px; border-bottom: 1px solid #1e1e30; vertical-align: top; }
  .header-table td:first-child { color: #f97316; font-family: 'JetBrains Mono', monospace; width: 35%; }
  .header-table td:last-child { color: #a0c4ff; font-family: 'JetBrains Mono', monospace; word-break: break-all; }
  
  /* Repeater */
  .repeater-panel { display: flex; flex-direction: column; width: 100%; overflow: hidden; }
  .repeater-split { display: flex; flex: 1; overflow: hidden; gap: 1px; background: #1e1e30; }
  .repeater-pane { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: #0a0a0f; }
  .pane-header {
    padding: 8px 16px; background: #0d0d18; border-bottom: 1px solid #1e1e30;
    font-size: 11px; color: #4a4a6a; display: flex; align-items: center; gap: 8px;
  }
  .request-builder { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
  .url-bar { display: flex; gap: 8px; padding: 10px 16px; border-bottom: 1px solid #1e1e30; }
  .method-select {
    background: #13131f; border: 1px solid #1e1e30; border-radius: 6px;
    color: #f97316; font-family: 'JetBrains Mono', monospace; font-size: 12px;
    font-weight: 700; padding: 6px 10px; outline: none; cursor: pointer;
  }
  .url-input {
    flex: 1; background: #13131f; border: 1px solid #1e1e30; border-radius: 6px;
    padding: 6px 12px; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;
    font-size: 12px; outline: none;
  }
  .url-input:focus { border-color: #f97316; }
  .btn {
    padding: 6px 16px; border-radius: 6px; border: none; cursor: pointer;
    font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
  }
  .btn-primary { background: #f97316; color: #0a0a0f; }
  .btn-primary:hover { background: #fb923c; }
  .btn-primary:disabled { background: #4a4a6a; cursor: not-allowed; }
  .btn-ghost { background: #1a1a2e; color: #a0a0c0; border: 1px solid #1e1e30; }
  .btn-ghost:hover { background: #2a2a3e; color: #e2e8f0; }
  .btn-danger { background: #2a0d0d; color: #ef4444; border: 1px solid #3a1a1a; }
  .btn-danger:hover { background: #3a1a1a; }
  .text-editor {
    flex: 1; background: #0d0d18; border: none; color: #a0c4ff;
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    padding: 12px 16px; resize: none; outline: none; line-height: 1.6;
  }
  
  /* Fuzzer */
  .fuzzer-panel { display: flex; flex-direction: column; width: 100%; overflow: hidden; }
  .fuzzer-config { padding: 16px; border-bottom: 1px solid #1e1e30; display: flex; flex-direction: column; gap: 10px; }
  .form-row { display: flex; gap: 10px; align-items: flex-start; }
  .form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .form-label { font-size: 11px; color: #4a4a6a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input {
    background: #13131f; border: 1px solid #1e1e30; border-radius: 6px;
    padding: 7px 10px; color: #e2e8f0; font-family: 'JetBrains Mono', monospace;
    font-size: 12px; outline: none; width: 100%;
  }
  .form-input:focus { border-color: #f97316; }
  .fuzzer-results { flex: 1; overflow: auto; }
  .fuzz-result-item {
    display: grid; grid-template-columns: 50px 1fr 70px 80px 80px;
    padding: 5px 16px; border-bottom: 1px solid #0f0f1a;
    font-family: 'JetBrains Mono', monospace; font-size: 11px; align-items: center;
    transition: background 0.1s;
  }
  .fuzz-result-item:hover { background: #13131f; }
  .fuzz-result-item.header { color: #4a4a6a; font-weight: 700; background: #0d0d18; border-bottom: 1px solid #1e1e30; }
  .progress-bar { height: 3px; background: #1e1e30; border-radius: 2px; margin: 0 16px; }
  .progress-fill { height: 100%; background: #f97316; border-radius: 2px; transition: width 0.3s; }
  
  /* Scanner */
  .scanner-panel { display: flex; flex-direction: column; width: 100%; overflow: hidden; }
  .findings-list { flex: 1; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .finding-card {
    background: #0d0d18; border: 1px solid #1e1e30; border-radius: 8px;
    padding: 12px 14px; display: flex; gap: 12px; align-items: flex-start;
  }
  .finding-card.High { border-left: 3px solid #ef4444; }
  .finding-card.Medium { border-left: 3px solid #f59e0b; }
  .finding-card.Low { border-left: 3px solid #3b82f6; }
  .finding-card.Info { border-left: 3px solid #6b7280; }
  .severity-badge {
    font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
    font-family: 'JetBrains Mono', monospace; white-space: nowrap;
  }
  .severity-High { background: #2a0d0d; color: #ef4444; }
  .severity-Medium { background: #2a1a00; color: #f59e0b; }
  .severity-Low { background: #0d1a2a; color: #3b82f6; }
  .severity-Info { background: #1a1a2a; color: #6b7280; }
  .finding-content { flex: 1; }
  .finding-type { font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 3px; }
  .finding-desc { font-size: 11px; color: #6b7280; }
  .finding-evidence { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #f97316; margin-top: 4px; }
  
  /* Decoder */
  .decoder-panel { display: flex; flex-direction: column; width: 100%; overflow: hidden; padding: 20px; gap: 16px; overflow-y: auto; }
  .decoder-section { background: #0d0d18; border: 1px solid #1e1e30; border-radius: 10px; padding: 16px; }
  .decoder-title { font-size: 13px; font-weight: 600; color: #a0a0c0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .type-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .type-chip {
    padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
    border: 1px solid #1e1e30; cursor: pointer; background: #13131f; color: #6b7280;
    font-family: 'JetBrains Mono', monospace; transition: all 0.1s;
  }
  .type-chip.active { background: #f97316; color: #0a0a0f; border-color: #f97316; }
  .decoder-input {
    width: 100%; background: #13131f; border: 1px solid #1e1e30; border-radius: 6px;
    padding: 10px; color: #a0c4ff; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; outline: none; resize: vertical; min-height: 80px; line-height: 1.6;
  }
  .decoder-input:focus { border-color: #f97316; }
  .decoder-output {
    background: #0a0a0f; border: 1px solid #1e1e30; border-radius: 6px;
    padding: 10px; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #22c55e; min-height: 60px; white-space: pre-wrap; word-break: break-all;
  }
  
  /* Dashboard */
  .dashboard-panel { flex: 1; overflow: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-card {
    background: #0d0d18; border: 1px solid #1e1e30; border-radius: 10px;
    padding: 16px; display: flex; flex-direction: column; gap: 6px;
  }
  .stat-label { font-size: 11px; color: #4a4a6a; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .stat-value { font-size: 28px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #f97316; }
  .stat-sub { font-size: 11px; color: #4a4a6a; }
  .recent-section { background: #0d0d18; border: 1px solid #1e1e30; border-radius: 10px; padding: 16px; }
  .section-title { font-size: 13px; font-weight: 600; color: #a0a0c0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  
  /* Toast */
  .toast-container { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; }
  .toast {
    background: #13131f; border: 1px solid #1e1e30; border-radius: 8px;
    padding: 10px 16px; font-size: 12px; color: #e2e8f0; display: flex; align-items: center; gap: 8px;
    animation: slideIn 0.2s ease;
  }
  .toast.success { border-left: 3px solid #22c55e; }
  .toast.error { border-left: 3px solid #ef4444; }
  .toast.info { border-left: 3px solid #f97316; }
  @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #2d2d4a; gap: 8px; }
  .empty-state svg { opacity: 0.3; }
  .empty-state p { font-size: 12px; }
  
  .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .info-row { display: flex; gap: 6px; align-items: center; font-size: 11px; color: #6b7280; }
  
  textarea.form-input { resize: vertical; min-height: 80px; line-height: 1.6; }

  .proxy-instructions { padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1; }
  .instruction-card { background: #0d0d18; border: 1px solid #1e1e30; border-radius: 10px; padding: 16px; }
  .instruction-title { font-size: 14px; font-weight: 600; color: #f97316; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .step { display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start; }
  .step-num { background: #1e1040; color: #f97316; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .step-text { font-size: 12px; color: #a0a0c0; line-height: 1.6; }
  .code-inline { background: #13131f; border: 1px solid #1e1e30; border-radius: 4px; padding: 1px 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #f97316; }
`;

// ── Utilities ─────────────────────────────────────────────────
const statusColor = (s) => {
  if (!s) return '';
  if (s < 300) return 'status-2xx';
  if (s < 400) return 'status-3xx';
  if (s < 500) return 'status-4xx';
  return 'status-5xx';
};

const methodClass = (m) => `method-badge method-${m || 'GET'}`;

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).catch(() => {});
};

// ── Toast ──────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return { toasts, add };
}

// ── Dashboard ──────────────────────────────────────────────────
function Dashboard({ history, findings }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, [history.length, findings.length]);

  const byMethod = stats?.by_method || {};
  const bySev = stats?.by_severity || {};
  return (
    <div className="dashboard-panel">
      <div className="stats-grid">
        {[
          { label: 'Total Requests', value: stats?.total_requests ?? 0, sub: 'HTTP requests captured', icon: <Globe size={16} /> },
          { label: 'Findings', value: stats?.total_findings ?? 0, sub: 'Passive scan results', icon: <ShieldAlert size={16} /> },
          { label: 'High/Med Issues', value: (bySev.High || 0) + (bySev.Medium || 0), sub: 'Needs attention', icon: <AlertTriangle size={16} /> },
          { label: 'Methods', value: Object.keys(byMethod).length, sub: Object.entries(byMethod).map(([k,v]) => `${k}:${v}`).join(', ') || '—', icon: <Hash size={16} /> }
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{s.icon} {s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="recent-section">
        <div className="section-title"><Activity size={14} /> Recent Requests</div>
        {history.slice(0, 8).map(h => (
          <div key={h.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #1e1e30', alignItems: 'center' }}>
            <span className={methodClass(h.method)} style={{ fontSize: 10 }}>{h.method}</span>
            <span style={{ flex: 1, fontSize: 11, color: '#a0a0c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url}</span>
            <span className={`status-code ${statusColor(h.status)}`}>{h.status}</span>
            <span className="time-badge">{h.time}ms</span>
          </div>
        ))}
        {!history.length && <div style={{ fontSize: 12, color: '#2d2d4a', padding: '20px 0', textAlign: 'center' }}>No requests yet — send traffic through the proxy</div>}
      </div>
      <div className="recent-section">
        <div className="section-title"><ShieldAlert size={14} /> Recent Findings</div>
        {findings.slice(0, 5).map(f => (
          <div key={f.id} className={`finding-card ${f.severity}`} style={{ marginBottom: 6 }}>
            <span className={`severity-badge severity-${f.severity}`}>{f.severity}</span>
            <div className="finding-content">
              <div className="finding-type">{f.type}</div>
              <div className="finding-desc">{f.description}</div>
            </div>
          </div>
        ))}
        {!findings.length && <div style={{ fontSize: 12, color: '#2d2d4a', padding: '20px 0', textAlign: 'center' }}>No findings yet</div>}
      </div>
    </div>
  );
}

// ── History ────────────────────────────────────────────────────
function History({ history, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState('request');
  const [search, setSearch] = useState('');

  const loadDetail = async (id) => {
    setSelected(id);
    const res = await fetch(`${API}/api/history/${id}`);
    const data = await res.json();
    setDetail(data);
    setTab('request');
  };

  const clearAll = async () => {
    await fetch(`${API}/api/history`, { method: 'DELETE' });
    onRefresh();
    setDetail(null);
  };

  const filtered = history.filter(h =>
    !search || h.url.toLowerCase().includes(search.toLowerCase()) || h.method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="history-panel">
      <div className="history-toolbar">
        <div className="search-wrap">
          <Search size={13} className="search-icon" />
          <input className="search-input" placeholder="Filter by URL or method..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-ghost" onClick={onRefresh}><RefreshCw size={13} />Refresh</button>
        <button className="btn btn-danger" onClick={clearAll}><Trash2 size={13} />Clear</button>
      </div>
      <div className="history-split">
        <div className="history-list">
          {filtered.length === 0 && (
            <div className="empty-state" style={{ height: 200 }}>
              <Clock size={32} />
              <p>No requests captured yet</p>
            </div>
          )}
          {filtered.map(h => (
            <div key={h.id} className={`history-item ${selected === h.id ? 'selected' : ''}`} onClick={() => loadDetail(h.id)}>
              <span className={methodClass(h.method)}>{h.method}</span>
              <span className="history-url" title={h.url}>{h.url}</span>
              <span className={`status-code ${statusColor(h.status)}`}>{h.status || '—'}</span>
              <span className="time-badge">{h.time}ms</span>
            </div>
          ))}
        </div>
        <div className="history-detail">
          {!detail ? (
            <div className="empty-state"><Eye size={40} /><p>Select a request to inspect</p></div>
          ) : (
            <>
              <div className="detail-tabs">
                {['request', 'response', 'headers', 'raw'].map(t => (
                  <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
                <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '3px 10px', fontSize: 11 }}
                  onClick={() => copyToClipboard(JSON.stringify(detail, null, 2))}>
                  <Copy size={11} /> Copy
                </button>
              </div>
              <div className="detail-content">
                {tab === 'request' && (
                  <div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#4a4a6a', marginBottom: 6 }}>REQUEST LINE</div>
                      <div className="code-block">{detail.method} {detail.url}</div>
                    </div>
                    {detail.request_body && (
                      <div>
                        <div style={{ fontSize: 11, color: '#4a4a6a', marginBottom: 6, marginTop: 12 }}>REQUEST BODY</div>
                        <div className="code-block">{detail.request_body}</div>
                      </div>
                    )}
                  </div>
                )}
                {tab === 'response' && (
                  <div>
                    <div style={{ marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className={`status-code ${statusColor(detail.response_status)}`} style={{ fontSize: 16 }}>{detail.response_status}</span>
                      <span className="time-badge">{detail.response_time_ms}ms</span>
                    </div>
                    <div className="code-block">{detail.response_body || '(empty body)'}</div>
                  </div>
                )}
                {tab === 'headers' && (
                  <div>
                    <div style={{ fontSize: 11, color: '#4a4a6a', marginBottom: 8 }}>REQUEST HEADERS</div>
                    <table className="header-table">
                      <tbody>
                        {Object.entries(detail.request_headers || {}).map(([k, v]) => (
                          <tr key={k}><td>{k}</td><td>{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 11, color: '#4a4a6a', margin: '16px 0 8px' }}>RESPONSE HEADERS</div>
                    <table className="header-table">
                      <tbody>
                        {Object.entries(detail.response_headers || {}).map(([k, v]) => (
                          <tr key={k}><td>{k}</td><td>{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {tab === 'raw' && (
                  <div className="code-block">
                    {`${detail.method} ${detail.url}\n\n`}
                    {Object.entries(detail.request_headers || {}).map(([k,v]) => `${k}: ${v}`).join('\n')}
                    {detail.request_body ? `\n\n${detail.request_body}` : ''}
                    {'\n\n--- RESPONSE ---\n\n'}
                    {`HTTP/1.1 ${detail.response_status}\n`}
                    {Object.entries(detail.response_headers || {}).map(([k,v]) => `${k}: ${v}`).join('\n')}
                    {detail.response_body ? `\n\n${detail.response_body}` : ''}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Repeater ──────────────────────────────────────────────────
function Repeater({ toast }) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://');
  const [headers, setHeaders] = useState('User-Agent: HawkEye/1.0\nAccept: */*');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [resTab, setResTab] = useState('body');

  const parseHeaders = (raw) => {
    const h = {};
    raw.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) h[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
    return h;
  };

  const send = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/repeater/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, url, headers: parseHeaders(headers), body: body || null, follow_redirects: false })
      });
      const data = await res.json();
      setResponse(data);
      if (data.findings?.length) toast(`${data.findings.length} findings detected!`, 'info');
    } catch (e) {
      toast('Request failed: ' + e.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="repeater-panel">
      <div className="repeater-split">
        <div className="repeater-pane">
          <div className="pane-header"><Send size={12} /> Request</div>
          <div className="request-builder">
            <div className="url-bar">
              <select className="method-select" value={method} onChange={e => setMethod(e.target.value)}>
                {['GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'].map(m => <option key={m}>{m}</option>)}
              </select>
              <input className="url-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://target.com/api/endpoint" />
              <button className="btn btn-primary" onClick={send} disabled={loading}>
                {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={13} />}
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
            <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#4a4a6a' }}>HEADERS</div>
            <textarea className="text-editor" style={{ maxHeight: 140, resize: 'none' }}
              value={headers} onChange={e => setHeaders(e.target.value)} />
            <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#4a4a6a' }}>BODY</div>
            <textarea className="text-editor" style={{ flex: 1 }}
              value={body} onChange={e => setBody(e.target.value)}
              placeholder={method === 'GET' ? '(GET requests typically have no body)' : '{"key": "value"}'} />
          </div>
        </div>
        <div className="repeater-pane">
          <div className="pane-header">
            <Eye size={12} /> Response
            {response && <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <span className={`status-code ${statusColor(response.status)}`}>{response.status}</span>
              <span className="time-badge">{response.time_ms}ms</span>
              <span className="time-badge">{(response.body || '').length} bytes</span>
            </span>}
          </div>
          {!response ? (
            <div className="empty-state"><Send size={32} /><p>Send a request to see the response</p></div>
          ) : (
            <>
              <div className="detail-tabs">
                {['body','headers','findings'].map(t => (
                  <button key={t} className={`tab-btn ${resTab === t ? 'active' : ''}`} onClick={() => setResTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    {t === 'findings' && response.findings?.length > 0 &&
                      <span style={{ marginLeft: 4, background: '#ef4444', borderRadius: 8, padding: '1px 5px', fontSize: 10 }}>{response.findings.length}</span>}
                  </button>
                ))}
              </div>
              <div className="detail-content">
                {resTab === 'body' && <div className="code-block">{response.body || '(empty)'}</div>}
                {resTab === 'headers' && (
                  <table className="header-table">
                    <tbody>{Object.entries(response.headers || {}).map(([k,v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
                  </table>
                )}
                {resTab === 'findings' && (
                  response.findings?.length > 0
                    ? response.findings.map((f, i) => (
                        <div key={i} className={`finding-card ${f.severity}`} style={{ marginBottom: 8 }}>
                          <span className={`severity-badge severity-${f.severity}`}>{f.severity}</span>
                          <div className="finding-content">
                            <div className="finding-type">{f.type}</div>
                            <div className="finding-desc">{f.description}</div>
                            <div className="finding-evidence">{f.evidence}</div>
                          </div>
                        </div>
                      ))
                    : <div style={{ fontSize: 12, color: '#2d2d4a', textAlign: 'center', marginTop: 40 }}>No findings detected</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Fuzzer ────────────────────────────────────────────────────
const DEFAULT_WORDLIST = `admin\ntest\napi\nv1\nv2\nlogin\nuser\nusers\ndashboard\nconfig\nsettings\nbackup\ndev\nstaging\nhidden\nsecret\npassword\ntoken\nkey\nid=1\nid=2\nid=100\nid=9999`;

function Fuzzer({ toast }) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://target.com/api/§FUZZ§');
  const [headers, setHeaders] = useState('User-Agent: HawkEye/1.0');
  const [body, setBody] = useState('');
  const [wordlist, setWordlist] = useState(DEFAULT_WORDLIST);
  const [threads, setThreads] = useState('5');
  const [delay, setDelay] = useState('0');
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const taskRef = useRef(null);

  const parseHeaders = (raw) => {
    const h = {};
    raw.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) h[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
    return h;
  };

  const startFuzz = async () => {
    setResults([]);
    setRunning(true);
    const payloads = wordlist.split('\n').map(s => s.trim()).filter(Boolean);
    setProgress({ done: 0, total: payloads.length });
    try {
      const res = await fetch(`${API}/api/fuzzer/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method, url, headers: parseHeaders(headers), body: body || null,
          wordlist: payloads, threads: parseInt(threads), delay_ms: parseInt(delay)
        })
      });
      const data = await res.json();
      taskRef.current = data.task_id;
      toast(`Fuzzer started: ${payloads.length} payloads`, 'info');
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
      setRunning(false);
    }
  };

  // Listen to WS events from parent via custom event
  useEffect(() => {
    const handler = (e) => {
      const msg = e.detail;
      if (msg.type === 'fuzzer_result' && msg.task_id === taskRef.current) {
        setResults(r => [...r, msg.data]);
        setProgress(msg.progress);
      }
      if (msg.type === 'fuzzer_done' && msg.task_id === taskRef.current) {
        setRunning(false);
        toast(`Fuzzing done: ${msg.total_results} results`, 'success');
      }
    };
    window.addEventListener('hawkeye_ws', handler);
    return () => window.removeEventListener('hawkeye_ws', handler);
  }, [toast]);

  const exportCSV = () => {
    const csv = ['#,Payload,Status,Length,Time(ms)'].concat(
      results.map((r, i) => `${i+1},"${r.payload}",${r.status || 'ERR'},${r.length || 0},${r.time_ms || 0}`)
    ).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'hawkeye_fuzz.csv'; a.click();
  };

  return (
    <div className="fuzzer-panel">
      <div className="fuzzer-config">
        <div className="form-row">
          <div className="form-group" style={{ flex: 0, minWidth: 100 }}>
            <label className="form-label">Method</label>
            <select className="form-input" value={method} onChange={e => setMethod(e.target.value)}>
              {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target URL (use §FUZZ§ as marker)</label>
            <input className="form-input" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Headers (one per line)</label>
            <textarea className="form-input" value={headers} onChange={e => setHeaders(e.target.value)} rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Body (optional, use §FUZZ§)</label>
            <textarea className="form-input" value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder='{"id": "§FUZZ§"}' />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Wordlist (one per line)</label>
            <textarea className="form-input" value={wordlist} onChange={e => setWordlist(e.target.value)} rows={3} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 120 }}>
            <div className="form-group">
              <label className="form-label">Threads</label>
              <input className="form-input" type="number" min={1} max={20} value={threads} onChange={e => setThreads(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Delay (ms)</label>
              <input className="form-input" type="number" min={0} value={delay} onChange={e => setDelay(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
            <button className={`btn ${running ? 'btn-danger' : 'btn-primary'}`} onClick={running ? () => setRunning(false) : startFuzz} style={{ height: 36 }}>
              {running ? <><Square size={13} /> Stop</> : <><Play size={13} /> Start Fuzz</>}
            </button>
            <button className="btn btn-ghost" onClick={exportCSV} disabled={!results.length} style={{ height: 36 }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>
        {(running || results.length > 0) && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#4a4a6a', marginBottom: 4 }}>
              <span>{progress.done}/{progress.total} requests</span>
              <span>{results.length} results</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%' }} />
            </div>
          </div>
        )}
      </div>
      <div className="fuzz-result-item header">
        <span>#</span><span>Payload</span><span>Status</span><span>Length</span><span>Time</span>
      </div>
      <div className="fuzzer-results">
        {results.length === 0 && (
          <div className="empty-state" style={{ marginTop: 60 }}><Zap size={32} /><p>Configure and run the fuzzer</p></div>
        )}
        {results.map((r, i) => (
          <div key={i} className="fuzz-result-item" style={{ background: r.status >= 200 && r.status < 300 ? '#0d2e1a20' : undefined }}>
            <span style={{ color: '#4a4a6a' }}>{r.idx + 1}</span>
            <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.payload}</span>
            <span className={`status-code ${statusColor(r.status)}`}>{r.status || 'ERR'}</span>
            <span style={{ color: '#a0a0c0' }}>{r.length ?? '—'}</span>
            <span className="time-badge">{r.time_ms ?? '—'}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scanner ────────────────────────────────────────────────────
function Scanner({ findings, onRefresh }) {
  const [filter, setFilter] = useState('');
  const filtered = findings.filter(f => !filter || f.severity === filter || f.type.includes(filter));
  const counts = findings.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc; }, {});

  return (
    <div className="scanner-panel">
      <div className="history-toolbar">
        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'High', 'Medium', 'Low', 'Info'].map(s => (
            <button key={s} className={`type-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s || 'All'} {s && counts[s] ? `(${counts[s]})` : ''}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={onRefresh}><RefreshCw size={13} />Refresh</button>
      </div>
      <div className="findings-list">
        {filtered.length === 0 && (
          <div className="empty-state" style={{ marginTop: 60 }}><ShieldAlert size={40} /><p>No findings yet. Send some requests!</p></div>
        )}
        {filtered.map(f => (
          <div key={f.id} className={`finding-card ${f.severity}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <span className={`severity-badge severity-${f.severity}`}>{f.severity}</span>
              <span style={{ fontSize: 10, color: '#4a4a6a', fontFamily: 'JetBrains Mono' }}>{new Date(f.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="finding-content">
              <div className="finding-type">{f.type}</div>
              <div className="finding-desc">{f.description}</div>
              <div className="finding-evidence">{f.evidence}</div>
              <div style={{ fontSize: 10, color: '#4a4a6a', marginTop: 4 }}>{f.url}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Decoder ───────────────────────────────────────────────────
function Decoder({ toast }) {
  const [encText, setEncText] = useState('');
  const [encType, setEncType] = useState('base64');
  const [encResult, setEncResult] = useState('');
  const [decText, setDecText] = useState('');
  const [decType, setDecType] = useState('base64');
  const [decResult, setDecResult] = useState('');

  const types = ['base64', 'base64url', 'url', 'html', 'hex'];

  const encode = async () => {
    if (!encText) return;
    const res = await fetch(`${API}/api/decoder/encode?text=${encodeURIComponent(encText)}&type=${encType}`);
    const data = await res.json();
    setEncResult(data.result || data.detail);
  };

  const decode = async () => {
    if (!decText) return;
    const res = await fetch(`${API}/api/decoder/decode?text=${encodeURIComponent(decText)}&type=${decType}`);
    const data = await res.json();
    setDecResult(data.result || data.detail);
  };

  return (
    <div className="decoder-panel">
      <div className="decoder-section">
        <div className="decoder-title"><Code2 size={14} /> Encoder</div>
        <div className="type-tabs">
          {types.map(t => <button key={t} className={`type-chip ${encType === t ? 'active' : ''}`} onClick={() => setEncType(t)}>{t}</button>)}
        </div>
        <textarea className="decoder-input" value={encText} onChange={e => setEncText(e.target.value)} placeholder="Input text to encode..." />
        <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
          <button className="btn btn-primary" onClick={encode}><Zap size={13} /> Encode</button>
          {encResult && <button className="btn btn-ghost" onClick={() => { copyToClipboard(encResult); toast('Copied!', 'success'); }}><Copy size={13} /> Copy</button>}
        </div>
        {encResult && <div className="decoder-output">{encResult}</div>}
      </div>
      <div className="decoder-section">
        <div className="decoder-title"><Code2 size={14} /> Decoder</div>
        <div className="type-tabs">
          {types.map(t => <button key={t} className={`type-chip ${decType === t ? 'active' : ''}`} onClick={() => setDecType(t)}>{t}</button>)}
        </div>
        <textarea className="decoder-input" value={decText} onChange={e => setDecText(e.target.value)} placeholder="Input encoded text to decode..." />
        <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
          <button className="btn btn-primary" onClick={decode}><Zap size={13} /> Decode</button>
          {decResult && <button className="btn btn-ghost" onClick={() => { copyToClipboard(decResult); toast('Copied!', 'success'); }}><Copy size={13} /> Copy</button>}
        </div>
        {decResult && <div className="decoder-output">{decResult}</div>}
      </div>
      <div className="decoder-section">
        <div className="decoder-title"><Info size={14} /> Quick Reference — Common Payloads</div>
        {[
          { label: 'XSS Basic', value: '<script>alert(1)</script>' },
          { label: 'XSS Img', value: '<img src=x onerror=alert(1)>' },
          { label: 'SQLi Basic', value: "' OR 1=1--" },
          { label: 'SQLi UNION', value: "' UNION SELECT NULL,NULL--" },
          { label: 'Path Traversal', value: '../../../etc/passwd' },
          { label: 'SSRF', value: 'http://169.254.169.254/latest/meta-data/' },
          { label: 'Open Redirect', value: '//evil.com' },
          { label: 'CRLF', value: '%0d%0aHeader:injected' },
        ].map(p => (
          <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1e1e30' }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{p.label}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#f97316' }}>{p.value}</span>
            <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 10 }}
              onClick={() => { copyToClipboard(p.value); toast('Copied!', 'success'); }}><Copy size={10} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Proxy Instructions ────────────────────────────────────────
function ProxyGuide() {
  return (
    <div className="proxy-instructions">
      <div className="instruction-card">
        <div className="instruction-title">🦅 HawkEye Proxy — How It Works</div>
        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
          HawkEye menggunakan backend FastAPI sebagai proxy forwarder. Kamu mengirim request melalui API <code className="code-inline">/api/repeater/send</code> atau langsung mencatat request ke <code className="code-inline">/api/history/add</code>.
        </p>
      </div>
      <div className="instruction-card">
        <div className="instruction-title">📡 Cara 1: Browser Extension (Recommended)</div>
        {[
          { s: 'Install ekstensi "Requestly" atau "ModHeader" di browser kamu' },
          { s: <>Set redirect rule: semua request ke target site → forward ke <code className="code-inline">http://localhost:8000/api/history/add</code></> },
          { s: 'Browse target site seperti biasa, semua traffic akan ter-capture di History tab' },
        ].map((s, i) => <div key={i} className="step"><div className="step-num">{i+1}</div><div className="step-text">{s.s}</div></div>)}
      </div>
      <div className="instruction-card">
        <div className="instruction-title">🐍 Cara 2: Python Script Logger</div>
        <div className="code-block">{`import requests, json

HAWKEYE = "http://localhost:8000"

def log_request(method, url, req_headers={}, req_body=None):
    """Kirim request & log ke HawkEye"""
    import time
    start = time.time()
    resp = requests.request(method, url, headers=req_headers, data=req_body, verify=False)
    elapsed = int((time.time() - start) * 1000)
    
    requests.post(f"{HAWKEYE}/api/history/add", json={
        "method": method, "url": url,
        "request_headers": dict(resp.request.headers),
        "request_body": req_body,
        "response_status": resp.status_code,
        "response_headers": dict(resp.headers),
        "response_body": resp.text[:50000],
        "response_time_ms": elapsed
    })
    return resp

# Contoh penggunaan
resp = log_request("GET", "https://target.com/api/user/1")
print(resp.status_code)`}</div>
      </div>
      <div className="instruction-card">
        <div className="instruction-title">⚡ Cara 3: Gunakan Repeater & Fuzzer Langsung</div>
        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
          Paling mudah: langsung gunakan tab <strong style={{ color: '#f97316' }}>Repeater</strong> untuk mengirim request manual, atau <strong style={{ color: '#f97316' }}>Fuzzer</strong> untuk otomasi. Semua request otomatis tersimpan ke History dan di-scan secara pasif.
        </p>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [findings, setFindings] = useState([]);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const { toasts, add: toast } = useToast();
  const wsRef = useRef(null);

  const loadHistory = useCallback(async () => {
    const res = await fetch(`${API}/api/history`);
    const data = await res.json();
    setHistory(data);
  }, []);

  const loadFindings = useCallback(async () => {
    const res = await fetch(`${API}/api/scan/results`);
    const data = await res.json();
    setFindings(data);
  }, []);

  useEffect(() => {
    loadHistory();
    loadFindings();
  }, [loadHistory, loadFindings]);

  useEffect(() => {
    const connect = () => {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;
      ws.onopen = () => setWsStatus('connected');
      ws.onclose = () => { setWsStatus('disconnected'); setTimeout(connect, 3000); };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent('hawkeye_ws', { detail: msg }));
        if (msg.type === 'new_request') {
          setHistory(h => [msg.data, ...h.slice(0, 999)]);
        }
        if (msg.type === 'new_findings') {
          loadFindings();
          toast(`${msg.data.length} new finding(s) on ${new URL(msg.url).hostname}`, 'info');
        }
      };
    };
    connect();
    return () => wsRef.current?.close();
  }, [loadFindings, toast]);

  const navItems = [
    { id: 'dashboard', icon: <BarChart2 size={18} />, label: 'Dashboard' },
    { id: 'history', icon: <Clock size={18} />, label: 'HTTP History' },
    { id: 'repeater', icon: <Send size={18} />, label: 'Repeater' },
    { id: 'fuzzer', icon: <Zap size={18} />, label: 'Fuzzer / Intruder' },
    { id: 'scanner', icon: <ShieldAlert size={18} />, label: 'Scanner' },
    { id: 'decoder', icon: <Code2 size={18} />, label: 'Decoder / Payloads' },
    { id: 'proxy', icon: <Globe size={18} />, label: 'Proxy Guide' },
  ];

  const tabNames = { dashboard: 'Dashboard', history: 'HTTP History', repeater: 'Repeater', fuzzer: 'Fuzzer / Intruder', scanner: 'Passive Scanner', decoder: 'Decoder & Payloads', proxy: 'Proxy Setup Guide' };

  return (
    <>
      <style>{styles}</style>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div className="app">
        <div className="sidebar">
          <div className="logo">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="12" stroke="#f97316" strokeWidth="2"/>
              <circle cx="13" cy="13" r="4" fill="#f97316"/>
              <line x1="13" y1="1" x2="13" y2="7" stroke="#f97316" strokeWidth="1.5"/>
              <line x1="13" y1="19" x2="13" y2="25" stroke="#f97316" strokeWidth="1.5"/>
              <line x1="1" y1="13" x2="7" y2="13" stroke="#f97316" strokeWidth="1.5"/>
              <line x1="19" y1="13" x2="25" y2="13" stroke="#f97316" strokeWidth="1.5"/>
            </svg>
          </div>
          {navItems.map(n => (
            <button key={n.id} className={`nav-btn ${tab === n.id ? 'active' : ''}`}
              title={n.label} onClick={() => setTab(n.id)}>
              {n.icon}
              {n.id === 'scanner' && findings.filter(f => f.severity === 'High').length > 0 && <span className="badge" />}
            </button>
          ))}
        </div>
        <div className="main">
          <div className="topbar">
            <span className="topbar-title">HAWKEYE</span>
            <span className="topbar-sep">›</span>
            <span className="topbar-sub">{tabNames[tab]}</span>
            <div className="ws-indicator">
              <div className={`ws-dot ${wsStatus}`} />
              <span style={{ color: wsStatus === 'connected' ? '#22c55e' : '#ef4444', fontSize: 11 }}>
                {wsStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="content">
            {tab === 'dashboard' && <Dashboard history={history} findings={findings} />}
            {tab === 'history' && <History history={history} onRefresh={() => { loadHistory(); loadFindings(); }} />}
            {tab === 'repeater' && <Repeater toast={toast} />}
            {tab === 'fuzzer' && <Fuzzer toast={toast} />}
            {tab === 'scanner' && <Scanner findings={findings} onRefresh={loadFindings} />}
            {tab === 'decoder' && <Decoder toast={toast} />}
            {tab === 'proxy' && <ProxyGuide />}
          </div>
        </div>
      </div>
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <Activity size={13} style={{ color: '#22c55e' }} />}
            {t.type === 'error' && <X size={13} style={{ color: '#ef4444' }} />}
            {t.type === 'info' && <Info size={13} style={{ color: '#f97316' }} />}
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
