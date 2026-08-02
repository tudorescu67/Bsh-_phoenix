const test = require('node:test');
const assert = require('node:assert/strict');
const { hasPermission, getAccessLevel, getVisiblePermissions } = require('../auth-logic');

test('administrator gets full access and edit permissions', () => {
  const user = { role: 'administrator' };
  assert.equal(getAccessLevel(user), 'administrator');
  assert.equal(hasPermission(user, 'editServerSettings'), true);
  assert.equal(hasPermission(user, 'manageRoles'), true);
  assert.equal(getVisiblePermissions(user).length > 0, true);
});

test('moderator can moderate but not manage roles', () => {
  const user = { role: 'moderator' };
  assert.equal(getAccessLevel(user), 'moderator');
  assert.equal(hasPermission(user, 'manageMessages'), true);
  assert.equal(hasPermission(user, 'manageRoles'), false);
});

test('viewer is read only', () => {
  const user = { role: 'viewer' };
  assert.equal(getAccessLevel(user), 'viewer');
  assert.equal(hasPermission(user, 'editServerSettings'), false);
  assert.equal(hasPermission(user, 'viewDashboard'), true);
});
