/* by Capitanul burcea,alex */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const modules = [
  { id: 'muzica', name: 'Muzică', icon: '🎵', path: '/muzica' },
  { id: 'jocuri', name: 'Jocuri', icon: '🎮', path: '/jocuri' },
  { id: 'economie', name: 'Economie', icon: '💰', path: '/economie' },
  { id: 'ranks', name: 'Ranks', icon: '🏆', path: '/ranks' },
  { id: 'moderare', name: 'Moderare', icon: '🛡️', path: '/moderare' },
  { id: 'setari', name: 'Setări', icon: '⚙️', path: '/setari' },
  { id: 'loguri', name: 'Loguri', icon: '📋', path: '/loguri' },
];

function Sidebar({ currentModule, setCurrentModule }) {
  const navigate = useNavigate();
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadServers() {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/servers');
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
        <h1 className="logo">Phoenix<span className="logo-accent">.js</span></h1>
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
        {modules.map((module) => (
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
