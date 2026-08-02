const config = {
  serverName: 'BSH • Discord',
  prefix: '!',
  welcomeChannel: '#welcome',
  welcomeRole: 'Member',
  welcomeMessage: 'Bun venit pe server! Citește regulile și alege rolurile potrivite.',
  modules: ['Moderare', 'Muzică', 'Welcome', 'Tickets', 'Logs']
};

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
  document.getElementById('permissionNotice').style.display = canEdit ? 'none' : 'block';
  document.getElementById('serverName').disabled = !canEdit;
  document.getElementById('prefix').disabled = !canEdit;
  document.getElementById('welcomeChannel').disabled = !canEdit;
  document.getElementById('welcomeRole').disabled = !canEdit;
  document.getElementById('welcomeMessage').disabled = !canEdit;
  document.getElementById('applyBtn').disabled = !canEdit;
  document.getElementById('saveBtn').disabled = !canEdit;

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
  localStorage.setItem('phoenix-dashboard-config', JSON.stringify(config));
  alert('Configurația a fost salvată!');
}

function loadConfig() {
  const saved = localStorage.getItem('phoenix-dashboard-config');
  if (saved) Object.assign(config, JSON.parse(saved));
}

loadConfig();
render();
