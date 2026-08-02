/* by Capitanul burcea,alex */
import React from 'react';
import './GamesPage.css';

function GamesPage() {
  return (
    <div className="games-page">
      <div className="page-header">
        <h1 className="page-title">🎮 Jocuri</h1>
        <p className="page-desc">Gestionare jocuri și leaderboard-uri</p>
      </div>

      <div className="games-grid">
        <div className="game-card">
          <div className="game-icon">🎲</div>
          <div className="game-info">
            <h3>Roll</h3>
            <p>Aruncă zarurile</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked />
            <span className="slider"></span>
          </label>
        </div>

        <div className="game-card">
          <div className="game-icon">🃏</div>
          <div className="game-info">
            <h3>Blackjack</h3>
            <p>Joc de cărți</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked />
            <span className="slider"></span>
          </label>
        </div>

        <div className="game-card">
          <div className="game-icon">🎯</div>
          <div className="game-info">
            <h3>Coinflip</h3>
            <p>Heads or Tails</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default GamesPage;
