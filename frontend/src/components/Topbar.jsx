/* by Capitanul burcea,alex */
import React from 'react';
import './Topbar.css';

const moduleLabels = {
  muzica: 'Music Control Hub',
  jocuri: 'Server Analytics',
  economie: 'Economy Metrics',
  ranks: 'Leveling System',
  moderare: 'Moderation Center',
  setari: 'Settings Matrix',
  loguri: 'Event Logs',
};

function Topbar({ isBotOnline, ping, uptime, currentModule }) {
  const panelTitle = moduleLabels[currentModule] || 'Discord Dashboard';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="panel-eyebrow">Phoenix Command Center</div>
        <h2 className="page-title">{panelTitle}</h2>
        <p className="page-subtitle">Realtime telemetry, engagement metrics and bot orchestration.</p>
      </div>

      <div className="topbar-right">
        <div className="bot-status">
          <div className={`status-indicator ${isBotOnline ? 'online' : 'offline'}`}></div>
          <span className="status-text">{isBotOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Ping</span>
          <span className="stat-value">{ping}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Uptime</span>
          <span className="stat-value">{uptime}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Active Members</span>
          <span className="stat-value">1,284</span>
        </div>

        <div className="activity-feed">
          <div className="activity-dot"></div>
          <span>Feed Active</span>
        </div>
      </div>
    </div>
  );
}

export default Topbar;
