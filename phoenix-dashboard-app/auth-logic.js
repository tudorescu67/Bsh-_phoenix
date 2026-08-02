const ROLE_PERMISSIONS = {
  administrator: ['viewDashboard', 'editServerSettings', 'manageRoles', 'manageMessages', 'manageTickets', 'viewLogs'],
  moderator: ['viewDashboard', 'manageMessages', 'manageTickets', 'viewLogs'],
  viewer: ['viewDashboard']
};

function getAccessLevel(user) {
  return user?.role || 'viewer';
}

function hasPermission(user, permission) {
  const role = getAccessLevel(user);
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

function getVisiblePermissions(user) {
  return ROLE_PERMISSIONS[getAccessLevel(user)] || [];
}

module.exports = {
  ROLE_PERMISSIONS,
  getAccessLevel,
  hasPermission,
  getVisiblePermissions
};
