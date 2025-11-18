"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { settingsService, assetsService } from "../../lib/appwrite/provider.js";
import { assetImageService } from "../../lib/appwrite/image-service.js";
import { formatCategory } from "../../lib/utils/mappings.js";
import { Query } from "appwrite";
import { useOrgTheme } from "../../components/providers/org-theme-provider";
import { setCurrentOrgCode } from "../../lib/utils/org";
import { DEFAULT_ORG_CODE } from "../../lib/constants/org-branding";
import {
  Search,
  Package,
  CheckCircle,
  Tag,
  ArrowRight,
  Users,
  Shield,
  Zap,
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  MapPin,
  Star,
  LogIn,
} from "lucide-react";

// Masonry Card Component (for assets only - consumables are internal)
const MasonryCard = ({ item }) => {
  return (
    <div className="break-inside-avoid mb-8 group">
      <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 hover:border-gray-300/60 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden h-full flex flex-col rounded-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0" style={{ opacity: 0.05, background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}></div>
        <div
          className="absolute -top-4 -right-4 w-8 h-8 rounded-full group-hover:scale-150 transition-transform duration-700"
          style={{ background: "linear-gradient(135deg, var(--org-primary), var(--org-accent))", opacity: 0.25 }}
        ></div>
        <div
          className="absolute -bottom-4 -left-4 w-6 h-6 rounded-full group-hover:scale-125 transition-transform duration-700"
          style={{ background: "linear-gradient(135deg, var(--org-accent), var(--org-primary))", opacity: 0.2, animationDelay: "0.2s" }}
        ></div>

        <CardContent className="relative p-0 flex flex-col h-full">
          {/* Image Section */}
          <div className="relative overflow-hidden rounded-t-2xl">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              {item.assetImage ? (
                <img
                  src={
                    item.assetImage.startsWith("http")
                      ? item.assetImage
                      : assetImageService.getPublicImageUrl(item.assetImage)
                  }
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-gray-500 transition-colors duration-300"
                style={{
                  display: item.assetImage ? "none" : "flex",
                }}
              >
                <Package className="w-16 h-16 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 55%)", opacity: 0, transition: "opacity 0.5s" }}></div>

            {/* Type Badge */}
            <div className="absolute top-4 left-4">
              <Badge 
                variant="outline"
                className="font-semibold px-4 py-2 rounded-full border-0 shadow-lg backdrop-blur-sm"
                style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)" }}>
                <span style={{ color: "white" }}>Asset</span>
              </Badge>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <Badge
                variant="outline"
                className="font-semibold px-4 py-2 rounded-full border-0 shadow-lg backdrop-blur-sm"
                style={{
                  background:
                    item.availableStatus === "AVAILABLE"
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                }}
              >
                <span style={{ color: "white" }}>{item.availableStatus === "AVAILABLE" ? "Available" : "On Loan"}</span>
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col h-full">
            <h3 className="font-bold text-gray-900 text-xl mb-4 transition-colors duration-300 line-clamp-2 leading-tight group-hover:text-[var(--org-primary)]">
              {item.name}
            </h3>

            <Badge
              variant="outline"
              className="text-sm font-semibold mb-5 px-4 py-2 rounded-full inline-block self-start shadow-md"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
              }}
            >
              <span style={{ color: "white" }}>{formatCategory(item.category)}</span>
            </Badge>

            {item.description && (
              <p className="text-sm text-gray-600 mb-5 line-clamp-3 leading-relaxed flex-grow">
                {item.description}
              </p>
            )}

            {/* Spacer to push button to bottom */}
            <div className="flex-grow"></div>

            {/* Enhanced Action Button */}
            <div className="flex justify-center mt-6">
              <Button
                size="sm"
                className="relative text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px] rounded-xl font-semibold overflow-hidden"
                style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                asChild
              >
                <Link
                  href={`/guest/assets/${item.$id}`}
                  className="flex items-center justify-center relative z-10"
                >
                  <Eye className="w-5 h-5 mr-2 transition-transform duration-300" />
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function GuestHomePage() {
  const { orgCode, setOrgCode } = useOrgTheme();
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({
    totalAssets: 0,
    availableAssets: 0,
    totalConsumables: 0,
    inStockConsumables: 0,
    categories: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // New state for enhanced functionality
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("masonry"); // "masonry" or "grid"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState(
    () => orgCode?.toUpperCase() || DEFAULT_ORG_CODE
  );

  useEffect(() => {
    // Guest portal is always RETC
    const normalised = orgCode?.toUpperCase() || DEFAULT_ORG_CODE;
    if (normalised !== "RETC") {
      setCurrentOrgCode("RETC");
      setOrgCode("RETC");
      setSelectedOrg("RETC");
    } else {
      setSelectedOrg("RETC");
    }
  }, [orgCode, setOrgCode]);

  // Loading spinner component (inline to avoid new files)
  const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
        <p className="text-primary-600 font-medium">{message}</p>
      </div>
    </div>
  );

  // Filter and pagination logic
  const applyFilters = () => {
    let filtered = [...allItems];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Note: No tab filtering needed as only assets are shown (consumables filtered out)

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(
        (item) => item.availableStatus === statusFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.$createdAt) - new Date(a.$createdAt);
        case "oldest":
          return new Date(a.$createdAt) - new Date(b.$createdAt);
        case "name":
          return a.name.localeCompare(b.name);
        case "popular":
          // You can implement popularity logic here
          return 0;
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };

  // Get paginated items
  const getPaginatedItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  // Get unique categories for filter
  const getUniqueCategories = () => {
    const categories = new Set();
    allItems.forEach((item) => {
      if (item.itemType === "CONSUMABLE") {
        categories.add(getConsumableCategory(item));
      } else {
        categories.add(item.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the useEffect that watches searchQuery
  };

  // Helper function to calculate statistics (only for assets, consumables are internal)
  const calculateStats = (assets) => {
    // Only show assets in guest portal (consumables are internal company items)
    const actualAssets = assets.filter(
      (item) =>
        item.itemType === "ASSET" ||
        !item.itemType ||
        item.itemType === undefined
    );

    const assetCategories = new Set(
      actualAssets.map((asset) => asset.category)
    );

    const availableAssets = actualAssets.filter(
      (asset) => asset.availableStatus === "AVAILABLE"
    ).length;

    return {
      totalAssets: actualAssets.length,
      availableAssets,
      totalConsumables: 0, // Not shown in guest portal
      inStockConsumables: 0, // Not shown in guest portal
      categories: assetCategories.size,
    };
  };

  // Stats card component for cleaner code
  const StatsCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
  }) => {
    return (
      <Card className="group relative overflow-hidden bg-white/60 backdrop-blur-sm border border-gray-200/60 transition-all duration-500 hover:scale-105 hover:-translate-y-2">
        {/* Background Gradient */}
        <div className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity duration-500"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)" }}
        ></div>

        {/* Animated Background Elements */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <div
          className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-full group-hover:scale-125 transition-transform duration-700"
          style={{ animationDelay: "0.2s" }}
        ></div>

        <CardContent className="relative text-center py-8 px-6">
          {/* Icon with Enhanced Styling */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300"
            style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
          >
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Value with Animation */}
          <div
            className="text-5xl font-bold mb-3 group-hover:scale-110 transition-transform duration-300"
            style={{ color: "var(--org-primary)" }}
          >
            {value}
          </div>

          {/* Title */}
          <div
            className="font-semibold text-lg mb-2 group-hover:text-opacity-80 transition-colors duration-300"
            style={{ color: "var(--org-primary-dark)" }}
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-sm font-medium" style={{ color: "var(--org-primary)" }}>
              {subtitle}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const loadData = useCallback(async () => {
    try {
      // Set default settings first to prevent infinite loading
      const defaultSettings = {
        guestPortal: true,
        branding: { orgName: "RETC Asset Management" },
      };
      setSettings(defaultSettings);

      // Try to load settings with a shorter timeout and retry
      try {
        let systemSettings = null;

        // Try with a 3-second timeout first
        try {
          const settingsPromise = settingsService.get();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Settings timeout")), 3000)
          );

          systemSettings = await Promise.race([
            settingsPromise,
            timeoutPromise,
          ]);
        } catch (firstAttempt) {
          console.warn(
            "First settings attempt failed, retrying...",
            firstAttempt.message
          );
          // Retry with a longer timeout
          try {
            systemSettings = await Promise.race([
              settingsService.get(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Settings retry timeout")),
                  2000
                )
              ),
            ]);
          } catch (retryError) {
            throw new Error(
              `Settings loading failed after retry: ${retryError.message}`
            );
          }
        }

        if (systemSettings) {
          setSettings(systemSettings);
        }
      } catch (settingsError) {
        console.warn(
          "Settings loading failed, using defaults:",
          settingsError.message
        );
        // Continue with default settings that are already set
      }

      // Try to calculate stats with timeout
      try {
        // Load all items with timeout
        const itemsPromise = assetsService.list();
        const itemsTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Items loading timeout")), 5000)
        );

        const allPublicItems = await Promise.race([
          itemsPromise,
          itemsTimeoutPromise,
        ]).catch((err) => {
          console.warn("Error loading all items:", err.message);
          return { documents: [] };
        });

        // Filter out consumables - they're internal company items
        const publicAssets = allPublicItems.documents.filter(
          (item) =>
            item.itemType !== "CONSUMABLE" ||
            !item.itemType ||
            item.itemType === undefined
        );

        const calculatedStats = calculateStats(publicAssets);
        setStats(calculatedStats);

        // Set all items for filtering and pagination (only assets, no consumables)
        setAllItems(publicAssets);
        setFilteredItems(publicAssets);
      } catch (statsError) {
        console.warn(
          "Stats loading failed, using defaults:",
          statsError.message
        );
        // Set empty arrays for items
        setAllItems([]);
        setFilteredItems([]);
      }
    } catch (error) {
      // Ensure we have default settings and empty data to prevent infinite loading
      setSettings({
        guestPortal: true,
        branding: { orgName: "RETC Asset Management" },
      });
      setAllItems([]);
      setFilteredItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData, orgCode]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (allItems.length > 0) {
      applyFilters();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab, categoryFilter, statusFilter, sortBy, allItems]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, categoryFilter, statusFilter, sortBy]);

  if (isLoading || !settings) {
    return <LoadingSpinner message="Loading guest portal..." />;
  }

  // Additional safety check
  if (!settings || !settings.branding) {
    console.warn("Settings not properly loaded, using fallback");
    return <LoadingSpinner message="Initializing guest portal..." />;
  }

  // Check if guest portal is enabled
  if (!settings.guestPortal) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)" }}
      >
        <Card
          className="w-full max-w-md bg-white/90 backdrop-blur-sm border shadow-2xl"
          style={{ borderColor: "var(--org-muted)" }}
        >
          <CardContent className="text-center py-12">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-primary-dark) 100%)" }}
            >
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
              className="text-white"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-primary-dark) 100%)" }}
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--org-background) 0%, var(--org-surface) 100%)" }}></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-72 h-72 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: "var(--org-primary)" }}
          ></div>
          <div
            className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: "var(--org-accent)" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 lg:py-28 flex flex-col items-center text-center gap-12">
            <div className="space-y-6 max-w-3xl">
              <span className="inline-flex items-center px-5 py-2 rounded-full bg-white shadow-md border border-[color-mix(in srgb,var(--org-primary) 20%,white)] text-sm font-semibold text-gray-700">
                <span className="inline-flex w-2 h-2 rounded-full bg-[var(--org-primary)] mr-2"></span>
                Asset Management System
              </span>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                  Explore Our
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--org-primary)] to-[var(--org-accent)]">
                    Assets Catalog
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-700 font-normal mx-auto max-w-2xl leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Discover available assets, track availability, and request access with a modern, user-friendly interface designed for both administrators and guests.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex justify-center items-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  <Package className="w-5 h-5 mr-2 text-[var(--org-primary)]" />
                  Total Assets
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.totalAssets}</div>
                <p className="text-sm text-gray-500">
                  All available assets across all organisations
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex justify-center items-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  <CheckCircle className="w-5 h-5 mr-2 text-[var(--org-primary)]" />
                  Available Assets
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.availableAssets}</div>
                <p className="text-sm text-gray-500">
                  Assets currently available for request
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex justify-center items-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  <Tag className="w-5 h-5 mr-2 text-[var(--org-primary)]" />
                  Categories
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.categories}</div>
                <p className="text-sm text-gray-500">Unique asset categories</p>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="bg-[var(--org-primary)] hover:bg-[var(--org-primary-dark)] text-white text-base px-8 py-4 shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
            >
              <Link href="/guest/assets" className="inline-flex items-center">
                Browse All Assets
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Masonry/Pinterest Style Content Section */}
      <section className="py-20 bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Enhanced Controls Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
            {/* Enhanced Tabs */}
            <div className="flex space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === "all"
                    ? "text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                style={
                  activeTab === "all"
                    ? { background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }
                    : undefined
                }
              >
                All Items ({filteredItems.length})
              </button>
              <button
                onClick={() => setActiveTab("assets")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === "assets"
                    ? "text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                style={
                  activeTab === "assets"
                    ? { background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }
                    : undefined
                }
              >
                Assets (
                {
                  filteredItems.filter(
                    (item) =>
                      item.itemType === "ASSET" ||
                      !item.itemType ||
                      item.itemType === undefined
                  ).length
                }
                )
              </button>
            </div>

            {/* Enhanced View Controls */}
            <div className="flex items-center space-x-6">
              {/* View Mode Toggle */}
              <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50">
                <button
                  onClick={() => setViewMode("masonry")}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === "masonry"
                      ? "text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  style={
                    viewMode === "masonry"
                      ? { background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }
                      : undefined
                  }
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === "grid"
                      ? "text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  style={
                    viewMode === "grid"
                      ? { background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }
                      : undefined
                  }
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Enhanced Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="popular">Most Popular</option>
              </select>

              {/* Enhanced Items Per Page */}
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
                <option value={48}>48 per page</option>
              </select>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="flex flex-wrap gap-4 mb-12">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-lg transition-all duration-300 hover:shadow-xl min-w-[180px]"
            >
              <option value="">All Categories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-lg transition-all duration-300 hover:shadow-xl min-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="IN_USE">In Use</option>
            </select>

            {(categoryFilter || statusFilter) && (
              <Button
                onClick={() => {
                  setCategoryFilter("");
                  setStatusFilter("");
                }}
                variant="outline"
                size="sm"
                className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Enhanced Masonry Grid */}
          {getPaginatedItems().length > 0 ? (
            <div
              className={`${
                viewMode === "masonry"
                  ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              }`}
            >
              {getPaginatedItems().map((item) => (
                <MasonryCard key={item.$id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">
                No items found
              </h3>
              <p className="text-gray-500 text-lg max-w-md mx-auto mb-6">
                {searchQuery || categoryFilter || statusFilter
                  ? "Try adjusting your search or filter criteria."
                  : "No items are currently available."}
              </p>
              {(searchQuery || categoryFilter || statusFilter) && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("");
                    setStatusFilter("");
                  }}
                  variant="outline"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-16 space-x-3">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className={`w-12 h-10 rounded-xl font-semibold transition-all duration-300 ${
                        currentPage === pageNum
                          ? "text-white shadow-lg transform scale-105"
                          : "bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                      }`}
                      style={
                        currentPage === pageNum
                          ? { background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }
                          : undefined
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-3 py-2 text-gray-500 font-medium">
                      ...
                    </span>
                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      variant={
                        currentPage === totalPages ? "default" : "outline"
                      }
                      size="sm"
                      className={`w-12 h-10 rounded-xl font-semibold transition-all duration-300 ${
                        currentPage === totalPages
                          ? "text-white shadow-lg transform scale-105"
                          : "bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                      }`}
                      style={
                        currentPage === totalPages
                          ? { background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }
                          : undefined
                      }
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)" }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border shadow-lg text-center" style={{ borderColor: "var(--org-muted)" }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-primary-dark) 100%)" }}
            >
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need to Request Assets?
            </h3>
            <p className="text-gray-600 text-base mb-8 max-w-2xl mx-auto">
              Sign in to your staff account to request assets, track your requests, and manage your asset loans.
            </p>
            <div className="flex justify-center">
              <Button
                className="text-base px-8 py-3 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-xl font-semibold"
                style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
              >
                <Link href="/login" className="flex items-center">
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In to Request Assets
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-8" style={{ background: "linear-gradient(135deg, var(--org-primary-dark) 0%, var(--org-accent) 100%)" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 255, 255, 0.2)" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-base">
                  {settings.branding?.orgName || "Asset Management"}
                </p>
                <p className="text-white/80 text-xs mt-1">
                  Asset Management System
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/90 text-sm font-medium">
                © {new Date().getFullYear()} {settings.branding?.orgName || "Asset Management"}
              </p>
              <p className="text-white/70 text-xs mt-1">
                All rights reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
