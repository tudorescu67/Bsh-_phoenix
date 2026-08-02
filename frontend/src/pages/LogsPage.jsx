/* by Capitanul burcea,alex */
import React, { useEffect, useState } from 'react';
import './SettingsPage.css';

const API_BASE = 'http://localhost:5000';
const DEFAULT_FORM = {
  action: 'moderation_ban',
  category: 'moderation',
  actor: 'Phoenix dashboard user',
  botProfile: 'phoenix',
  server: 'main',
  target: '',
  details: '',
};

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    let mounted = true;

    async function loadLogs() {
      try {
        const response = await fetch(`${API_BASE}/api/dashboard/logs`);
        const json = await response.json();

        if (mounted) {
          setLogs(Array.isArray(json) ? json : []);
        }
      } catch {
        if (mounted) {
          setLogs([]);
        }
      }
    }

    loadLogs();

    return () => {
      mounted = false;
    };
  }, []);

  const connectedCount = logs.filter((log) => log.action === 'dashboard_connect').length;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch(`${API_BASE}/api/dashboard/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      const json = await response.json();
      setLogs((current) => [json, ...current]);
      setForm(DEFAULT_FORM);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">📋 Loguri Dashboard</h1>
        <p className="page-desc">Conectări, IP-uri și locații estimative pentru accesul în Phoenix.</p>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h3 className="section-title">➕ Adaugă log de acțiune</h3>
          <p className="section-desc">Poți adăuga rapid log pentru moderare sau ticket, nu doar conectare.</p>
          <form className="permission-grid" style={{ marginTop: 16 }} onSubmit={handleSubmit}>
            <div className="permission-card">
              <div className="permission-card-head"><h4>Tip</h4></div>
              <select className="server-select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="moderation">Moderare</option>
                <option value="ticket">Ticket</option>
                <option value="connect">Conectare</option>
              </select>
              <input className="server-select" style={{ marginTop: 10 }} placeholder="acțiune" value={form.action} onChange={(event) => setForm({ ...form, action: event.target.value })} />
            </div>
            <div className="permission-card">
              <div className="permission-card-head"><h4>Țintă</h4></div>
              <input className="server-select" placeholder="utilizator / ticket / canal" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} />
              <input className="server-select" style={{ marginTop: 10 }} placeholder="detalii" value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} />
            </div>
            <div className="permission-card">
              <div className="permission-card-head"><h4>Bot / server</h4></div>
              <input className="server-select" placeholder="bot profile" value={form.botProfile} onChange={(event) => setForm({ ...form, botProfile: event.target.value })} />
              <input className="server-select" style={{ marginTop: 10 }} placeholder="server" value={form.server} onChange={(event) => setForm({ ...form, server: event.target.value })} />
              <button className="btn-save" style={{ marginTop: 12 }} type="submit">Salvează log</button>
            </div>
          </form>
        </div>

        <div className="settings-section">
          <h3 className="section-title">🛰️ Conectări totale</h3>
          <p className="section-desc">{connectedCount} sesiuni de dashboard detectate.</p>
        </div>

        <div className="settings-section">
          <h3 className="section-title">🔐 Istoric acces</h3>
          <div className="audit-log-list">
            {logs.map((log) => (
              <div key={log.id} className="audit-log-item">
                <div className="audit-log-main">
                  <strong>{log.actor}</strong>
                  <span>{log.action}</span>
                </div>
                <div className="audit-log-meta">
                  <span>IP: {log.ip}</span>
                  <span>Locație: {log.location?.label || 'Unknown'}</span>
                  <span>{log.location?.estimated ? 'estimativ' : 'local'}</span>
                  <span>{log.createdAt ? new Date(log.createdAt).toLocaleString('ro-RO') : '-'}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="audit-log-empty">Nu există încă conectări înregistrate.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogsPage;