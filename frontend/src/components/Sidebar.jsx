/* by Capitanul burcea,alex */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const navGroups = [
  [
    { id: 'home', name: 'Dashboard Acasă', path: '/' , icon: 'home' },
    { id: 'config', name: 'Configurare Bot', path: '/setari', icon: 'settings' },
    { id: 'members', name: 'Management Membri', path: '/members', icon: 'users' },
  ],
  [
    { id: 'ai', name: '🎛️ MODULĂRI AI', path: '/auto-moderation', icon: 'spark' },
    { id: 'tickets', name: '🎫 SISTEM TICKETS', path: '/tickets', icon: 'ticket' },
    { id: 'monetizare', name: '📈 MONETIZARE', path: '/economie', icon: 'chart' },
  ],
  [
    { id: 'stats', name: '📊 STATISTICI & LOGS', path: '/loguri', icon: 'logs' },
    { id: 'advanced', name: '⚙️ SETĂRI AVANSATE', path: '/integrations', icon: 'cog' },
  ],
];

function NavIcon({ type }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

  switch (type) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.75V21h13V9.75" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
          <path d="M4.75 12a7.25 7.25 0 0 1 .12-1.35l-2.12-1.62 2.2-3.81 2.5.98a7.5 7.5 0 0 1 2.36-1.36l.38-2.66h4.4l.38 2.66a7.5 7.5 0 0 1 2.36 1.36l2.5-.98 2.2 3.81-2.12 1.62c.08.45.12.9.12 1.35s-.04.9-.12 1.35l2.12 1.62-2.2 3.81-2.5-.98a7.5 7.5 0 0 1-2.36 1.36l-.38 2.66h-4.4l-.38-2.66a7.5 7.5 0 0 1-2.36-1.36l-2.5.98-2.2-3.81 2.12-1.62c-.08-.45-.12-.9-.12-1.35Z" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M16.5 20.25v-1.5a4.5 4.5 0 0 0-4.5-4.5H8a4.5 4.5 0 0 0-4.5 4.5v1.5" />
          <path d="M12 12a3.75 3.75 0 1 0 0-7.5A3.75 3.75 0 0 0 12 12Z" />
          <path d="M18.75 20.25v-1.08a3.75 3.75 0 0 0-2.9-3.65" />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m13 3-3 7H3l6 4-2 7 6-4 6 4-2-7 6-4h-7l-3-7Z" />
        </svg>
      );
    case 'ticket':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4.5 8.25a2.25 2.25 0 0 1 2.25-2.25h10.5a2.25 2.25 0 0 1 2.25 2.25 2.25 2.25 0 0 0 0 4.5 2.25 2.25 0 0 1 0 4.5 2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25a2.25 2.25 0 0 0 0-4.5 2.25 2.25 0 0 1 0-4.5Z" />
          <path d="M12 7.75v8.5" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4.5 19.5h15" />
          <path d="M7.5 16.5v-4.5" />
          <path d="M12 16.5V7.5" />
          <path d="M16.5 16.5v-7.5" />
        </svg>
      );
    case 'logs':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M5.25 4.5h13.5v15H5.25z" />
          <path d="M8 8.5h8" />
          <path d="M8 12h8" />
          <path d="M8 15.5h5" />
        </svg>
      );
    case 'cog':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
          <path d="M19 12h2" /><path d="M3 12h2" /><path d="M12 3v2" /><path d="M12 19v2" />
        </svg>
      );
    default:
      return null;
  }
}

function Sidebar({ currentModule, setCurrentModule }) {
  const navigate = useNavigate();

  const handleModuleClick = (module) => {
    setCurrentModule(module.id);
    navigate(module.path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">Phoenix<span className="logo-accent">Dashboard</span></h1>
        <div className="logo-subtitle">UI shell 2026</div>
      </div>

      <nav className="sidebar-nav">
        {navGroups.map((group, index) => (
          <React.Fragment key={group.map((item) => item.id).join('-')}>
            <div className="nav-section-block">
              {group.map((module) => (
              <button
                key={module.id}
                className={`nav-item ${currentModule === module.id ? 'active' : ''}`}
                onClick={() => handleModuleClick(module)}
              >
                <span className="nav-icon"><NavIcon type={module.icon} /></span>
                <span className="nav-text">{module.name}</span>
              </button>
              ))}
            </div>
            {index < navGroups.length - 1 && <div className="nav-separator" />}
          </React.Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">AP</div>
          <div className="user-details">
            <div className="user-name">Admin</div>
            <div className="user-role">Dashboard Operator</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
