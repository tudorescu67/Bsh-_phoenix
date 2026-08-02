/* by Capitanul burcea,alex */
import React from 'react';
import './Topbar.css';

function Topbar({ isBotOnline, ping, uptime }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2 className="page-title">Dashboard</h2>
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
      </div>
    </div>
  );
}

export default Topbar;
