export const ORG_THEMES = {
  RETC: {
    code: "RETC",
    name: "Renewable Energy Training Center",
    branding: {
      tagline: "Renewable Energy Training Center",
      logo:
        "https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/691207f70014b1c970a0/view?project=68926e9b000ac167ec8a",
      logoProxy: "/api/organizations/RETC/logo",
      bucketId: "68aa099d001f36378da4",
      fileId: "691207f70014b1c970a0",
    },
    appwriteOrgId: process.env.NEXT_PUBLIC_RETC_ORG_ID,
    colors: {
      primary: "#059669",
      primaryDark: "#047857",
      accent: "#2563eb",
      accentDark: "#1d4ed8",
      background: "#ecfdf5",
      surface: "#ffffff",
      muted: "rgba(236, 253, 245, 0.55)",
      gradientFrom: "rgba(5, 150, 105, 0.85)",
      gradientTo: "rgba(37, 99, 235, 0.65)",
      heroAccentA: "rgba(5, 150, 105, 0.35)",
      heroAccentB: "rgba(37, 99, 235, 0.25)",
      heroAccentC: "rgba(5, 150, 105, 0.25)",
    },
  },
  NREP: {
    code: "NREP",
    name: "National Renewable Energy Platform",
    branding: {
      tagline: "National Renewable Energy Platform",
      logo:
        "https://appwrite.nrep.ug/v1/storage/buckets/69119d03002298151073/files/69119d30003cb272abde/view?project=68926e9b000ac167ec8a",
      logoProxy: "/api/organizations/NREP/logo",
      bucketId: "69119d03002298151073",
      fileId: "69119d30003cb272abde",
    },
    appwriteOrgId: process.env.NEXT_PUBLIC_NREP_ORG_ID,
    projects: {
      allowedIds: [
        "690c5f9700064e63efb8",
        "690c5f650033e5ca78f8",
      ],
      defaultId: "690c5f9700064e63efb8",
    },
    colors: {
      primary: "#0E6370",
      primaryDark: "#0A4E57",
      accent: "#1F8B99",
      accentDark: "#166776",
      background: "#e6f6f8",
      surface: "#ffffff",
      muted: "rgba(222, 243, 245, 0.6)",
      gradientFrom: "rgba(14, 99, 112, 0.85)",
      gradientTo: "rgba(22, 103, 118, 0.6)",
      heroAccentA: "rgba(14, 99, 112, 0.35)",
      heroAccentB: "rgba(31, 139, 153, 0.25)",
      heroAccentC: "rgba(10, 78, 87, 0.25)",
    },
  },
};

export const DEFAULT_ORG_CODE = "RETC";

export function resolveOrgTheme(code) {
  if (!code) return ORG_THEMES.RETC;
  const key = code.toUpperCase();
  return ORG_THEMES[key] || ORG_THEMES.RETC;
}
