"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { settingsService, assetsService } from "../../lib/appwrite/provider.js";
import { assetImageService } from "../../lib/appwrite/image-service.js";
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
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  MapPin,
  Star,
} from "lucide-react";

// Masonry Card Component (for assets only - consumables are internal)
const MasonryCard = ({ item }) => {
  return (
    <div className="break-inside-avoid mb-8 group">
      <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 hover:border-gray-300/60 hover:shadow-2xl hover:shadow-primary-200/20 transition-all duration-500 hover:scale-105 group overflow-hidden h-full flex flex-col rounded-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-primary-200/30 to-blue-200/30 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <div
          className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-cyan-200/20 to-purple-200/20 rounded-full group-hover:scale-125 transition-transform duration-700"
          style={{ animationDelay: "0.2s" }}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Type Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg font-semibold px-4 py-2 rounded-full border-0 backdrop-blur-sm">
                Asset
              </Badge>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <Badge
                className={`${
                  item.availableStatus === "AVAILABLE"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                } font-semibold px-4 py-2 rounded-full border-0 backdrop-blur-sm`}
              >
                {item.availableStatus === "AVAILABLE" ? "Available" : "On Loan"}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col h-full">
            <h3 className="font-bold text-gray-900 text-xl mb-4 group-hover:text-primary-700 transition-colors duration-300 line-clamp-2 leading-tight">
              {item.name}
            </h3>

            <p className="text-sm font-semibold text-primary-600 mb-5 bg-gradient-to-r from-primary-50 to-blue-50 px-4 py-2 rounded-full inline-block self-start border border-primary-200/50">
              {formatCategory(item.category)}
            </p>

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
                className="group/btn relative bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px] rounded-xl font-semibold overflow-hidden"
                asChild
              >
                <Link
                  href={`/guest/assets/${item.$id}`}
                  className="flex items-center justify-center relative z-10"
                >
                  <Eye className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
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
    const colorClasses = {
      blue: {
        bg: "from-blue-50/80 to-indigo-50/80",
        border: "border-blue-200/50",
        icon: "from-blue-500 to-indigo-600",
        text: "text-blue-700",
        value: "text-blue-800",
        title: "text-blue-600",
        subtitle: "text-blue-500",
        glow: "shadow-blue-200/50",
      },
      green: {
        bg: "from-green-50/80 to-emerald-50/80",
        border: "border-green-200/50",
        icon: "from-green-500 to-emerald-600",
        text: "text-green-700",
        value: "text-green-800",
        title: "text-green-600",
        subtitle: "text-green-500",
        glow: "shadow-green-200/50",
      },
      cyan: {
        bg: "from-cyan-50/80 to-teal-50/80",
        border: "border-cyan-200/50",
        icon: "from-cyan-500 to-teal-600",
        text: "text-cyan-700",
        value: "text-cyan-800",
        title: "text-cyan-600",
        subtitle: "text-cyan-500",
        glow: "shadow-cyan-200/50",
      },
      purple: {
        bg: "from-purple-50/80 to-violet-50/80",
        border: "border-purple-200/50",
        icon: "from-purple-500 to-violet-600",
        text: "text-purple-700",
        value: "text-purple-800",
        title: "text-purple-600",
        subtitle: "text-purple-500",
        glow: "shadow-purple-200/50",
      },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <Card
        className={`group relative overflow-hidden bg-white/60 backdrop-blur-sm border ${colors.border} hover:shadow-2xl hover:shadow-${colors.glow} transition-all duration-500 hover:scale-105 hover:-translate-y-2`}
      >
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50 group-hover:opacity-70 transition-opacity duration-500`}
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
            className={`w-20 h-20 bg-gradient-to-br ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
          >
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Value with Animation */}
          <div
            className={`text-5xl font-bold ${colors.value} mb-3 group-hover:scale-110 transition-transform duration-300`}
          >
            {value}
          </div>

          {/* Title */}
          <div
            className={`${colors.title} font-semibold text-lg mb-2 group-hover:text-opacity-80 transition-colors duration-300`}
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className={`${colors.subtitle} text-sm font-medium`}>
              {subtitle}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    // Load data immediately - loadData function handles its own error states
    loadData();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    if (allItems.length > 0) {
      applyFilters();
    }
  }, [searchQuery, activeTab, categoryFilter, statusFilter, sortBy, allItems]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, categoryFilter, statusFilter, sortBy]);

  const loadData = async () => {
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
  };

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
      <section className="relative py-24 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-200/10 to-blue-200/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200/50 shadow-lg mb-8 hover:shadow-xl transition-all duration-300">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700">
              Asset Management System
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-blue-600 bg-clip-text text-transparent mb-8 leading-tight">
            Explore Our
            <br />
            <span className="bg-gradient-to-r from-primary-500 to-blue-500 bg-clip-text text-transparent">
              Assets Catalog
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Discover our comprehensive collection of renewable energy training
            assets and resources.
            <span className="text-primary-600 font-semibold">
              {" "}
              Sign in to request assets
            </span>{" "}
            for your projects.
          </p>

          {/* Enhanced Search Bar */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <form
                onSubmit={handleSearch}
                className="relative flex gap-0 p-2 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-hover:text-primary-500 transition-colors duration-300" />
                  <Input
                    type="text"
                    placeholder="Search assets, tools, or resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-16 pr-6 py-6 text-lg border-0 bg-transparent focus:ring-0 placeholder:text-gray-400 text-gray-700 rounded-l-3xl rounded-r-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="px-10 py-6 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl font-semibold text-lg"
                >
                  <Search className="w-5 h-5 mr-3" />
                  Search
                </Button>
              </form>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <StatsCard
              icon={Package}
              title="Total Assets"
              value={stats.totalAssets}
              color="sidebar"
            />
            <StatsCard
              icon={CheckCircle}
              title="Available Assets"
              value={stats.availableAssets}
              color="primary"
            />
            <StatsCard
              icon={Tag}
              title="Categories"
              value={stats.categories}
              color="purple"
            />
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
                    ? "bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                All Items ({filteredItems.length})
              </button>
              <button
                onClick={() => setActiveTab("assets")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === "assets"
                    ? "bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
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
                      ? "bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
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
                          ? "bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg transform scale-105"
                          : "bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                      }`}
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
                          ? "bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg transform scale-105"
                          : "bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg hover:shadow-xl"
                      }`}
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
      <section className="py-12 bg-gradient-to-br from-primary-50 via-primary-100/50 to-sidebar-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border-2 border-primary-200/60 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent mb-3">
              Need to Request Assets?
            </h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Sign in to your staff account to request assets, track your
              requests, and manage your asset loans.
            </p>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-sidebar-600 hover:to-primary-800 text-sm px-6 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/login" className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
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
