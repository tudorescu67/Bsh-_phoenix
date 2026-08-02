/* by Capitanul burcea,alex */
import React from 'react';
import './RanksPage.css';

function RanksPage() {
  const leaderboard = [
    { rank: 1, name: 'ProPlayer', level: 85, xp: 125000, avatar: '👑' },
    { rank: 2, name: 'GamerElite', level: 78, xp: 98000, avatar: '🥈' },
    { rank: 3, name: 'ChatMaster', level: 72, xp: 87000, avatar: '🥉' },
    { rank: 4, name: 'MusicLover', level: 65, xp: 72000, avatar: '👤' },
    { rank: 5, name: 'NewMember', level: 45, xp: 45000, avatar: '👤' },
  ];

  return (
    <div className="ranks-page">
      <div className="page-header">
        <h1 className="page-title">🏆 Ranks</h1>
        <p className="page-desc">Leaderboard și profiluri</p>
      </div>

      <div className="ranks-grid">
        <div className="leaderboard-card">
          <h3 className="card-title">📊 Top Utilizatori</h3>
          <div className="leaderboard-list">
            {leaderboard.map((user) => (
              <div key={user.rank} className="leaderboard-item">
                <div className="rank-number">{user.avatar}</div>
                <div className="user-avatar">{user.avatar}</div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-level">Nivel {user.level}</div>
                </div>
                <div className="user-xp">{user.xp.toLocaleString()} XP</div>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-preview">
          <h3 className="card-title">👤 Profil Preview</h3>
          <div className="profile-card">
            <div className="profile-avatar">👤</div>
            <div className="profile-name">Your Name</div>
            <div className="profile-level">Nivel 50</div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: '65%' }}></div>
            </div>
            <div className="xp-text">65,000 / 100,000 XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RanksPage;
