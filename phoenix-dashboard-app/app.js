const defaultConfig = {
  serverName: 'BSH • Discord',
  prefix: '!',
  welcomeChannel: '#welcome',
  welcomeRole: 'Member',
  welcomeMessage: 'Bun venit pe server! Citește regulile și alege rolurile potrivite.',
  modules: ['Moderare', 'Muzică', 'Welcome', 'Tickets', 'Logs'],
  dashboardApi: 'http://localhost:3100',
  updatedAt: null
};

const config = { ...defaultConfig };

const allModules = ['Moderare', 'Muzică', 'Welcome', 'Tickets', 'Logs', 'Auto-Roles', 'Anti-Raid', 'AI Assistant'];

const state = {
  user: null
};

function getCurrentUser() {
  return state.user || JSON.parse(localStorage.getItem('phoenix-dashboard-user') || 'null');
}

function loginWithDiscord() {
  const presetUsers = [
    { id: '1', username: 'alex', discriminator: '3000', avatar: 'A', role: 'administrator', tag: 'alex#3000' },
    { id: '2', username: 'maria', discriminator: '7777', avatar: 'M', role: 'moderator', tag: 'maria#7777' },
    { id: '3', username: 'ion', discriminator: '1111', avatar: 'I', role: 'viewer', tag: 'ion#1111' }
  ];

  const selected = presetUsers[Math.floor(Math.random() * presetUsers.length)];
  state.user = selected;
  localStorage.setItem('phoenix-dashboard-user', JSON.stringify(selected));
  render();
}

function logout() {
  state.user = null;
  localStorage.removeItem('phoenix-dashboard-user');
  render();
}

function getAccessLevel(user) {
  return user?.role || 'viewer';
}

function hasPermission(user, permission) {
  const role = getAccessLevel(user);
  const permissions = {
    administrator: ['viewDashboard', 'editServerSettings', 'manageRoles', 'manageMessages', 'manageTickets', 'viewLogs'],
    moderator: ['viewDashboard', 'manageMessages', 'manageTickets', 'viewLogs'],
    viewer: ['viewDashboard']
  };
  return permissions[role]?.includes(permission) || false;
}

function render() {
  const user = getCurrentUser();
  document.getElementById('serverName').value = config.serverName;
  document.getElementById('prefix').value = config.prefix;
  document.getElementById('welcomeChannel').value = config.welcomeChannel;
  document.getElementById('welcomeRole').value = config.welcomeRole;
  document.getElementById('welcomeMessage').value = config.welcomeMessage;
  document.getElementById('dashboardApi').value = config.dashboardApi;
  document.getElementById('modules').innerHTML = config.modules.map(m => `<span class="pill">${m}</span>`).join('');
  document.getElementById('activity').innerHTML = [
    'Moderare automată activă',
    'Muzică sincronizată',
    'Welcome mesaj actualizat',
    'Loguri live și sigure'
  ].map(x => `<div style="margin-top:8px;">• ${x}</div>`).join('');

  const canEdit = hasPermission(user, 'editServerSettings');
  document.getElementById('authAvatar').textContent = user?.avatar || '?';
  document.getElementById('authUser').textContent = user ? `${user.username} (${user.tag})` : 'Neautentificat';
  document.getElementById('authRole').textContent = `Rol: ${getAccessLevel(user)}`;
  document.getElementById('loginBtn').textContent = user ? 'Schimbă contul' : 'Autentifică-te cu Discord';
  document.getElementById('logoutBtn').style.display = user ? 'inline-block' : 'none';
  document.getElementById('permissionNotice').style.display = canEdit ? 'none' : 'block';
  document.getElementById('serverName').disabled = !canEdit;
  document.getElementById('prefix').disabled = !canEdit;
  document.getElementById('welcomeChannel').disabled = !canEdit;
  document.getElementById('welcomeRole').disabled = !canEdit;
  document.getElementById('welcomeMessage').disabled = !canEdit;
  document.getElementById('dashboardApi').disabled = !canEdit;
  document.getElementById('applyBtn').disabled = !canEdit;
  document.getElementById('resetBtn').disabled = !canEdit;
  document.getElementById('exportBtn').disabled = !canEdit;
  document.getElementById('saveBtn').disabled = !canEdit;
  document.getElementById('lastSync').textContent = `Ultima sincronizare: ${config.updatedAt || '-'}`;

  document.getElementById('moduleControls').innerHTML = allModules
    .map(
      moduleName =>
        `<label class="module-item"><input type="checkbox" data-module="${moduleName}" ${config.modules.includes(moduleName) ? 'checked' : ''} ${canEdit ? '' : 'disabled'} />${moduleName}</label>`
    )
    .join('');

  const moduleInputs = document.querySelectorAll('#moduleControls input[type="checkbox"]');
  moduleInputs.forEach(input => {
    input.addEventListener('change', event => {
      const name = event.target.getAttribute('data-module');
      if (event.target.checked) {
        if (!config.modules.includes(name)) config.modules.push(name);
      } else {
        config.modules = config.modules.filter(item => item !== name);
      }
      document.getElementById('modules').innerHTML = config.modules.map(m => `<span class="pill">${m}</span>`).join('');
    });
  });

  const permissions = [
    'viewDashboard',
    'editServerSettings',
    'manageMessages',
    'manageTickets',
    'viewLogs'
  ].filter(permission => hasPermission(user, permission));

  document.getElementById('permissions').innerHTML = permissions.map(permission => `<span class="pill">${permission}</span>`).join('');
}

function saveConfig() {
  const user = getCurrentUser();
  if (!hasPermission(user, 'editServerSettings')) {
    alert('Nu ai permisiuni suficiente pentru a salva modificările.');
    return;
  }
  config.serverName = document.getElementById('serverName').value;
  config.prefix = document.getElementById('prefix').value;
  config.welcomeChannel = document.getElementById('welcomeChannel').value;
  config.welcomeRole = document.getElementById('welcomeRole').value;
  config.welcomeMessage = document.getElementById('welcomeMessage').value;
  config.dashboardApi = document.getElementById('dashboardApi').value;
  config.updatedAt = new Date().toLocaleString('ro-RO');
  localStorage.setItem('phoenix-dashboard-config', JSON.stringify(config));
  alert('Configurația a fost salvată!');
  render();
}

function resetConfig() {
  const user = getCurrentUser();
  if (!hasPermission(user, 'editServerSettings')) {
    alert('Nu ai permisiuni suficiente pentru reset.');
    return;
  }

  Object.assign(config, defaultConfig, { modules: [...defaultConfig.modules], updatedAt: new Date().toLocaleString('ro-RO') });
  localStorage.setItem('phoenix-dashboard-config', JSON.stringify(config));
  render();
}

function exportConfig() {
  const user = getCurrentUser();
  if (!hasPermission(user, 'editServerSettings')) {
    alert('Nu ai permisiuni suficiente pentru export.');
    return;
  }

  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'phoenix-dashboard-config.json';
  link.click();
  URL.revokeObjectURL(url);
}

function checkApiHealth() {
  const endpoint = document.getElementById('dashboardApi').value.trim();
  const status = document.getElementById('apiHealth');

  if (!endpoint || (!endpoint.startsWith('http://') && !endpoint.startsWith('https://'))) {
    status.textContent = 'offline';
    status.classList.remove('status-online');
    status.classList.add('status-offline');
    return;
  }

  status.textContent = 'online';
  status.classList.remove('status-offline');
  status.classList.add('status-online');
}

function loadConfig() {
  const saved = localStorage.getItem('phoenix-dashboard-config');
  if (saved) Object.assign(config, JSON.parse(saved));
}

loadConfig();
render();
