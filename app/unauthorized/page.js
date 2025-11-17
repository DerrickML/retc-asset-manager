"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { account } from "../../lib/appwrite/client.js";
import { useOrgTheme } from "../../components/providers/org-theme-provider";
import { Mail, UserX, Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { PageLoading } from "../../components/ui/loading";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const { orgCode } = useOrgTheme();
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const redirectTimeoutRef = useRef(null);

  const isNoStaffRecord = reason === "no_staff_record";

  // Get organization-specific contact email with fallback
  const getContactEmail = () => {
    try {
      const org = (orgCode?.toUpperCase() || "RETC").trim();
      if (org === "RETC") {
        return "retc@nrep.ug";
      } else if (org === "NREP") {
        return "info@nrep.ug";
      }
      return "retc@nrep.ug";
    } catch (error) {
      // Fallback if orgCode access fails
      return "retc@nrep.ug";
    }
  };

  const clearSessionAndRedirect = async () => {
    try {
      setClearing(true);
      
      // Clear all auth-related localStorage safely
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("auth_staff");
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_last_activity");
          localStorage.removeItem("auth_session_expiry");
          localStorage.removeItem("currentOrgCode");
        } catch (storageError) {
          console.warn("Error clearing localStorage:", storageError);
          // Continue anyway
        }
      }

      // Clear Appwrite session safely
      try {
        if (account && typeof account.deleteSession === "function") {
          await Promise.race([
            account.deleteSession("current"),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Session deletion timeout")), 3000)
            )
          ]);
        }
      } catch (err) {
        // Ignore errors - session might not exist or network issue
        console.warn("Session deletion failed (non-critical):", err);
      }

      setCleared(true);
      
      // Clear any existing timeout
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      
      // Small delay to show success message, then redirect
      redirectTimeoutRef.current = setTimeout(() => {
        try {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        } catch (redirectError) {
          console.error("Redirect error:", redirectError);
          // Try alternative redirect method
          if (typeof window !== "undefined" && window.location) {
            window.location.replace("/login");
          }
        }
      }, 1500);
    } catch (error) {
      console.error("Error clearing session:", error);
      // Force redirect anyway
      try {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } catch (redirectError) {
        console.error("Critical redirect error:", redirectError);
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2">
        <CardHeader className="text-center pb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isNoStaffRecord 
              ? "bg-amber-100" 
              : "bg-red-100"
          }`}>
            {isNoStaffRecord ? (
              <UserX className="w-10 h-10 text-amber-600" />
            ) : (
              <Shield className="w-10 h-10 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isNoStaffRecord ? "Account Setup Required" : "Access Denied"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isNoStaffRecord
              ? "Your account needs to be set up in the system"
              : "You don't have permission to access this resource"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isNoStaffRecord ? (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-1">What happened?</p>
                      <p className="text-sm">
                        Your login credentials are valid, but your account hasn&apos;t been set up in the system yet. 
                        This usually means your administrator needs to create your staff profile.
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  What you need to do:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-7">
                  <li>Contact your system administrator</li>
                  <li>Ask them to create your staff record in the system</li>
                  <li>Once your account is set up, you can log in normally</li>
                </ol>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Need help? Contact support:
                </p>
                <a
                  href={`mailto:${getContactEmail()}?subject=Account Setup Request&body=Hello,%0D%0A%0D%0AI need my account set up in the system. My email address is the one I'm sending from.%0D%0A%0D%0AThank you.`}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getContactEmail()}
                </a>
              </div>

              {cleared ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                  <AlertDescription className="text-green-800">
                    Session cleared successfully. Redirecting to login...
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Once your account is set up, you can return to the login page.
                  </p>
                  <Button
                    onClick={clearSessionAndRedirect}
                    disabled={clearing}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-base"
                    size="lg"
                  >
                    {clearing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Clearing session...
                      </>
                    ) : (
                      <>
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Return to Login Page
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800">
                  You don't have the required permissions to access this page. 
                  If you believe this is an error, please contact your system administrator.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/login" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Return to Login
                  </Link>
                </Button>
                <Button asChild className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<PageLoading message="Loading..." />}>
      <UnauthorizedContent />
    </Suspense>
  );
}