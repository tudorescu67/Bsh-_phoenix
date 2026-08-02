/* by Capitanul burcea,alex */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const modules = [
  { id: 'jocuri', name: 'Server Analytics', icon: '📈', path: '/jocuri' },
  { id: 'moderare', name: 'Moderation', icon: '🛡️', path: '/moderare' },
  { id: 'ranks', name: 'Leveling System', icon: '🧬', path: '/ranks' },
  { id: 'setari', name: 'Settings', icon: '⚙️', path: '/setari' },
  { id: 'muzica', name: 'Music Control', icon: '🎵', path: '/muzica' },
  { id: 'economie', name: 'Economy', icon: '💠', path: '/economie' },
  { id: 'loguri', name: 'Event Logs', icon: '🛰️', path: '/loguri' },
];

function Sidebar({ currentModule, setCurrentModule }) {
  const navigate = useNavigate();
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadServers() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/servers`);
        const json = await response.json();

        if (mounted) {
          setServers(Array.isArray(json) ? json : []);
          setSelectedServerId((json || [])[0]?.id || '');
        }
      } catch {
        if (mounted) {
          setServers([]);
          setSelectedServerId('');
        }
      }
    }

    loadServers();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId) || servers[0],
    [servers, selectedServerId]
  );

  const handleModuleClick = (module) => {
    setCurrentModule(module.id);
    navigate(module.path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">Phoenix<span className="logo-accent">Pulse</span></h1>
        <div className="logo-subtitle">Discord Command Center</div>
      </div>

      <div className="server-selector">
        <select
          className="server-select"
          value={selectedServerId}
          onChange={(event) => setSelectedServerId(event.target.value)}
        >
          {servers.length === 0 && <option value="">📢 Server Principal</option>}
          {servers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.label} · {server.botDisplayName}
            </option>
          ))}
        </select>
        {selectedServer && (
          <div className="server-selector-meta">
            <div className="server-selector-title">{selectedServer.name}</div>
            <div className="server-selector-subtitle">
              {selectedServer.botDisplayName} · {selectedServer.category} · {selectedServer.location}
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Systems</div>
        {modules.slice(0, 4).map((module) => (
          <button
            key={module.id}
            className={`nav-item ${currentModule === module.id ? 'active' : ''}`}
            onClick={() => handleModuleClick(module)}
          >
            <span className="nav-icon">{module.icon}</span>
            <span className="nav-text">{module.name}</span>
          </button>
        ))}

        <div className="nav-section-title">Operations</div>
        {modules.slice(4).map((module) => (
          <button
            key={module.id}
            className={`nav-item ${currentModule === module.id ? 'active' : ''}`}
            onClick={() => handleModuleClick(module)}
          >
            <span className="nav-icon">{module.icon}</span>
            <span className="nav-text">{module.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">Admin</div>
            <div className="user-role">Server Owner</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
