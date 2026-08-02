import React, { useEffect, useMemo, useState } from 'react';
import './SelfRolesPage.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function onlyDigits(value) {
  return value.replace(/\D+/g, '');
}

function SelfRolesPage() {
  const [roleId, setRoleId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [status, setStatus] = useState('');
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [configSource, setConfigSource] = useState('dashboard');
  const [panelTitle, setPanelTitle] = useState('');
  const [panelDescription, setPanelDescription] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadServers() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/servers`);
        const payload = await response.json();
        const list = Array.isArray(payload) ? payload : [];

        if (!mounted) return;
        setServers(list);

        const firstServerId = list[0]?.id || '';
        setSelectedServerId((current) => current || firstServerId);
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

  useEffect(() => {
    if (!selectedServerId) return;

    let mounted = true;

    async function loadConfig() {
      setLoading(true);
      setStatus('Se încarcă date reale pentru serverul selectat...');

      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/selfroles?serverId=${encodeURIComponent(selectedServerId)}`);
        const payload = await response.json();
        const config = payload?.config || null;

        if (!mounted) return;

        setRoleId(config?.roleId || '');
        setChannelId(config?.channelId || '');
        setUpdatedAt(config?.updatedAt || '');
        setConfigSource(config?.source || 'dashboard');
        setPanelTitle(config?.title || '');
        setPanelDescription(config?.description || '');
        setStatus(config ? 'Config încărcat din backend.' : 'Niciun config salvat încă pentru acest server.');
      } catch {
        if (mounted) {
          setStatus('Nu am putut încărca config-ul de self-roles din backend.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadConfig();

    return () => {
      mounted = false;
    };
  }, [selectedServerId]);

  const roleValid = useMemo(() => roleId.length >= 17, [roleId]);
  const channelValid = useMemo(() => channelId.length >= 17, [channelId]);

  const handleSave = async () => {
    if (!roleValid || !channelValid) {
      setStatus('Completeaza ID Rol si ID Canal cu valori valide (snowflake Discord).');
      return;
    }

    if (!selectedServerId) {
      setStatus('Selecteaza un server inainte de salvare.');
      return;
    }

    setSaving(true);
    setStatus('Se salvează în backend...');

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/selfroles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedServerId,
          roleId,
          channelId,
          updatedBy: 'dashboard-user',
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Salvare esuata.');

      setUpdatedAt(payload?.config?.updatedAt || new Date().toISOString());
      setConfigSource(payload?.config?.source || 'dashboard');
      setPanelTitle(payload?.config?.title || panelTitle);
      setPanelDescription(payload?.config?.description || panelDescription);
      setStatus('Configuratia a fost salvata in backend si auditata.');
    } catch (error) {
      setStatus(error.message || 'Salvare esuata.');
    } finally {
      setSaving(false);
    }
  };

  const selectedServer = servers.find((server) => server.id === selectedServerId) || servers[0];

  return (
    <div className="selfroles-page">
      <div className="selfroles-hero">
        <div className="selfroles-badge">Self Roles Setup</div>
        <h1>Role Access Mapping</h1>
        <p>Conectare reală la backend pe serverul selectat: ID Rol și ID Canal, salvate cu audit și date persistente.</p>
      </div>

      <div className="selfroles-toolbar">
        <div className="selfroles-toolbar-label">Server activ</div>
        <select
          className="selfroles-server-select"
          value={selectedServerId}
          onChange={(event) => setSelectedServerId(event.target.value)}
        >
          {servers.length === 0 && <option value="">Nu exista servere</option>}
          {servers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.label} · {server.botDisplayName}
            </option>
          ))}
        </select>
        {selectedServer && <div className="selfroles-toolbar-meta">{selectedServer.name} · {selectedServer.location}</div>}
      </div>

      <div className="selfroles-grid">
        <section className="selfroles-card">
          <h2>ID Rol</h2>
          <p>Introdu ID-ul rolului pe care utilizatorii il pot lua din panel.</p>
          <input
            type="text"
            inputMode="numeric"
            value={roleId}
            onChange={(event) => setRoleId(onlyDigits(event.target.value))}
            placeholder="Ex: 123456789012345678"
            className={`selfroles-input ${roleValid || roleId.length === 0 ? '' : 'invalid'}`}
          />
          <div className="hint-line">Se accepta doar cifre.</div>
        </section>

        <section className="selfroles-card">
          <h2>ID Canal</h2>
          <p>Introdu ID-ul canalului unde va fi publicat panel-ul de self-roles.</p>
          <input
            type="text"
            inputMode="numeric"
            value={channelId}
            onChange={(event) => setChannelId(onlyDigits(event.target.value))}
            placeholder="Ex: 123456789012345678"
            className={`selfroles-input ${channelValid || channelId.length === 0 ? '' : 'invalid'}`}
          />
          <div className="hint-line">Canal text recomandat pentru panel.</div>
        </section>
      </div>

      <div className="selfroles-actions">
        <button type="button" onClick={handleSave} className="save-btn" disabled={saving || loading}>
          {saving ? 'Se salvează...' : 'Salveaza configuratia'}
        </button>
        {status ? <div className="status-line">{status}</div> : null}
        {configSource ? <div className="status-line">Sursa datelor: {configSource}</div> : null}
        {panelTitle ? <div className="status-line">Titlu panel: {panelTitle}</div> : null}
        {panelDescription ? <div className="status-line">Descriere: {panelDescription}</div> : null}
        {updatedAt ? <div className="status-line">Ultima actualizare: {new Date(updatedAt).toLocaleString('ro-RO')}</div> : null}
      </div>
    </div>
  );
}

export default SelfRolesPage;
