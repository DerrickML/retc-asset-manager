"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentOrgCode,
  setCurrentOrgCode,
  syncHtmlDataAttribute,
  getOrgTheme,
} from "../../lib/utils/org";
import { resolveOrgTheme } from "../../lib/constants/org-branding";

const OrgThemeContext = createContext({
  orgCode: "RETC",
  theme: resolveOrgTheme("RETC"),
  setOrgCode: () => {},
});

const CSS_VARIABLES = [
  "primary",
  "primaryDark",
  "accent",
  "accentDark",
  "background",
  "surface",
  "muted",
  "gradientFrom",
  "gradientTo",
  "heroAccentA",
  "heroAccentB",
  "heroAccentC",
];

function applyThemeToCssVariables(theme) {
  if (typeof document === "undefined" || !theme?.colors) return;
  const root = document.documentElement;

  CSS_VARIABLES.forEach((key) => {
    const value = theme.colors[key];
    if (value) {
      root.style.setProperty(`--org-${key}`, value);
    }
  });
}

export function OrgThemeProvider({ children }) {
  const [orgCode, setOrgCodeState] = useState(() =>
    getCurrentOrgCode().toUpperCase()
  );

  useEffect(() => {
    syncHtmlDataAttribute(orgCode);
    setCurrentOrgCode(orgCode);
  }, [orgCode]);

  useEffect(() => {
    const theme = resolveOrgTheme(orgCode);
    applyThemeToCssVariables(theme);
  }, [orgCode]);

  useEffect(() => {
    const theme = getOrgTheme();
    applyThemeToCssVariables(theme);
  }, []);

  const value = useMemo(() => {
    const theme = resolveOrgTheme(orgCode);
    return {
      orgCode,
      theme,
      setOrgCode: (code) => {
        if (!code) return;
        setOrgCodeState(code.toUpperCase());
      },
    };
  }, [orgCode]);

  return (
    <OrgThemeContext.Provider value={value}>
      {children}
    </OrgThemeContext.Provider>
  );
}

export function useOrgTheme() {
  const context = useContext(OrgThemeContext);
  if (!context) {
    throw new Error("useOrgTheme must be used within an OrgThemeProvider");
  }
  return context;
}
