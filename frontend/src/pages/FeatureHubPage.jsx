import React from 'react';
import './FeatureHubPage.css';

function FeatureHubPage({ title, description, pillars = [] }) {
  return (
    <div className="feature-hub-page">
      <div className="feature-hub-hero">
        <div className="feature-hub-badge">Restructurare extinsa in progres</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="feature-pillar-grid">
        {pillars.map((pillar) => (
          <article key={pillar.name} className="feature-pillar-card">
            <div className="feature-pillar-icon">{pillar.icon}</div>
            <h3>{pillar.name}</h3>
            <p>{pillar.text}</p>
            <div className="feature-pillar-status">Planned</div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default FeatureHubPage;
