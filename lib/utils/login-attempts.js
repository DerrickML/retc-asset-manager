/**
 * Login Attempt Tracking Utility
 * 
 * Tracks failed login attempts per email address to prevent brute force attacks.
 * After 5 failed attempts, the user is blocked from logging in.
 * 
 * Best Practices:
 * - Uses localStorage for client-side tracking
 * - Tracks attempts per email address
 * - Includes timestamp for potential cooldown periods
 * - Automatically resets on successful login
 * - Provides clear error messages to users
 */

const LOGIN_ATTEMPTS_KEY = "login_attempts";
export const MAX_ATTEMPTS = 5;
const COOLDOWN_PERIOD_MS = 15 * 60 * 1000; // 15 minutes cooldown after 5 attempts

/**
 * Get login attempts data from localStorage
 * @returns {Object} Object mapping email addresses to attempt data
 */
function getLoginAttempts() {
  if (typeof window === "undefined") return {};
  
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading login attempts:", error);
    return {};
  }
}

/**
 * Save login attempts data to localStorage
 * @param {Object} attempts - Object mapping email addresses to attempt data
 */
function saveLoginAttempts(attempts) {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error("Error saving login attempts:", error);
  }
}

/**
 * Record a failed login attempt for an email address
 * @param {string} email - The email address that failed to login
 */
export function recordFailedAttempt(email) {
  if (!email) return;
  
  const normalizedEmail = email.toLowerCase().trim();
  const attempts = getLoginAttempts();
  
  if (!attempts[normalizedEmail]) {
    attempts[normalizedEmail] = {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      blocked: false,
    };
  }
  
  attempts[normalizedEmail].count += 1;
  attempts[normalizedEmail].lastAttempt = Date.now();
  
  // Block after MAX_ATTEMPTS
  if (attempts[normalizedEmail].count >= MAX_ATTEMPTS) {
    attempts[normalizedEmail].blocked = true;
    attempts[normalizedEmail].blockedAt = Date.now();
  }
  
  saveLoginAttempts(attempts);
}

/**
 * Check if an email address is blocked from logging in
 * @param {string} email - The email address to check
 * @returns {Object} { isBlocked: boolean, message: string, attemptsRemaining: number }
 */
export function checkLoginBlocked(email) {
  if (!email) {
    return { isBlocked: false, message: "", attemptsRemaining: MAX_ATTEMPTS };
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  const attempts = getLoginAttempts();
  const attemptData = attempts[normalizedEmail];
  
  if (!attemptData) {
    return { isBlocked: false, message: "", attemptsRemaining: MAX_ATTEMPTS };
  }
  
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - attemptData.count);
  const isInCooldown = attemptData.blocked && 
    (Date.now() - attemptData.blockedAt) < COOLDOWN_PERIOD_MS;
  
  if (isInCooldown) {
    const minutesRemaining = Math.ceil((COOLDOWN_PERIOD_MS - (Date.now() - attemptData.blockedAt)) / (60 * 1000));
    return {
      isBlocked: true,
      message: `Your account has been temporarily locked due to ${MAX_ATTEMPTS} failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} or contact your system administrator.`,
      attemptsRemaining: 0,
      cooldownMinutes: minutesRemaining,
    };
  }
  
  if (attemptData.blocked) {
    // Cooldown period has passed, allow retry but warn
    return {
      isBlocked: false,
      message: `You have exceeded ${MAX_ATTEMPTS} failed login attempts. Your account was temporarily locked. Please try again carefully.`,
      attemptsRemaining: 0,
      wasBlocked: true,
    };
  }
  
  if (attemptData.count >= MAX_ATTEMPTS - 1) {
    // One more attempt before blocking
    return {
      isBlocked: false,
      message: `Warning: You have ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining before your account is temporarily locked.`,
      attemptsRemaining,
      isWarning: true,
    };
  }
  
  if (attemptData.count > 0) {
    return {
      isBlocked: false,
      message: `Incorrect credentials. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
      attemptsRemaining,
    };
  }
  
  return { isBlocked: false, message: "", attemptsRemaining: MAX_ATTEMPTS };
}

/**
 * Reset login attempts for an email address (called on successful login)
 * @param {string} email - The email address that successfully logged in
 */
export function resetLoginAttempts(email) {
  if (!email) return;
  
  const normalizedEmail = email.toLowerCase().trim();
  const attempts = getLoginAttempts();
  
  if (attempts[normalizedEmail]) {
    delete attempts[normalizedEmail];
    saveLoginAttempts(attempts);
  }
}

/**
 * Get the number of remaining attempts for an email
 * @param {string} email - The email address to check
 * @returns {number} Number of remaining attempts
 */
export function getRemainingAttempts(email) {
  if (!email) return MAX_ATTEMPTS;
  
  const normalizedEmail = email.toLowerCase().trim();
  const attempts = getLoginAttempts();
  const attemptData = attempts[normalizedEmail];
  
  if (!attemptData) return MAX_ATTEMPTS;
  
  return Math.max(0, MAX_ATTEMPTS - attemptData.count);
}

