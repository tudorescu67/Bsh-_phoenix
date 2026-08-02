import React, { useEffect, useMemo, useState } from 'react';
import './SelfRolesPage.css';

const STORAGE_KEY = 'phoenix_selfroles_config_v1';

function onlyDigits(value) {
  return value.replace(/\D+/g, '');
}

function SelfRolesPage() {
  const [roleId, setRoleId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setRoleId(parsed.roleId || '');
      setChannelId(parsed.channelId || '');
    } catch {
      setStatus('Configul local nu a putut fi citit.');
    }
  }, []);

  const roleValid = useMemo(() => roleId.length >= 17, [roleId]);
  const channelValid = useMemo(() => channelId.length >= 17, [channelId]);

  const handleSave = () => {
    if (!roleValid || !channelValid) {
      setStatus('Completeaza ID Rol si ID Canal cu valori valide (snowflake Discord).');
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        roleId,
        channelId,
        updatedAt: new Date().toISOString(),
      })
    );
    setStatus('Configuratia a fost salvata local.');
  };

  return (
    <div className="selfroles-page">
      <div className="selfroles-hero">
        <div className="selfroles-badge">Self Roles Setup</div>
        <h1>Role Access Mapping</h1>
        <p>Seteaza cele 2 sectiuni principale pentru flow-ul de self-roles: ID Rol si ID Canal.</p>
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
        <button type="button" onClick={handleSave} className="save-btn">
          Salveaza configuratia
        </button>
        {status ? <div className="status-line">{status}</div> : null}
      </div>
    </div>
  );
}

export default SelfRolesPage;
