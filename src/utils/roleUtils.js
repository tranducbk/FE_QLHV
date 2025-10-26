/**
 * Utility functions for role checking
 * Centralized role management to avoid inconsistencies
 */

/**
 * Check if user is SUPER_ADMIN
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  return user?.role === "SUPER_ADMIN";
};

/**
 * Check if user is ADMIN (including SUPER_ADMIN)
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
};

/**
 * Check if user is regular USER
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isUser = (user) => {
  return user?.role === "USER";
};

/**
 * Get redirect path based on user role
 * @param {Object} user - User object
 * @returns {string} - Redirect path
 */
export const getRedirectPath = (user) => {
  if (!user) return "/login";

  if (isSuperAdmin(user)) {
    return "/supper_admin";
  } else if (isAdmin(user)) {
    return "/admin";
  } else if (isUser(user)) {
    return "/users";
  } else {
    // Fallback for backward compatibility
    if (user.isAdmin === true) {
      return "/admin";
    } else {
      return "/users";
    }
  }
};

/**
 * Get user role display name
 * @param {Object} user - User object
 * @returns {string}
 */
export const getRoleDisplayName = (user) => {
  switch (user?.role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    case "USER":
      return "Học viên";
    default:
      return user?.isAdmin ? "Admin" : "Học viên";
  }
};
