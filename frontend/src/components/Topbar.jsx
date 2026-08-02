/* by Capitanul burcea,alex */
import React from 'react';
import './Topbar.css';

const moduleLabels = {
  home: 'Dashboard Acasă',
  config: 'Configurare Bot',
  members: 'Management Membri',
  ai: 'MODULĂRI AI',
  tickets: 'SISTEM TICKETS',
  monetizare: 'MONETIZARE',
  stats: 'STATISTICI & LOGS',
  advanced: 'SETĂRI AVANSATE',
  muzica: 'Music Control Hub',
  jocuri: 'Server Analytics',
  economie: 'Economy Metrics',
  ranks: 'Leveling System',
  moderare: 'Moderation Center',
  setari: 'Settings Matrix',
  loguri: 'Event Logs',
  selfroles: 'Self Roles Manager',
  templates: 'Server Templates',
  jarvis: 'Jarvis Voice AI',
  automod: 'Auto Moderation',
  welcome: 'Welcome Flow',
  tickets: 'Tickets & Support',
  gamespanel: 'Games Panel Access',
  backup: 'Server Backups',
  integrations: 'Integrations Hub',
};

function Topbar({ isBotOnline, ping, uptime, currentModule, servers = [], selectedServerId, onServerChange }) {
  const panelTitle = moduleLabels[currentModule] || 'Discord Dashboard';
  const activeServer = servers.find((server) => server.id === selectedServerId) || servers[0] || null;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="panel-eyebrow">Phoenix Command Center</div>
        <h2 className="page-title">{panelTitle}</h2>
        <p className="page-subtitle">Realtime telemetry, engagement metrics and bot orchestration.</p>
      </div>

      <div className="topbar-right">
        <div className="server-picker glass-chip">
          <label className="server-picker-label" htmlFor="dashboard-server">Server</label>
          <select
            id="dashboard-server"
            className="server-picker-select"
            value={selectedServerId}
            onChange={(event) => onServerChange?.(event.target.value)}
          >
            {servers.length === 0 && <option value="">Nu există servere</option>}
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.label}
              </option>
            ))}
          </select>
        </div>

        <div className="topbar-meta glass-chip">
          <div className={`status-indicator ${isBotOnline ? 'online' : 'offline'}`}></div>
          <span className="status-text">{isBotOnline ? 'Online' : 'Offline'}</span>
          <span className="status-divider" />
          <span className="status-meta">Ping {ping}</span>
          <span className="status-divider" />
          <span className="status-meta">Uptime {uptime}</span>
        </div>

        <div className="user-glow-wrap">
          <div className="user-glow-ring"></div>
          <div className="user-avatar">AP</div>
          <div className="user-mini">
            <strong>Admin</strong>
            <span>{activeServer?.botDisplayName || 'Dashboard Operator'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;
