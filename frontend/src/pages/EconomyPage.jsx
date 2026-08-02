/* by Capitanul burcea,alex */
import React from 'react';
import './EconomyPage.css';

function EconomyPage() {
  return (
    <div className="economy-page">
      <div className="page-header">
        <h1 className="page-title">💰 Economie</h1>
        <p className="page-desc">Gestionare bani și tranzacții</p>
      </div>

      <div className="economy-stats">
        <div className="stat-card">
          <div className="stat-icon">🏦</div>
          <div className="stat-content">
            <div className="stat-label">Total în circulație</div>
            <div className="stat-value">1,245,670 B$</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">Utilizatori activi</div>
            <div className="stat-value">156</div>
          </div>
        </div>
      </div>

      <div className="economy-grid">
        <div className="panel">
          <h3 className="panel-title">📊 Tranzacții recente</h3>
          <div className="transaction-list">
            <div className="transaction-item">
              <span>User1</span>
              <span className="positive">+500 B$</span>
            </div>
            <div className="transaction-item">
              <span>User2</span>
              <span className="negative">-200 B$</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">🛒 Magazin</h3>
          <button className="btn-primary">Adaugă produs</button>
        </div>
      </div>
    </div>
  );
}

export default EconomyPage;
