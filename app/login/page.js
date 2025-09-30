"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { login, verifySession, getCurrentStaff } from "../../lib/utils/auth.js";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const callback = searchParams.get("callback");
    if (callback) {
      setCallbackUrl(callback);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginResult = await login(email, password, callbackUrl);

      // Wait for session to be properly established and cookies to be set
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify session is established before redirecting (with retries for timing issues)
      let sessionUser = await verifySession();
      let retryCount = 0;
      const maxRetries = 3;

      // Retry session verification if it fails (to handle timing issues)
      while (!sessionUser && retryCount < maxRetries) {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 300));
        sessionUser = await verifySession();
      }

      if (sessionUser) {
        // Fetch complete staff details from database
        try {
          const staff = await getCurrentStaff();
        } catch (staffError) {
          // Silent fail for staff details
        }

        // Show success message with slide-in animation
        setShowSuccessMessage(true);

        // Force a small delay before redirect to ensure middleware sees the session
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.push(callbackUrl);
      } else {
        throw new Error(
          "Session verification failed - please try logging in again"
        );
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slide-in-left {
          0% {
            transform: translateX(-100%) scale(0.8) rotateY(-15deg);
            opacity: 0;
            filter: blur(10px);
          }
          20% {
            transform: translateX(-50%) scale(0.9) rotateY(-8deg);
            opacity: 0.3;
            filter: blur(5px);
          }
          40% {
            transform: translateX(-20%) scale(0.95) rotateY(-4deg);
            opacity: 0.6;
            filter: blur(2px);
          }
          60% {
            transform: translateX(5%) scale(1.02) rotateY(2deg);
            opacity: 0.8;
            filter: blur(0px);
          }
          80% {
            transform: translateX(-2%) scale(0.98) rotateY(-1deg);
            opacity: 0.9;
            filter: blur(0px);
          }
          100% {
            transform: translateX(0) scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-origin: center;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) rotate(2deg);
            opacity: 0.8;
          }
          70% {
            transform: scale(0.95) rotate(-1deg);
            opacity: 0.9;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
      <div className="min-h-screen flex">
        {/* Left Side - Branding & Hero */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 relative overflow-hidden animate-gradient">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 flex flex-col justify-start px-12 pt-24 pb-12 animate-fade-in-up">
            <div className="max-w-lg">
              {/* Logo */}
              <div className="mb-12 animate-bounce-subtle">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl border border-white/30 hover:shadow-3xl hover:scale-105 transition-all duration-300">
                  <img
                    src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                    alt="RETC Logo"
                    className="w-12 h-12 object-cover rounded-xl"
                  />
                </div>
              </div>

              {/* Hero Text */}
              <div className="space-y-6 text-white">
                <h1
                  className="text-4xl lg:text-5xl font-bold leading-tight animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  Welcome to
                  <span className="block text-primary-200 animate-glow">
                    RETC Assets Manager
                  </span>
                </h1>
                <p
                  className="text-xl text-primary-100 leading-relaxed animate-fade-in-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  Streamline your asset management with our comprehensive
                  platform designed for the Renewable Energy Training Center.
                </p>
                <div
                  className="flex items-center space-x-4 pt-8 animate-fade-in-up"
                  style={{ animationDelay: "0.6s" }}
                >
                  <div className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center hover:bg-green-300 transition-colors duration-300 hover:scale-110 transform">
                    <svg
                      className="w-6 h-6 text-green-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-primary-100 hover:text-white transition-colors duration-300">
                    Secure & Reliable Asset Tracking
                  </span>
                </div>
                <div
                  className="flex items-center space-x-4 animate-fade-in-up"
                  style={{ animationDelay: "0.8s" }}
                >
                  <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center hover:bg-orange-300 transition-colors duration-300 hover:scale-110 transform">
                    <svg
                      className="w-6 h-6 text-orange-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-primary-100 hover:text-white transition-colors duration-300">
                    Comprehensive Request Management
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements with Animations */}
          <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-white/5 blur-3xl animate-float"></div>
          <div className="absolute bottom-40 right-12 w-24 h-24 rounded-full bg-primary-400/20 blur-2xl animate-float-reverse"></div>
          <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl animate-pulse-slow"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-start justify-center px-6 pt-16 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 animate-fade-in">
          <div className="w-full max-w-md space-y-6 animate-slide-in-right">
            {/* Mobile Logo */}
            <div
              className="flex flex-col items-center lg:hidden animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-bounce-subtle">
                <img
                  src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                  alt="RETC Logo"
                  className="w-10 h-10 object-cover rounded-lg"
                />
              </div>
              <h2
                className="mt-4 text-2xl font-bold text-gray-900 animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                Asset Manager
              </h2>
              <p
                className="text-gray-600 animate-fade-in-up"
                style={{ animationDelay: "0.6s" }}
              >
                RETC Management System
              </p>
            </div>

            {/* Login Form */}
            <div
              className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/60 overflow-hidden hover:shadow-3xl transition-all duration-500 animate-fade-in-up relative"
              style={{ animationDelay: "0.3s" }}
            >
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-sidebar-50/30 pointer-events-none"></div>

              {/* Floating decorative elements */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full blur-sm animate-pulse"></div>
              <div
                className="absolute bottom-6 left-6 w-6 h-6 bg-gradient-to-br from-sidebar-400/20 to-sidebar-600/20 rounded-full blur-sm animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
              <div
                className="absolute top-1/2 right-8 w-4 h-4 bg-gradient-to-br from-green-400/30 to-green-600/30 rounded-full blur-sm animate-bounce"
                style={{ animationDelay: "0.5s" }}
              ></div>

              <div className="relative px-8 py-12 lg:px-12 lg:py-16">
                <div className="mb-10 text-center">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent mb-3 drop-shadow-sm">
                    Welcome back!
                  </h2>
                  <p className="text-lg font-medium text-gray-700 leading-relaxed">
                    Please enter your credentials to access your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label
                      htmlFor="email"
                      className="block text-base font-bold text-gray-800 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 disabled:bg-gray-50 disabled:text-gray-500 shadow-sm hover:shadow-md"
                        placeholder="your.email@retc.org"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 mt-4">
                    <label
                      htmlFor="password"
                      className="block text-base font-bold text-gray-800 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="block w-full pl-12 pr-12 py-4 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 disabled:bg-gray-50 disabled:text-gray-500 shadow-sm hover:shadow-md"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-2 border-gray-400 rounded transition-all duration-200"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-3 text-base font-semibold text-gray-800"
                      >
                        Remember me
                      </label>
                    </div>

                    <button
                      type="button"
                      className="text-base font-bold text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-primary-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading && (
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {loading ? "Signing in..." : "Sign In"}
                  </button>

                  {/* Success Message with Super Catchy Slide-in Animation */}
                  {showSuccessMessage && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                      <div className="bg-gradient-to-br from-white via-green-50 to-primary-50 rounded-3xl p-8 max-w-md mx-4 shadow-2xl border-2 border-green-200 animate-slide-in-left">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in shadow-lg">
                            <svg
                              className="w-10 h-10 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-primary-600 bg-clip-text text-transparent mb-3">
                            🎉 Login Successful!
                          </h3>
                          <p className="text-gray-700 mb-6 text-lg">
                            Welcome back! Redirecting you to your dashboard...
                          </p>
                          <div className="flex justify-center">
                            <div className="relative">
                              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-200"></div>
                              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent absolute top-0 left-0"></div>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-center space-x-1">
                            <div
                              className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center space-y-6">
              <p className="text-base text-gray-700 font-medium">
                Need access?{" "}
                <span className="font-bold text-primary-600 hover:text-primary-700 transition-colors duration-200 cursor-pointer">
                  Contact your system administrator
                </span>
              </p>

              {/* Guest Portal Link */}
              <div className="bg-gradient-to-r from-sidebar-50 via-sidebar-100 to-primary-50 rounded-2xl p-6 border-2 border-sidebar-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <p className="text-base text-gray-800 font-semibold mb-3">
                  Don't have an account?
                </p>
                <a
                  href="/guest"
                  className="inline-flex items-center text-base font-bold text-sidebar-600 hover:text-sidebar-700 transition-all duration-200 hover:scale-105"
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Access Guest Portal
                </a>
              </div>

              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 font-medium">
                <span>© 2025 RETC</span>
                <span>•</span>
                <span>Asset Management System</span>
                <span>•</span>
                <span>Secure Login</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
