/* by Capitanul burcea,alex */
import React, { useEffect, useMemo, useState } from 'react';
import './SettingsPage.css';

const API_BASE = 'http://localhost:5000';
const ROLE_OPTIONS = ['owner', 'admin', 'moderator', 'support', 'viewer'];

const FALLBACK_MODULES = [
  { id: 'muzica', name: 'Muzică', roles: ['owner', 'admin', 'moderator'] },
  { id: 'jocuri', name: 'Jocuri', roles: ['owner', 'admin'] },
  { id: 'economie', name: 'Economie', roles: ['owner', 'admin', 'moderator'] },
  { id: 'ranks', name: 'Ranks', roles: ['owner', 'admin'] },
  { id: 'moderare', name: 'Moderare', roles: ['owner', 'admin', 'moderator'] },
  { id: 'setari', name: 'Setări', roles: ['owner', 'admin'] },
  { id: 'loguri', name: 'Loguri', roles: ['owner', 'admin'] },
];

const FALLBACK_BOTS = [
  { profile: 'phoenix', displayName: 'Update Phoenix', model: 'shared-premium', copyright: 'by Capitanul burcea,alex' },
  { profile: 'caisata', displayName: 'Caisata Community', model: 'shared-premium', copyright: 'by Capitanul burcea,alex' },
  { profile: 'bsh', displayName: 'BSH Fantasy', model: 'shared-premium', copyright: 'by Capitanul burcea,alex' },
  { profile: 'staffbsh', displayName: 'BSH Community Staff', model: 'staff-control', copyright: 'by Capitanul burcea,alex' },
  { profile: 'gamespanel', displayName: 'Gamespanel Bot', model: 'games-control', copyright: 'by Capitanul burcea,alex' },
];

function SettingsPage() {
  const [permissions, setPermissions] = useState({ modules: FALLBACK_MODULES, updatedAt: new Date().toISOString() });
  const [logs, setLogs] = useState([]);
  const [bots, setBots] = useState(FALLBACK_BOTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      try {
        const [permissionsRes, logsRes, botsRes] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/permissions`),
          fetch(`${API_BASE}/api/dashboard/logs`),
          fetch(`${API_BASE}/api/dashboard/bots`),
        ]);

        const permissionsJson = await permissionsRes.json();
        const logsJson = await logsRes.json();
        const botsJson = await botsRes.json();

        if (!mounted) {
          return;
        }

        setPermissions({
          updatedAt: permissionsJson.updatedAt || new Date().toISOString(),
          modules: Array.isArray(permissionsJson.modules) && permissionsJson.modules.length > 0 ? permissionsJson.modules : FALLBACK_MODULES,
        });
        setLogs(Array.isArray(logsJson) ? logsJson : []);
        setBots(Array.isArray(botsJson) && botsJson.length > 0 ? botsJson : FALLBACK_BOTS);
      } catch {
        if (mounted) {
          setPermissions((current) => ({ ...current, modules: FALLBACK_MODULES }));
          setLogs([]);
          setBots(FALLBACK_BOTS);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const uniqueRoles = useMemo(() => ROLE_OPTIONS, []);

  const handleLogAction = async (action, category) => {
    await fetch(`${API_BASE}/api/dashboard/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        category,
        actor: 'Phoenix dashboard user',
        botProfile: 'phoenix',
        server: 'main',
        details: `${action} from settings`,
      }),
    });
  };

  const toggleRole = (moduleId, role) => {
    setPermissions((current) => ({
      ...current,
      modules: current.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        const roles = new Set(module.roles || []);
        if (roles.has(role)) {
          roles.delete(role);
        } else {
          roles.add(role);
        }

        return { ...module, roles: Array.from(roles) };
      }),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/dashboard/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: permissions.modules }),
      });

      const json = await response.json();
      setPermissions({
        updatedAt: json.updatedAt || new Date().toISOString(),
        modules: Array.isArray(json.modules) ? json.modules : permissions.modules,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">⚙️ Setări</h1>
        <p className="page-desc">Configurează botul, permisiunile și auditul dashboard-ului Phoenix</p>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h3 className="section-title">🔄 Control Bot</h3>
          <div className="setting-group">
            <button className="btn-danger">Restart Bot</button>
            <button className="btn-save" style={{ marginLeft: 12 }} onClick={() => handleLogAction('settings_restart_click', 'moderation')}>
              Log restart action
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">🧩 Model unificat pentru boti</h3>
          <p className="section-desc">Aceeași schemă se aplică pentru Phoenix, Caisata, BSH și BSH Fantasy.</p>
          <div className="permission-grid" style={{ marginTop: 16 }}>
            {bots.map((bot) => (
              <div key={bot.profile} className="permission-card">
                <div className="permission-card-head">
                  <h4>{bot.displayName}</h4>
                  <span className="permission-chip">{bot.profile}</span>
                </div>
                <div className="role-chip-row">
                  <span className="role-chip active">{bot.model}</span>
                  <span className="role-chip active">{bot.copyright}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">🔗 Permisiuni pe module</h3>
              <p className="section-desc">Alege ce roluri pot folosi fiecare modul din dashboard.</p>
            </div>
            <button className="btn-save" onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Se salvează...' : 'Salvează setările'}
            </button>
          </div>

          <div className="permission-grid">
            {permissions.modules.map((module) => (
              <div key={module.id} className="permission-card">
                <div className="permission-card-head">
                  <h4>{module.name}</h4>
                  <span className="permission-chip">{module.id}</span>
                </div>
                <div className="role-chip-row">
                  {uniqueRoles.map((role) => {
                    const active = (module.roles || []).includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        className={`role-chip ${active ? 'active' : ''}`}
                        onClick={() => toggleRole(module.id, role)}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="section-desc" style={{ marginTop: 16 }}>
            Ultima salvare: {permissions.updatedAt ? new Date(permissions.updatedAt).toLocaleString('ro-RO') : 'necunoscut'}
          </p>
        </div>

        <div className="settings-section">
          <h3 className="section-title">🔒 Log de conectare</h3>
          <p className="section-desc">Cine s-a conectat, de unde și cu locație estimativă.</p>

          <div className="audit-log-list">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="audit-log-item">
                <div className="audit-log-main">
                  <strong>{log.actor}</strong>
                  <span>{log.action}</span>
                </div>
                <div className="audit-log-meta">
                  <span>IP: {log.ip}</span>
                  <span>Locație: {log.location?.label || 'Unknown'}</span>
                  <span>{log.location?.estimated ? 'estimativ' : 'local'}</span>
                  <span>{log.createdAt ? new Date(log.createdAt).toLocaleString('ro-RO') : '-'}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="audit-log-empty">Nu există încă loguri de conectare.</div>}
          </div>

          <div className="setting-group" style={{ marginTop: 16 }}>
            <button className="btn-save" onClick={() => handleLogAction('moderation_timeout', 'moderation')}>Log moderare</button>
            <button className="btn-save" style={{ marginLeft: 12 }} onClick={() => handleLogAction('ticket_claim', 'ticket')}>Log ticket</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
