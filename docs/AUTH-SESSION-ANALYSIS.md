# Authentication & Session Security – Analysis

## Current behaviour

### 1. **Session cookie (login)**
- **Location:** `lib/utils/auth.js` → `login()`
- **Issue:** Session cookie is set with `max-age=31536000` (1 year).
- **Effect:** The browser keeps the session cookie for a year, so the app can look “logged in forever” even after long inactivity.

### 2. **Middleware**
- **Location:** `middleware.js`
- **Behaviour:** Only checks that a session cookie exists (`isAuthenticated = !!session`).
- **Gap:** It does not check session age, inactivity, or expiry. If the cookie exists, the user is treated as authenticated.

### 3. **Inactivity logout (client)**
- **Location:** `lib/hooks/useInactivityLogout.js`, used in `components/layout/layout-provider.js`
- **Behaviour:** After **8 minutes** of no activity (mouse, keyboard, scroll, touch), a warning modal appears; after **2 more minutes** the user is logged out and redirected to `/login`.
- **Scope:** Only runs when the user is on protected routes (dashboard, admin, assets, requests, etc.), not on login/setup/guest.

### 4. **Session expiry in auth.js**
- **Constants:** `SESSION_TIMEOUT = 30 min`, `SESSION_REFRESH_THRESHOLD = 5 min`.
- **Storage:** `auth_last_activity`, `auth_session_expiry` in `localStorage`.
- **Behaviour:** `getCurrentUser()` uses cache only if `!isSessionExpired()`. If expired, it still calls `account.get()` and does **not** clear the session cookie.
- **Gap:** `initSessionMonitoring()` (which would refresh/expire based on this) is **never called** anywhere, so the 30‑min logic is not applied. When the app does treat the session as expired (e.g. after a long absence), the cookie is left in place, so middleware still thinks the user is logged in and can cause redirect loops or inconsistent state.

### 5. **No “max session duration”**
- There is no rule like “re-login after 8 or 24 hours even if the user was active.” So with a 1‑year cookie, a user could stay “logged in” for days or weeks as long as they trigger the app occasionally.

---

## Summary of gaps

| Area                     | Current state                         | Desired / fix |
|--------------------------|----------------------------------------|----------------|
| Cookie lifetime          | 1 year                                | Short lifetime (e.g. 8–24 h) |
| Cookie on expiry         | Not cleared when app considers expired | Clear cookie when session expired |
| Inactivity               | 8 min → warning → logout (working)    | Keep as is    |
| Max session duration     | None                                  | Optional: force re-login after e.g. 24 h |
| initSessionMonitoring    | Defined but never used                | Optional: use or remove; expiry enforced via getCurrentUser + cookie clear |

---

## Implemented code changes

1. **Cookie lifetime**  
   Session cookie `max-age` is now `SESSION_COOKIE_MAX_AGE_SECONDS` (30 minutes). No longer 1 year.

2. **Clear cookie when session expired**  
   `clearAuthCache()` now also calls `clearSessionCookie()`, so whenever the app clears auth (expiry, logout, errors), the session cookie is removed and middleware will send the user to login.

3. **Enforce expiry in getCurrentUser**  
   At the start of `getCurrentUser()`, if `isSessionExpired()` is true, we call `clearAuthCache()` and return `null` so the user must sign in again.

4. **Max session duration**  
   Login time is stored in `auth_login_time`. `isSessionExpired()` returns true if `now - loginTime > MAX_SESSION_DURATION_MS` (24 hours), so users are required to sign in again after 24 hours even if they were active.

5. **Constants (in `lib/utils/auth.js`)**  
   - `SESSION_COOKIE_MAX_AGE_SECONDS = 30 * 60` (30 minutes)  
   - `MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000` (24 hours)  
   - Inactivity timeout remains 30 min for cache; UI inactivity logout remains 8 min (useInactivityLogout).
