import React, { useEffect, useMemo, useRef, useState } from 'react';
import './DashboardHomePage.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function formatCount(value) {
  return new Intl.NumberFormat('ro-RO').format(Number(value || 0));
}

function formatTime(value) {
  if (!value) return 'Acum câteva secunde';
  try {
    return new Date(value).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return 'Acum';
  }
}

function getTagVariant(log) {
  const action = String(log?.action || '').toLowerCase();
  const category = String(log?.category || '').toLowerCase();
  if (category === 'selfroles' || action.includes('selfrole')) return 'cyan';
  if (category === 'ticket' || action.includes('ticket')) return 'amber';
  if (category === 'moderation' || /ban|kick|warn|mute/.test(action)) return 'red';
  if (category === 'connect' || action.includes('connect')) return 'green';
  if (category === 'music' || action.includes('music')) return 'violet';
  return 'default';
}

function DashboardHomePage({ selectedServer, selectedServerId }) {
  const [logs, setLogs] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const connectLoggedRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;

    async function loadLogs() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/logs`);
        const payload = await response.json();
        if (!mounted) return;
        setLogs(Array.isArray(payload) ? payload : []);
        setUpdatedAt(new Date().toISOString());
      } catch {
        if (mounted) setLogs([]);
      }
    }

    loadLogs();
    const timer = setInterval(loadLogs, 6500);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!selectedServerId || connectLoggedRef.current.has(selectedServerId)) return;
    connectLoggedRef.current.add(selectedServerId);

    fetch(`${API_BASE_URL}/dashboard/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dashboard_connect',
        category: 'connect',
        actor: 'Dashboard user',
        botProfile: selectedServer?.botProfile || 'phoenix',
        server: selectedServer?.serverRole || selectedServerId,
        target: selectedServer?.label || selectedServer?.name || selectedServerId,
        details: 'Opened Phoenix dashboard home',
        ip: 'dashboard',
        location: { label: 'dashboard', country: 'local', city: 'local', estimated: false },
        socketId: 'dashboard-ui',
        userAgent: window.navigator.userAgent,
      }),
    }).catch(() => {});
  }, [selectedServer, selectedServerId]);

  const stats = useMemo(() => ([
    {
      label: 'Total Membri',
      value: formatCount(selectedServer?.membersTotal),
      note: `${selectedServer?.category || 'server'} · ${selectedServer?.location || '—'}`,
      glow: 'blurple',
    },
    {
      label: 'Membri Online',
      value: formatCount(selectedServer?.membersOnline),
      note: 'Live presence',
      glow: 'cyan',
    },
    {
      label: 'Tichete Active',
      value: formatCount(selectedServer?.ticketsActive),
      note: 'SLA flow',
      glow: 'violet',
    },
    {
      label: 'Server Boosters',
      value: formatCount(selectedServer?.boosters),
      note: 'Boost status',
      glow: 'green',
    },
  ]), [selectedServer]);

  const serverLogs = logs
    .filter((log) => {
      if (!selectedServer) return true;
      const serverKey = String(log?.server || '').toLowerCase();
      const category = String(log?.category || '').toLowerCase();
      const botProfile = String(log?.botProfile || '').toLowerCase();
      return [
        selectedServer.serverRole,
        selectedServer.id,
        selectedServer.category,
        selectedServer.botProfile,
      ].some((value) => value && [serverKey, category, botProfile].includes(String(value).toLowerCase())) || log?.action === 'dashboard_connect';
    })
    .slice(0, 8);

  return (
    <div className="dashboard-home">
      <section className="dashboard-hero glass-card">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">Dashboard Acasă</div>
          <h1>{selectedServer?.name || 'Phoenix Command Center'}</h1>
          <p>
            Interfață curată, sticlă mată, accente Blurple și Cyan Neon, plus flux de activitate staff în timp real.
          </p>
          <div className="dashboard-chip-row">
            {(selectedServer?.capabilities || []).map((capability) => (
              <span key={capability} className="dashboard-chip">{capability}</span>
            ))}
          </div>
        </div>

        <div className="dashboard-hero-side glass-card inner-glass">
          <div className="hero-side-label">Status server</div>
          <div className="hero-side-value">{selectedServer?.status || 'online'}</div>
          <div className="hero-side-meta">
            {selectedServer?.botDisplayName || 'Phoenix'} · {selectedServer?.location || '—'}
          </div>
          <div className="hero-side-divider" />
          <div className="hero-side-grid">
            <div>
              <span>Socket</span>
              <strong>Live</strong>
            </div>
            <div>
              <span>Ultima sync</span>
              <strong>{updatedAt ? formatTime(updatedAt) : 'Acum'}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className={`stat-card glass-card glow-${stat.glow}`}>
            <div className="stat-card-label">{stat.label}</div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-note">{stat.note}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-logs glass-card">
        <div className="section-head">
          <div>
            <div className="section-kicker">Live Activity Logs</div>
            <h2>Flux staff și dashboard events</h2>
          </div>
          <div className="section-badge">{serverLogs.length} evenimente</div>
        </div>

        <div className="activity-list">
          {serverLogs.map((log) => (
            <article key={log.id} className="activity-item">
              <div className="activity-item-main">
                <div className="activity-item-left">
                  <span className={`activity-tag tag-${getTagVariant(log)}`}>{String(log.category || log.action || 'event')}</span>
                  <strong>{log.actor || 'Dashboard'}</strong>
                  <span className="activity-action">{log.action}</span>
                </div>
                <div className="activity-time">{formatTime(log.createdAt)}</div>
              </div>
              <div className="activity-meta">
                <span>Server: {log.server || '—'}</span>
                <span>Țintă: {log.target || '—'}</span>
                <span>{log.details || 'Fără detalii suplimentare'}</span>
              </div>
            </article>
          ))}
          {serverLogs.length === 0 && <div className="activity-empty">Nu există încă activitate înregistrată pentru acest server.</div>}
        </div>
      </section>
    </div>
  );
}

export default DashboardHomePage;
