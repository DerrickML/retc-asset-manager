import { ORG_THEMES, DEFAULT_ORG_CODE, resolveOrgTheme } from "../constants/org-branding";

const STORAGE_KEY = "currentOrgCode";
const COOKIE_NAME = "currentOrgCode";

export function getCurrentOrgCode() {
  try {
    const cookieVal = getCookie(COOKIE_NAME);
    const resolvedFromCookie = resolveOrgCodeFromIdentifier(cookieVal);
    if (resolvedFromCookie) return resolvedFromCookie;

    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem(STORAGE_KEY);
      const resolvedFromStorage = resolveOrgCodeFromIdentifier(ls);
      if (resolvedFromStorage) return resolvedFromStorage;
    }
  } catch {}
  return DEFAULT_ORG_CODE;
}

export function setCurrentOrgCode(code) {
  if (!code) return;
  const resolved = resolveOrgCodeFromIdentifier(code);
  if (!resolved) return;
  const normalised = resolved.toUpperCase();
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, normalised);
      document.cookie = `${COOKIE_NAME}=${normalised}; path=/; max-age=2592000; samesite=lax`;
    }
  } catch {}
}

export function syncHtmlDataAttribute(code) {
  try {
    if (typeof document !== "undefined") {
      const value = (code || getCurrentOrgCode()).toUpperCase();
      document.documentElement.setAttribute("data-org", value);
    }
  } catch {}
}

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function resolveOrgCodeFromIdentifier(identifier) {
  if (!identifier) return null;
  const maybeCode = typeof identifier === "string" ? identifier.trim() : "";
  if (!maybeCode) return null;
  const upper = maybeCode.toUpperCase();
  if (ORG_THEMES[upper]) return upper;

  const match = Object.values(ORG_THEMES).find(
    (org) => org.appwriteOrgId && org.appwriteOrgId === identifier
  );

  return match ? match.code : null;
}

export function getOrgTheme() {
  const code = getCurrentOrgCode().toUpperCase();
  return resolveOrgTheme(code);
}

export function getCurrentOrgId() {
  const code = getCurrentOrgCode().toUpperCase();
  const theme = resolveOrgTheme(code);
  if (theme?.appwriteOrgId) return theme.appwriteOrgId;

  const retc = process.env.NEXT_PUBLIC_RETC_ORG_ID || "";
  const nrep = process.env.NEXT_PUBLIC_NREP_ORG_ID || "";
  if (code === "NREP") return nrep;
  return retc;
}

export function listSupportedOrgCodes() {
  return Object.keys(ORG_THEMES);
}


