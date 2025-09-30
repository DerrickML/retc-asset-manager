import { account } from "../appwrite/client.js";
import { staffService } from "../appwrite/provider.js";
import { ENUMS } from "../appwrite/config.js";

// Session storage keys
const SESSION_KEYS = {
  USER: "auth_user",
  STAFF: "auth_staff",
  LAST_ACTIVITY: "auth_last_activity",
  SESSION_EXPIRY: "auth_session_expiry",
};

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;
const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry

// Get current user session with caching
export async function getCurrentUser() {
  try {
    // Check cached user first
    const cachedUser = getCachedUser();
    if (cachedUser && !isSessionExpired()) {
      updateLastActivity();
      return cachedUser;
    }

    // Fetch fresh user data with timeout
    const user = await Promise.race([
      account.get(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Account.get() timeout")), 3000)
      ),
    ]);

    if (user) {
      cacheUser(user);
      updateLastActivity();
    }

    return user;
  } catch (error) {
    clearAuthCache();
    return null;
  }
}

// Get current staff member with roles
export async function getCurrentStaff() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Check cached staff first
    const cachedStaff = getCachedStaff();
    if (cachedStaff && !isSessionExpired() && cachedStaff.userId === user.$id) {
      return cachedStaff;
    }

    // Fetch fresh staff data
    const staff = await staffService.getByUserId(user.$id);
    if (staff) {
      cacheStaff(staff);
    }

    return staff;
  } catch (error) {
    clearAuthCache();
    return null;
  }
}

// Check if user has specific role
export function hasRole(staff, role) {
  if (!staff || !staff.roles) return false;
  return staff.roles.includes(role);
}

// Check if user has any of the specified roles
export function hasAnyRole(staff, roles) {
  if (!staff || !staff.roles) return false;
  return roles.some((role) => staff.roles.includes(role));
}

// Role-based permission checks
export const permissions = {
  isAdmin: (staff) =>
    hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN]),
  isSystemAdmin: (staff) => hasRole(staff, ENUMS.ROLES.SYSTEM_ADMIN),
  canManageAssets: (staff) =>
    hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN]),
  canApproveRequests: (staff) =>
    hasAnyRole(staff, [
      ENUMS.ROLES.SYSTEM_ADMIN,
      ENUMS.ROLES.ASSET_ADMIN,
      ENUMS.ROLES.SENIOR_MANAGER,
    ]),
  canIssueAssets: (staff) =>
    hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN]),
  canManageUsers: (staff) => hasRole(staff, ENUMS.ROLES.SYSTEM_ADMIN),
  canManageSettings: (staff) => hasRole(staff, ENUMS.ROLES.SYSTEM_ADMIN),
  canViewReports: (staff) =>
    hasAnyRole(staff, [
      ENUMS.ROLES.SYSTEM_ADMIN,
      ENUMS.ROLES.ASSET_ADMIN,
      ENUMS.ROLES.SENIOR_MANAGER,
    ]),
  canCreateRequests: (staff) => !!staff, // Any authenticated user
  canManageRequests: (staff) =>
    hasAnyRole(staff, [ENUMS.ROLES.SYSTEM_ADMIN, ENUMS.ROLES.ASSET_ADMIN]),
};

// Login function with callback support and enhanced verification
export async function login(email, password, callback = null) {
  try {
    const session = await account.createEmailPasswordSession(email, password);

    if (session) {
      // Initialize session data
      const user = await account.get();

      if (user) {
        cacheUser(user);
        updateLastActivity();
        setSessionExpiry();

        // Manually set session cookie since Appwrite is using localStorage
        if (typeof window !== "undefined" && session) {
          const projectId = "68926e9b000ac167ec8a";
          const cookieName = `a_session_${projectId}`;
          const cookieValue = session.$id;

          // Set the session cookie manually
          document.cookie = `${cookieName}=${cookieValue}; path=/; max-age=31536000; samesite=lax`;
        }

        // Additional wait to ensure session cookies are set properly
        await new Promise((resolve) => setTimeout(resolve, 100));

        return { session, user, callback };
      }
    }

    throw new Error("Login failed - could not establish session");
  } catch (error) {
    clearAuthCache();
    throw error;
  }
}

// Logout function with cleanup
export async function logout() {
  try {
    // Clear local cache first
    clearAuthCache();

    // Clear manually set session cookie
    if (typeof window !== "undefined") {
      const projectId = "68926e9b000ac167ec8a";
      const cookieName = `a_session_${projectId}`;
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    // Delete Appwrite session
    await account.deleteSession("current");

    return true;
  } catch (error) {
    // Even if Appwrite logout fails, clear local data
    clearAuthCache();

    // Still clear the cookie on error
    if (typeof window !== "undefined") {
      const projectId = "68926e9b000ac167ec8a";
      const cookieName = `a_session_${projectId}`;
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    throw error;
  }
}

// Register function (for setup wizard), enabling users admins to add new users
export async function register(email, password, name) {
  try {
    return await account.create("unique()", email, password, name);
  } catch (error) {
    throw error;
  }
}

// ================================
// Session Management Functions
// ================================

// Check if running in browser
function isBrowser() {
  return typeof window !== "undefined";
}

// Cache user data
function cacheUser(user) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(user));
    setSessionExpiry();
  } catch (error) {
    // Silent fail for caching
  }
}

// Get cached user
function getCachedUser() {
  if (!isBrowser()) return null;

  try {
    const cached = localStorage.getItem(SESSION_KEYS.USER);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

// Cache staff data
function cacheStaff(staff) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(SESSION_KEYS.STAFF, JSON.stringify(staff));
  } catch (error) {
    // Silent fail for caching
  }
}

// Get cached staff
function getCachedStaff() {
  if (!isBrowser()) return null;

  try {
    const cached = localStorage.getItem(SESSION_KEYS.STAFF);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

// Update last activity timestamp
function updateLastActivity() {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
  } catch (error) {
    // Silent fail for activity tracking
  }
}

// Set session expiry
function setSessionExpiry() {
  if (!isBrowser()) return;

  try {
    const expiry = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem(SESSION_KEYS.SESSION_EXPIRY, expiry.toString());
  } catch (error) {
    // Silent fail for session expiry
  }
}

// Check if session is expired
function isSessionExpired() {
  if (!isBrowser()) return false;

  try {
    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
    const sessionExpiry = localStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);

    if (!lastActivity || !sessionExpiry) return true;

    const now = Date.now();
    const lastActivityTime = parseInt(lastActivity);
    const expiryTime = parseInt(sessionExpiry);

    // Check if session has expired due to inactivity
    const inactivityExpired = now - lastActivityTime > SESSION_TIMEOUT;

    // Check if absolute session has expired
    const absoluteExpired = now > expiryTime;

    return inactivityExpired || absoluteExpired;
  } catch (error) {
    return true;
  }
}

// Verify current session is valid
export async function verifySession() {
  try {
    const user = await account.get();

    if (user) {
      cacheUser(user);
      updateLastActivity();
      return user;
    }

    return null;
  } catch (error) {
    clearAuthCache();
    return null;
  }
}

// Clear all authentication cache
export function clearAuthCache() {
  if (!isBrowser()) return;

  try {
    Object.values(SESSION_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    // Silent fail for cache clearing
  }
}

// Check if session needs refresh
export function shouldRefreshSession() {
  if (!isBrowser()) return false;

  try {
    const sessionExpiry = localStorage.getItem(SESSION_KEYS.SESSION_EXPIRY);
    if (!sessionExpiry) return false;

    const now = Date.now();
    const expiryTime = parseInt(sessionExpiry);

    // Refresh if within threshold of expiry
    return expiryTime - now < SESSION_REFRESH_THRESHOLD;
  } catch (error) {
    return false;
  }
}

// Refresh session
export async function refreshSession() {
  try {
    // Get fresh session from Appwrite
    const session = await account.getSession("current");
    if (session) {
      setSessionExpiry();
      updateLastActivity();
      return true;
    }
    return false;
  } catch (error) {
    clearAuthCache();
    return false;
  }
}

// Initialize session monitoring
export function initSessionMonitoring() {
  if (!isBrowser()) return;

  let activityTimer;
  let refreshTimer;
  let isInitialized = false;

  // Track user activity
  const trackActivity = () => {
    updateLastActivity();

    // Clear existing timer
    if (activityTimer) {
      clearTimeout(activityTimer);
    }

    // Set new timer for session expiry warning (only after initial load)
    if (isInitialized) {
      activityTimer = setTimeout(() => {
        // Warn user of impending session expiry
        if (
          confirm("Your session will expire soon. Do you want to continue?")
        ) {
          refreshSession();
        } else {
          logout();
        }
      }, SESSION_TIMEOUT - 60000); // Warn 1 minute before expiry
    }
  };

  // Set up periodic session refresh
  const setupRefreshTimer = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(async () => {
      if (shouldRefreshSession()) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          // Session refresh failed, redirect to login
          window.location.href = "/login";
        }
      }
    }, 60000); // Check every minute
  };

  // Add activity listeners
  const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
  events.forEach((event) => {
    document.addEventListener(event, trackActivity, { passive: true });
  });

  // Setup timers
  setupRefreshTimer();

  // Mark as initialized after a short delay to prevent initial dialog
  setTimeout(() => {
    isInitialized = true;
  }, 2000); // 2 second delay

  // Return cleanup function
  return () => {
    events.forEach((event) => {
      document.removeEventListener(event, trackActivity);
    });
    if (activityTimer) clearTimeout(activityTimer);
    if (refreshTimer) clearInterval(refreshTimer);
  };
}
