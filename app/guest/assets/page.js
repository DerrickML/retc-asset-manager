"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Package,
  CheckCircle,
  Tag,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  LogIn,
  Users,
} from "lucide-react";
import {
  settingsService,
  assetsService,
} from "../../../lib/appwrite/provider.js";
import { ENUMS } from "../../../lib/appwrite/config.js";
import {
  formatCategory,
  mapToPublicStatusLabel,
} from "../../../lib/utils/mappings.js";
import { assetImageService } from "../../../lib/appwrite/image-service.js";
import { Query } from "appwrite";

export default function GuestAssetsPage() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "all"
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [locationFilter, setLocationFilter] = useState(
    searchParams.get("location") || "all"
  );

  // Pagination - Server-side pagination for scalability
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12; // Items per page - can be increased for better performance

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      loadAssets();
    }
  }, [
    settings,
    search,
    categoryFilter,
    statusFilter,
    locationFilter,
    currentPage,
  ]);

  const loadSettings = async () => {
    try {
      const systemSettings = await settingsService.get();
      setSettings(systemSettings);

      // Check if guest portal is enabled
      if (!systemSettings.guestPortal) {
        window.location.href = "/guest";
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      // Build base queries for filtering
      const baseQueries = [];

      // Add search query (server-side search)
      if (search) {
        baseQueries.push(Query.search("name", search));
      }

      // Add category filter (server-side)
      if (categoryFilter !== "all") {
        baseQueries.push(Query.equal("category", categoryFilter));
      }

      // Add location filter (server-side)
      if (locationFilter !== "all") {
        baseQueries.push(Query.equal("publicLocationLabel", locationFilter));
      }

      // For status filtering, we need to handle it differently
      // since consumables store status in encoded fields
      let statusQueries = [];
      if (statusFilter !== "all") {
        if (statusFilter === "AVAILABLE") {
          // For assets: availableStatus = "AVAILABLE"
          // For consumables: we'll filter client-side
          statusQueries.push(Query.equal("availableStatus", "AVAILABLE"));
        } else if (statusFilter === "IN_USE") {
          // For assets: availableStatus = "IN_USE"
          // For consumables: we'll filter client-side
          statusQueries.push(Query.equal("availableStatus", "IN_USE"));
        }
      }

      // Get total count for accurate pagination (assets only)
      const countQueries = [...baseQueries, ...statusQueries];
      const countResult = await assetsService.list([
        ...countQueries,
        Query.limit(1000), // Get enough to filter client-side
      ]);
      
      // Filter out consumables from count
      const assetsOnly = countResult.documents.filter((item) => {
        return item.itemType !== "CONSUMABLE" && (item.itemType === "ASSET" || !item.itemType || item.itemType === undefined);
      });
      
      const totalCount = assetsOnly.length;
      setTotalPages(Math.ceil(totalCount / pageSize));

      // Build pagination queries
      const paginationQueries = [
        ...baseQueries,
        ...statusQueries,
        Query.limit(pageSize),
        Query.offset((currentPage - 1) * pageSize),
        Query.orderDesc("$createdAt"),
      ];

      // Execute the main query
      const result = await assetsService.list(paginationQueries);

      // Filter out consumables - guest portal should only show assets
      let filteredItems = result.documents.filter((item) => {
        // Only show assets (itemType is "ASSET" or undefined/null for legacy assets)
        return item.itemType !== "CONSUMABLE" && (item.itemType === "ASSET" || !item.itemType || item.itemType === undefined);
      });

      // Client-side status filtering for assets only
      if (statusFilter !== "all") {
        filteredItems = filteredItems.filter((item) => {
          // Only filter by availableStatus for assets
          if (statusFilter === "AVAILABLE") {
            return item.availableStatus === "AVAILABLE";
          } else if (statusFilter === "IN_USE") {
            return item.availableStatus === "IN_USE";
          }
          return true;
        });
      }

      setAssets(filteredItems);
    } catch (error) {
      console.error("Failed to load assets:", error);
      setAssets([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAssets();
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setLocationFilter("all");
    setCurrentPage(1);
  };

  const getUniqueLocations = () => {
    // This would ideally come from an API endpoint
    return ["Main Lab", "Workshop", "Storage", "Field Station"];
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, var(--org-background) 0%, rgba(255,255,255,0.9) 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Enhanced Page Header */}
        <div className="relative mb-16">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl animate-pulse"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)", opacity: 0.2 }}
            ></div>
            <div
              className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-cyan-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="relative text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Assets Catalog
            </h1>
            <p className="text-lg md:text-xl text-gray-700 font-normal max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              Browse our comprehensive collection of training assets and
              resources
            </p>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-16 relative z-10">
          <div className="relative group">
            <div
              className="absolute inset-0 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)", opacity: 0.15 }}
            ></div>
            <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 hover:border-gray-300/60 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl z-20">
              <CardContent className="p-8">
                <form onSubmit={handleSearch} className="space-y-8">
                  {/* Enhanced Search Bar */}
                  <div className="relative group">
                    <div
                      className="absolute inset-0 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500"
                      style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)", opacity: 0.1 }}
                    ></div>
                    <div className="relative flex gap-0 p-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                      <div className="flex-1 relative">
                        <svg
                          className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-hover:text-primary-500 transition-colors duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <Input
                          placeholder="Search assets, tools, or resources..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-16 pr-6 py-6 text-lg border-0 bg-transparent focus:ring-0 placeholder:text-gray-400 text-gray-700 rounded-l-2xl rounded-r-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="px-10 py-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-semibold text-lg"
                        style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        Search
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Filter Dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[var(--org-primary)]/30 focus:border-[var(--org-primary)] shadow-lg transition-all duration-300 hover:shadow-xl min-w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.values(ENUMS.CATEGORY).map((category) => (
                          <SelectItem key={category} value={category}>
                            {formatCategory(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[var(--org-primary)]/30 focus:border-[var(--org-primary)] shadow-lg transition-all duration-300 hover:shadow-xl min-w-[160px]">
                        <SelectValue placeholder="Availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="IN_USE">On Loan</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={locationFilter}
                      onValueChange={setLocationFilter}
                    >
                      <SelectTrigger className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[var(--org-primary)]/30 focus:border-[var(--org-primary)] shadow-lg transition-all duration-300 hover:shadow-xl min-w-[160px]">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {getUniqueLocations().map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      onClick={clearFilters}
                      className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-lg transition-all duration-300 hover:shadow-xl"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="relative group">
                <div
                  className="absolute inset-0 rounded-3xl blur-xl animate-pulse"
                  style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)", opacity: 0.15 }}
                ></div>
                <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 rounded-3xl shadow-xl animate-pulse">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gray-200 rounded-2xl mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded-xl"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl blur-2xl"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)", opacity: 0.08 }}
            ></div>
            <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 shadow-2xl rounded-3xl">
              <CardContent className="text-center py-20">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"
                  style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                >
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  No assets found
                </h3>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Try adjusting your search criteria or filters to find what
                  you're looking for.
                </p>
                <Button
                  onClick={clearFilters}
                  className="px-8 py-4 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-semibold text-lg"
                  style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {assets.map((item) => {
                // Handle images for assets only (consumables are filtered out)
                let imageUrls = [];
                let hasImages = false;

                // For assets, use publicImages
                imageUrls = assetImageService.getAssetImageUrls(
                  item.publicImages
                );
                hasImages = imageUrls && imageUrls.length > 0;

                return (
                  <div key={item.$id} className="relative group">
                    <div
                      className="absolute inset-0 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"
                      style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)", opacity: 0.12 }}
                    ></div>

                    <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 hover:border-gray-300/60 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden group-hover:scale-105">
                      <CardContent className="p-0">
                        {/* Enhanced Item Image */}
                        {hasImages ? (
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={imageUrls[0]}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center"
                              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)", opacity: 0.15 }}
                            >
                              <div className="text-center">
                                <div
                                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                                  style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                                >
                                  <span className="text-white font-bold text-xl">
                                    {item.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <p className="font-semibold" style={{ color: "var(--org-primary)" }}>
                                  Asset Image
                                </p>
                              </div>
                            </div>
                            
                            {/* Asset Badge - Top Left */}
                            <div className="absolute top-4 left-4 z-10">
                              <Badge 
                                variant="outline"
                                className="font-semibold px-4 py-2 rounded-full border-0 shadow-lg backdrop-blur-sm"
                                style={{ 
                                  background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
                                }}>
                                <span style={{ color: "white" }}>Asset</span>
                              </Badge>
                            </div>

                            {/* Status Badge - Top Right */}
                            <div className="absolute top-4 right-4 z-10">
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
                                <span style={{ color: "white" }}>{mapToPublicStatusLabel(item.availableStatus)}</span>
                              </Badge>
                            </div>

                            {/* Enhanced Image count badge */}
                            {imageUrls.length > 1 && (
                              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium z-20">
                                +{imageUrls.length - 1}
                              </div>
                            )}
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ) : (
                          <div
                            className="aspect-video relative flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.7)" }}
                          >
                            <div className="text-center">
                              <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                                style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                              >
                                <span className="text-white font-bold text-2xl">
                                  {item.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <p className="font-semibold text-lg" style={{ color: "var(--org-primary)" }}>
                                No Image Available
                              </p>
                            </div>

                            {/* Asset Badge - Top Left */}
                            <div className="absolute top-4 left-4 z-10">
                              <Badge 
                                variant="outline"
                                className="font-semibold px-4 py-2 rounded-full border-0 shadow-lg backdrop-blur-sm"
                                style={{ 
                                  background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
                                }}>
                                <span style={{ color: "white" }}>Asset</span>
                              </Badge>
                            </div>

                            {/* Status Badge - Top Right */}
                            <div className="absolute top-4 right-4 z-10">
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
                                <span style={{ color: "white" }}>{mapToPublicStatusLabel(item.availableStatus)}</span>
                              </Badge>
                            </div>
                          </div>
                        )}

                        <div className="p-6">
                          {/* Enhanced Title */}
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-300 line-clamp-2 leading-tight">
                              {item.name}
                            </h3>
                          </div>

                          {/* Enhanced Category Badge */}
                          <div className="mb-4">
                            <Badge
                              variant="outline"
                              className="px-4 py-2 rounded-full font-semibold text-sm shadow-md"
                              style={{
                                background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
                              }}
                            >
                              <span style={{ color: "white" }}>{formatCategory(item.category)}</span>
                            </Badge>
                          </div>

                          {/* Enhanced Description */}
                          {item.publicSummary && (
                            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed text-sm">
                              {item.publicSummary}
                            </p>
                          )}

                          {/* Enhanced Status Badges */}
                          <div className="flex flex-wrap gap-2 mb-6">
                            {/* Asset status - only assets are shown in guest portal */}
                            <Badge
                              variant="outline"
                              className={`px-3 py-1.5 rounded-full font-semibold text-sm shadow-md ${
                                item.availableStatus === "AVAILABLE"
                                  ? "bg-gradient-to-r from-emerald-500 to-green-600"
                                  : "bg-gradient-to-r from-amber-500 to-orange-600"
                              }`}
                            >
                              <span style={{ color: "white" }}>{mapToPublicStatusLabel(item.availableStatus)}</span>
                            </Badge>

                            {item.publicConditionLabel && (
                              <Badge 
                                variant="outline"
                                className="px-3 py-1.5 rounded-full font-semibold text-sm shadow-md bg-gradient-to-r from-slate-600 to-slate-700"
                              >
                                <span style={{ color: "white" }}>{item.publicConditionLabel.replace(/_/g, " ")}</span>
                              </Badge>
                            )}
                          </div>

                          {/* Enhanced Footer */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500 font-medium">
                              {item.publicLocationLabel && (
                                <span className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  {item.publicLocationLabel}
                                </span>
                              )}
                            </div>
                            <Button
                              asChild
                              className="px-6 py-3 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-sm"
                              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                            >
                              <Link
                                href={`/guest/assets/${item.$id}`}
                                className="flex items-center"
                              >
                                View Details
                                <svg
                                  className="w-4 h-4 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-8 py-4 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
                  style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </Button>

                <div className="flex items-center space-x-2">
                  <span
                    className="text-xl font-bold text-gray-700 px-6 py-3 rounded-2xl border"
                    style={{ borderColor: "var(--org-muted)", background: "rgba(255,255,255,0.7)" }}
                  >
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <Button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-8 py-4 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
                  style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
                >
                  Next
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <section
        className="py-12"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 border shadow-lg text-center"
            style={{ borderColor: "var(--org-muted)" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
            >
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3" style={{ color: "var(--org-primary-dark)" }}>
              Need to Request Assets?
            </h3>
            <p className="text-gray-600 text-base mb-6">
              Sign in to your staff account to request assets for your projects and training sessions.
            </p>
            <Button
              className="px-6 py-3 text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, var(--org-primary) 0%, var(--org-accent) 100%)" }}
              asChild
            >
              <Link href="/login" className="flex items-center justify-center">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In to Request Assets
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
