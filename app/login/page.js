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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [showPassword, setShowPassword] = useState(false);
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
      console.log("🔍 LOGIN DEBUG - Starting login process");
      await login(email, password, callbackUrl);

      console.log("🔍 LOGIN DEBUG - Login successful, waiting for session");
      // Wait for session to be properly established and cookies to be set
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify session is established before redirecting (with retries for timing issues)
      let sessionUser = await verifySession();
      console.log("🔍 LOGIN DEBUG - Session verification result:", sessionUser);
      let retryCount = 0;
      const maxRetries = 3;

      // Retry session verification if it fails (to handle timing issues)
      while (!sessionUser && retryCount < maxRetries) {
        retryCount++;
        console.log(
          "🔍 LOGIN DEBUG - Retrying session verification, attempt:",
          retryCount
        );
        await new Promise((resolve) => setTimeout(resolve, 300));
        sessionUser = await verifySession();
      }

      if (sessionUser) {
        console.log(
          "🔍 LOGIN DEBUG - Session verified, fetching staff details"
        );
        // Fetch complete staff details from database
        try {
          await getCurrentStaff();
          console.log("🔍 LOGIN DEBUG - Staff details fetched successfully");
        } catch (staffError) {
          console.log(
            "🔍 LOGIN DEBUG - Staff details fetch failed:",
            staffError
          );
          // Staff details fetch failed, but continue with login
        }

        // Force a small delay before redirect to ensure middleware sees the session
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("🔍 LOGIN DEBUG - Redirecting to:", callbackUrl);
        router.push(callbackUrl);
      } else {
        console.log(
          "🔍 LOGIN DEBUG - Session verification failed after retries"
        );
        throw new Error(
          "Session verification failed - please try logging in again"
        );
      }
    } catch (err) {
      console.log("🔍 LOGIN DEBUG - Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50">
      {/* Advanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/30 to-primary-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-sidebar-400/25 to-sidebar-600/25 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute -bottom-40 right-1/3 w-64 h-64 bg-gradient-to-br from-primary-300/35 to-sidebar-300/35 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Additional floating elements for depth */}
        <div
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-primary-200/20 to-sidebar-200/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-gradient-to-br from-sidebar-300/15 to-primary-300/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "3.5s" }}
        ></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-20 w-4 h-4 bg-primary-500/30 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-40 right-32 w-6 h-6 bg-sidebar-500/30 rounded-full animate-bounce"
          style={{ animationDelay: "2.5s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 w-3 h-3 bg-primary-400/40 rounded-full animate-bounce"
          style={{ animationDelay: "3.5s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-5 h-5 bg-sidebar-400/30 rounded-full animate-bounce"
          style={{ animationDelay: "4.5s" }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Modern Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-sidebar-700"></div>

          {/* Mesh Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-sidebar-500/20"></div>

          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
                backgroundSize: "60px 60px",
                backgroundPosition: "0 0, 30px 30px",
              }}
            ></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-16 py-24 text-white">
            {/* Logo with Glow Effect */}
            <div className="mb-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl border border-white/30 hover:shadow-3xl hover:scale-105 transition-all duration-300">
                  <img
                    src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                    alt="RETC Logo"
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-400/30 to-sidebar-400/30 blur-xl"></div>
              </div>
            </div>

            {/* Hero Text with Modern Typography */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                  Welcome to
                  <span className="block bg-gradient-to-r from-white via-primary-200 to-sidebar-200 bg-clip-text text-transparent">
                    Asset Manager
                  </span>
                </h1>
                <p className="text-xl text-primary-100 leading-relaxed max-w-lg">
                  Experience the future of asset management with our
                  cutting-edge platform designed for the Renewable Energy
                  Training Center.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sidebar-400 to-sidebar-500 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
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
                  <div>
                    <h3 className="font-semibold text-white">
                      Secure & Reliable
                    </h3>
                    <p className="text-primary-100 text-sm">
                      Enterprise-grade security for your assets
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
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
                  <div>
                    <h3 className="font-semibold text-white">
                      Smart Management
                    </h3>
                    <p className="text-primary-100 text-sm">
                      AI-powered asset tracking and analytics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Modern Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center lg:hidden mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-sidebar-600 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://appwrite.nrep.ug/v1/storage/buckets/68aa099d001f36378da4/files/68aa09f10037892a3872/view?project=68926e9b000ac167ec8a&mode=admin"
                  alt="RETC Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                Asset Manager
              </h2>
              <p className="text-gray-600">RETC Management System</p>
            </div>

            {/* Ultra-Modern Login Card */}
            <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden group hover:shadow-3xl transition-all duration-500">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-primary-50/30 rounded-3xl"></div>

              {/* Animated border gradient */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/20 via-sidebar-500/20 to-primary-500/20 p-[1px]">
                <div className="w-full h-full bg-white/90 backdrop-blur-2xl rounded-3xl"></div>
              </div>

              <div className="relative px-8 py-10 lg:px-10 lg:py-12">
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-sidebar-500 mb-4 shadow-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-sidebar-600 bg-clip-text text-transparent mb-2">
                    Welcome back
                  </h2>
                  <p className="text-gray-600">
                    Sign in to your account to continue
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
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

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-700"
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
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="pl-12 pr-4 py-4 block w-full rounded-2xl border-2 border-gray-200/50 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90 shadow-sm hover:shadow-md focus:shadow-lg"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
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
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        className="pl-12 pr-12 py-4 block w-full rounded-2xl border-2 border-gray-200/50 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90 shadow-sm hover:shadow-md focus:shadow-lg"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-2 border-gray-300 rounded transition-all duration-200"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        Remember me
                      </label>
                    </div>
                    <a
                      href="#"
                      className="text-sm font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Ultra-Modern Login Button */}
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-primary-800 hover:to-sidebar-700 focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl overflow-hidden"
                    disabled={loading}
                  >
                    {/* Animated background shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    {/* Button content */}
                    <span className="relative z-10 flex items-center">
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
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Enhanced Guest Portal Button */}
            <div className="text-center">
              <Button
                asChild
                className="group relative w-full bg-gradient-to-r from-sidebar-600 via-sidebar-700 to-primary-600 hover:from-sidebar-700 hover:via-sidebar-800 hover:to-primary-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 overflow-hidden"
              >
                <a
                  href="/guest"
                  className="relative z-10 flex items-center justify-center space-x-3"
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="group-hover:tracking-wide transition-all duration-300">
                    Browse the Guest Portal
                  </span>
                </a>
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Need access?{" "}
                <span className="font-semibold text-primary-600">
                  Contact your system administrator
                </span>
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <a
                  href="#"
                  className="hover:text-gray-700 transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                <span>•</span>
                <a
                  href="#"
                  className="hover:text-gray-700 transition-colors duration-200"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
