import { account } from "../appwrite/client.js";
import { staffService } from "../appwrite/provider.js";
import { ENUMS } from "../appwrite/config.js";
import { resolveOrgCodeFromIdentifier, getCurrentOrgCode } from "./org";

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

    // Wait a brief moment - sometimes Appwrite needs time to recognize session
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Fetch fresh user data with timeout and retries
    let user = null;
    let retries = 2;
    
    while (retries > 0 && !user) {
      try {
        user = await Promise.race([
          account.get(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Account.get() timeout")), 3000)
          ),
        ]);
        
        if (user && user.$id) {
          break;
        }
      } catch (err) {
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    if (user) {
      cacheUser(user);
      updateLastActivity();
      return user;
    }

    // If account.get() failed but we have cached user, return it
    if (cachedUser) {
      return cachedUser;
    }

    return null;
  } catch (error) {
    // Don't clear cache on error - might be temporary
    // Return cached user if available
    const cachedUser = getCachedUser();
    if (cachedUser) {
      return cachedUser;
    }
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
    const activeOrgCode = getCurrentOrgCode()?.toUpperCase();
    if (cachedStaff && !isSessionExpired() && cachedStaff.userId === user.$id) {
      const cachedOrgCode = resolveOrgCodeFromIdentifier(
        cachedStaff.orgId || cachedStaff.orgCode || cachedStaff.orgCodes?.[0]
      );
      if (!cachedOrgCode || cachedOrgCode === activeOrgCode) {
        return cachedStaff;
      }
    }

    // Fetch fresh staff data with timeout to prevent infinite loading
    // Use longer timeout to give Appwrite more time after login
    const staffPromise = staffService.getByUserId(user.$id);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Staff lookup timeout")), 10000)
    );

    const staff = await Promise.race([staffPromise, timeoutPromise]);
    
    if (staff) {
      const orgIdentifiers = Array.isArray(staff.orgMemberships)
        ? staff.orgMemberships
        : [staff.orgCodes, staff.orgs, staff.orgCode, staff.orgId]
            .flat()
            .filter(Boolean);
      const normalised = orgIdentifiers
        .map((code) => resolveOrgCodeFromIdentifier(code))
        .filter(Boolean);

      const enrichedStaff = {
        ...staff,
        orgCodes: normalised.length > 0 ? normalised : undefined,
      };

      cacheStaff(enrichedStaff);
      return enrichedStaff;
    }

    // No staff record found - return null (caller should handle this)
    return null;
  } catch (error) {
    // If it's a timeout or network error, don't clear cache - might be temporary
    if (error.message === "Staff lookup timeout" || error.message === "Failed to fetch") {
      console.warn("Staff lookup failed:", error.message);
      return null;
    }
    
    // For other errors, clear cache and return null
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
    // Clear local cache first
    clearAuthCache();

    // Aggressively clear any existing sessions before login
    if (typeof window !== "undefined") {
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      
      // Clear Appwrite's localStorage (it stores sessions there)
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("appwrite") || key.includes("session") || (projectId && key.includes(projectId))) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        // Ignore localStorage errors
      }

      // Clear session cookies
      if (projectId) {
        const cookieName = `a_session_${projectId}`;
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }

    // Try to delete all existing Appwrite sessions
    try {
      // First try to delete current session
      await account.deleteSession("current");
    } catch (deleteError) {
      // Ignore - session might not exist
    }

    // Also try to list and delete all sessions
    try {
      const sessions = await account.listSessions();
      if (sessions && sessions.sessions) {
        for (const session of sessions.sessions) {
          try {
            await account.deleteSession(session.$id);
          } catch (deleteError) {
            // Ignore individual session deletion errors
          }
        }
      }
    } catch (listError) {
      // Ignore if we can't list sessions
    }

    // Wait longer to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Now create the new session
    const session = await account.createEmailPasswordSession(email, password);

    if (!session || !session.$id) {
      throw new Error("Login failed - session was not created");
    }

    // Session created successfully - Appwrite SDK automatically stores it in localStorage
    // The session is now available for account.get() calls
    
    // Wait a brief moment for Appwrite SDK to fully store the session
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Try to get user once - if it fails, that's okay, session is still valid
    let user = null;
    try {
      user = await Promise.race([
        account.get(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Account.get() timeout")), 2000)
        ),
      ]);
    } catch (err) {
      // account.get() failed, but session is valid - create minimal user
      user = {
        $id: session.userId || email,
        email: email,
        name: email.split("@")[0],
      };
    }

    // Cache user data
    if (user) {
      cacheUser(user);
      updateLastActivity();
      setSessionExpiry();
    }

    // Return immediately - session is valid, redirect should happen NOW
    return { session, user, callback };
  } catch (error) {
    clearAuthCache();
    
    // Check if this is a credentials error (401 on session creation)
    const isCredentialsError = 
      error.message && (
        error.message.includes("401") || 
        error.message.includes("Unauthorized") ||
        error.message.includes("Invalid credentials") ||
        error.message.includes("Incorrect credentials")
      );
    
    // Check if this is a session already exists error
    const isSessionExistsError = 
      error.message && error.message.includes("prohibited when a session is active");
    
    // Check if error happened during account.get() - if so, we might still have a session
    const isAccountGetError = 
      error.message && (
        error.message.includes("Account.get()") ||
        error.message.includes("timeout")
      );
    
    // If error is only from account.get() and not from session creation, 
    // check if we can still proceed (session might exist in localStorage)
    if (isAccountGetError && !isCredentialsError) {
      // Try to get session from Appwrite's localStorage
      if (typeof window !== "undefined") {
        try {
          const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
          if (projectId) {
            // Check if Appwrite stored a session
            const appwriteKeys = Object.keys(localStorage).filter(key => 
              key.includes(projectId) || key.includes("appwrite")
            );
            
            if (appwriteKeys.length > 0) {
              // Session might exist, create minimal user and return
              const email = error.email || "user@example.com"; // We don't have email here
              return {
                session: { $id: "session_exists" },
                user: {
                  $id: "unknown",
                  email: email,
                  name: email.split("@")[0],
                },
                callback: null,
              };
            }
          }
        } catch (storageError) {
          // Ignore storage errors
        }
      }
    }
    
    // Provide user-friendly error messages
    if (isSessionExistsError) {
      throw new Error("Please wait a moment and try again. If the problem persists, clear your browser cookies.");
    }
    
    // Only throw credentials error if it happened during session creation
    if (isCredentialsError && !isAccountGetError) {
      throw new Error("Invalid email or password. Please check your credentials and try again.");
    }
    
    // For other errors, re-throw with original message
    throw error;
  }
}

// Logout function with cleanup
export async function logout() {
  try {
    // Delete Appwrite session first - try multiple methods
    try {
      await account.deleteSession("current");
    } catch (sessionError) {
      // Ignore if session doesn't exist
    }

    // Also try to get and delete all sessions
    try {
      const sessions = await account.listSessions();
      if (sessions && sessions.sessions) {
        for (const session of sessions.sessions) {
          try {
            await account.deleteSession(session.$id);
          } catch (deleteError) {
            // Ignore individual session deletion errors
          }
        }
      }
    } catch (listError) {
      // Ignore if we can't list sessions
    }

    // Clear local cache
    clearAuthCache();

    // Clear Appwrite's localStorage (it stores sessions there)
    if (typeof window !== "undefined") {
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      
      // Clear Appwrite session from localStorage
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("appwrite") || key.includes("session") || key.includes(projectId)) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        // Ignore localStorage errors
      }

      // Clear manually set session cookie
      if (projectId) {
        const cookieName = `a_session_${projectId}`;
        // Clear cookie for current path and root path
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }

    // Wait a moment to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    return true;
  } catch (error) {
    // Even if Appwrite logout fails, clear local data
    clearAuthCache();

    // Still clear localStorage and cookies on error
    if (typeof window !== "undefined") {
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("appwrite") || key.includes("session") || key.includes(projectId)) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        // Ignore localStorage errors
      }

      if (projectId) {
        const cookieName = `a_session_${projectId}`;
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }

    return true; // Return true even on error to allow logout to complete
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
    const user = await Promise.race([
      account.get(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Session verification timeout")), 5000)
      ),
    ]);

    if (user && user.$id) {
      cacheUser(user);
      updateLastActivity();
      return user;
    }

    return null;
  } catch (error) {
    // Only clear cache on actual auth errors, not timeouts
    if (error.message && (error.message.includes("401") || error.message.includes("Unauthorized"))) {
      clearAuthCache();
    }
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
        // Use a more user-friendly approach - auto-refresh with notification
        refreshSession();

        // Show a toast notification instead of blocking confirm dialog
        if (typeof window !== "undefined") {
          // Dispatch a custom event that can be caught by toast system
          window.dispatchEvent(
            new CustomEvent("session-warning", {
              detail: { message: "Your session was refreshed automatically" },
            })
          );
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

// Get current view mode from localStorage
export const getCurrentViewMode = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("viewMode") || "user";
  }
  return "user";
};
