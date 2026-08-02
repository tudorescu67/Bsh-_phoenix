/* by Capitanul burcea,alex */
import React from 'react';
import './ModerationPage.css';

function ModerationPage() {
  return (
    <div className="moderation-page">
      <div className="page-header">
        <h1 className="page-title">🛡️ Moderare</h1>
        <p className="page-desc">Gestionare membri și reguli</p>
      </div>

      <div className="moderation-grid">
        <div className="mod-card">
          <h3 className="card-title">🔨 Acțiuni rapide</h3>
          <div className="mod-actions">
            <button className="mod-btn ban">Ban</button>
            <button className="mod-btn kick">Kick</button>
            <button className="mod-btn mute">Mute</button>
            <button className="mod-btn warn">Warn</button>
          </div>
        </div>

        <div className="mod-card">
          <h3 className="card-title">📜 Log-uri recente</h3>
          <div className="log-list">
            <div className="log-item">User1 a primit warn</div>
            <div className="log-item">User2 a fost mutat</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModerationPage;
