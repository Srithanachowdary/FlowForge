/**
 * Helper roles maps for workspace authorization boundaries.
 */
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  DEVELOPER: "developer",
  VIEWER: "viewer"
};

export const hasWriteAccess = (role) => {
  return [ROLES.ADMIN, ROLES.MANAGER, ROLES.DEVELOPER].includes(role);
};

export const hasAdminAccess = (role) => {
  return [ROLES.ADMIN].includes(role);
};

export const hasManagerAccess = (role) => {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(role);
};

export default {
  ROLES,
  hasWriteAccess,
  hasAdminAccess,
  hasManagerAccess
};
