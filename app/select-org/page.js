"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useToastContext } from "../../components/providers/toast-provider";
import { useOrgTheme } from "../../components/providers/org-theme-provider";
import { setCurrentOrgCode } from "../../lib/utils/org";
import { resolveOrgTheme, DEFAULT_ORG_CODE } from "../../lib/constants/org-branding";
import { getCurrentStaff } from "../../lib/utils/auth";
import { resolveOrgCodeFromIdentifier } from "../../lib/utils/org";

export default function SelectOrgPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastContext();
  const { setOrgCode } = useOrgTheme();
  const [loading, setLoading] = useState(true);
  const [orgCodes, setOrgCodes] = useState([]);
  const [error, setError] = useState(null);

  const callbackUrl = searchParams.get("callback") || "/dashboard";

  useEffect(() => {
    let active = true;

    async function loadStaffOrgs() {
      try {
        const staff = await getCurrentStaff();
        const rawCodes = Array.isArray(staff?.orgCodes)
          ? staff.orgCodes
          : [staff?.orgCode, staff?.orgId, staff?.orgMemberships].flat().filter(Boolean);

        const normalised = rawCodes
          .map((code) => resolveOrgCodeFromIdentifier(code))
          .filter(Boolean);

        const deduped = Array.from(
          new Set(normalised.length ? normalised : [DEFAULT_ORG_CODE])
        );

        if (active) {
          setOrgCodes(deduped);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load your organisation memberships.");
          setOrgCodes([DEFAULT_ORG_CODE]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStaffOrgs();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && orgCodes.length === 1) {
      const chosen = orgCodes[0];
      setCurrentOrgCode(chosen);
      setOrgCode(chosen);
      router.replace(callbackUrl);
    }
  }, [loading, orgCodes, router, callbackUrl, setOrgCode]);

  const handleSelect = (code) => {
    setCurrentOrgCode(code);
    setOrgCode(code);
    toast.success(`Switched to ${resolveOrgTheme(code).name}`);
    router.replace(callbackUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-page__background">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 border-4 border-org-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Preparing your workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center login-page__background p-6">
      <div className="w-full max-w-4xl space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orgCodes.map((code) => {
            const theme = resolveOrgTheme(code);
            return (
              <Card
                key={code}
                className="border border-transparent hover:shadow-xl transition-shadow"
                style={{
                  background: "var(--org-surface)",
                }}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur flex items-center justify-center shadow-md">
                      <img
                        src={theme.branding.logoProxy || theme.branding.logo}
                        alt={`${theme.name} logo`}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">
                        {theme.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {theme.branding.tagline}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-2xl login-page__orb--muted text-gray-700 text-sm">
                    Tailored workspace for {theme.name}. Switch to access dashboards,
                    requests, and assets specific to this organisation.
                  </div>
                  <Button
                    className="w-full"
                    style={{
                      background:
                        "linear-gradient(to right, var(--org-primary), var(--org-primary-dark))",
                    }}
                    onClick={() => handleSelect(code)}
                  >
                    Continue with {theme.code}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {orgCodes.length === 0 && (
          <div className="text-center text-sm text-gray-600">
            No organisations available. Please contact an administrator.
          </div>
        )}
      </div>
    </div>
  );
}
