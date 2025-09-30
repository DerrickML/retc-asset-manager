"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { settingsService, assetsService } from "../../lib/appwrite/provider.js";
import { formatCategory } from "../../lib/utils/mappings.js";
import { Query } from "appwrite";
import {
  Search,
  Package,
  CheckCircle,
  Tag,
  ArrowRight,
  Users,
  Shield,
  Zap,
} from "lucide-react";

export default function GuestHomePage() {
  const [settings, setSettings] = useState(null);
  const [featuredAssets, setFeaturedAssets] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, categories: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [systemSettings, publicAssets] = await Promise.all([
        settingsService.get(),
        assetsService.getPublicAssets([
          Query.limit(6),
          Query.orderDesc("$createdAt"),
        ]),
      ]);

      setSettings(systemSettings);
      setFeaturedAssets(publicAssets.documents);

      // Calculate stats
      const allPublicAssets = await assetsService.getPublicAssets();
      const categories = new Set(
        allPublicAssets.documents.map((asset) => asset.category)
      );
      const available = allPublicAssets.documents.filter(
        (asset) => asset.availableStatus === "AVAILABLE"
      ).length;

      setStats({
        total: allPublicAssets.total,
        available,
        categories: categories.size,
      });
    } catch (error) {
      console.error("Failed to load guest portal data:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/guest/assets?search=${encodeURIComponent(
        searchQuery.trim()
      )}`;
    } else {
      window.location.href = "/guest/assets";
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">
            Loading guest portal...
          </p>
        </div>
      </div>
    );
  }

  // Check if guest portal is enabled
  if (!settings.guestPortal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-2 border-primary-200 shadow-2xl">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Guest Portal Unavailable
            </h1>
            <p className="text-gray-600 mb-6">
              The public asset catalog is currently disabled.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
            >
              <Link href="/login">Staff Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent mb-6">
            Explore Our Assets Catalog
          </h2>
          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            Browse our collection of renewable energy training assets and
            resources. Sign in to request assets for your projects.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-300" />
              </div>
              <Input
                type="text"
                placeholder="Search assets, tools, or resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-l-xl rounded-r-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 shadow-lg hover:border-primary-400 hover:shadow-xl transition-all duration-300 group-hover:shadow-2xl focus:outline-none"
              />
              <Button
                type="submit"
                className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-sidebar-600 hover:to-primary-800 px-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold rounded-r-xl rounded-l-none border-l-0 border-2 border-primary-600 hover:border-primary-700"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-gradient-to-br from-sidebar-50 to-sidebar-100 border-2 border-sidebar-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-sidebar-700 mb-2">
                  {stats.total}
                </div>
                <div className="text-sidebar-600 font-semibold">
                  Total Assets
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-primary-700 mb-2">
                  {stats.available}
                </div>
                <div className="text-primary-600 font-semibold">
                  Available Now
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-purple-700 mb-2">
                  {stats.categories}
                </div>
                <div className="text-purple-600 font-semibold">Categories</div>
              </CardContent>
            </Card>
          </div>

          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-sidebar-600 hover:to-primary-800 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <Link href="/guest/assets" className="flex items-center">
              Browse All Assets
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Assets */}
      {featuredAssets.length > 0 && (
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent text-center mb-16">
              Recently Added Assets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredAssets.map((asset) => (
                <Card
                  key={asset.$id}
                  className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-bold text-gray-900 flex-1 text-lg group-hover:text-primary-700 transition-colors duration-200">
                        {asset.name}
                      </h4>
                      <Badge
                        className={
                          asset.availableStatus === "AVAILABLE"
                            ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-primary-300"
                            : "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300"
                        }
                      >
                        {asset.availableStatus === "AVAILABLE"
                          ? "Available"
                          : "On Loan"}
                      </Badge>
                    </div>

                    <p className="text-sm font-semibold text-sidebar-600 mb-3 bg-sidebar-50 px-3 py-1 rounded-full inline-block">
                      {formatCategory(asset.category)}
                    </p>

                    {asset.publicSummary && (
                      <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed">
                        {asset.publicSummary}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 font-medium">
                        {asset.publicLocationLabel && (
                          <span>📍 {asset.publicLocationLabel}</span>
                        )}
                      </div>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-sidebar-600 to-sidebar-700 hover:from-sidebar-700 hover:to-sidebar-800 text-sm px-4 py-2"
                      >
                        <Link
                          href={`/guest/assets/${asset.$id}`}
                          className="flex items-center"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary-50 via-primary-100/50 to-sidebar-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 border-2 border-primary-200/60 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent mb-6">
              Need to Request Assets?
            </h3>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Sign in to your staff account to request assets, track your
              requests, and manage your asset loans.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-sidebar-600 hover:to-primary-800 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/login" className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Sign In to Request Assets
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary-800 via-primary-900 to-sidebar-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-500 rounded-lg flex items-center justify-center mr-2">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-lg font-bold">{settings.branding.orgName}</h4>
          </div>
          <p className="text-primary-200 text-sm">
            &copy; 2025 {settings.branding.orgName}. All rights reserved. •
            Asset Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
