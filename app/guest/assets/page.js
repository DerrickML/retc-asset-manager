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
  settingsService,
  assetsService,
} from "../../../lib/appwrite/provider.js";
import { ENUMS } from "../../../lib/appwrite/config.js";
import {
  formatCategory,
  mapToPublicStatusLabel,
  getConsumableStatus,
  getCurrentStock,
  getConsumableUnit,
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

      // Get total count for accurate pagination
      const countQueries = [...baseQueries];
      if (statusFilter === "all") {
        // If no status filter, we can get accurate count
        const countResult = await assetsService.list([
          ...countQueries,
          Query.limit(1),
        ]);
        const totalCount = countResult.total || 0;
        setTotalPages(Math.ceil(totalCount / pageSize));
      } else {
        // If status filter is applied, we need to estimate
        // This is a limitation of the current data structure
        setTotalPages(Math.ceil(100 / pageSize)); // Estimate
      }

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

      // Client-side status filtering for consumables
      let filteredItems = result.documents;

      if (statusFilter !== "all") {
        filteredItems = filteredItems.filter((item) => {
          if (item.itemType === "CONSUMABLE") {
            const consumableStatus = getConsumableStatus(item);
            if (statusFilter === "AVAILABLE") {
              return consumableStatus === "IN_STOCK";
            } else if (statusFilter === "IN_USE") {
              return consumableStatus === "OUT_OF_STOCK";
            }
          }
          // For assets, they're already filtered by the server query
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Enhanced Page Header */}
        <div className="relative mb-16">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-cyan-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="relative text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
              Assets Catalog
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
              Browse our comprehensive collection of training assets and
              resources
            </p>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-16 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 hover:border-gray-300/60 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl z-20">
              <CardContent className="p-8">
                <form onSubmit={handleSearch} className="space-y-8">
                  {/* Enhanced Search Bar */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-blue-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500"></div>
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
                        className="px-10 py-6 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-semibold text-lg"
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
                      <SelectTrigger className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-lg transition-all duration-300 hover:shadow-xl min-w-[180px]">
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
                      <SelectTrigger className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-lg transition-all duration-300 hover:shadow-xl min-w-[160px]">
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
                      <SelectTrigger className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-lg transition-all duration-300 hover:shadow-xl min-w-[160px]">
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-blue-100/20 rounded-3xl blur-xl animate-pulse"></div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-blue-100/20 rounded-3xl blur-2xl"></div>
            <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 shadow-2xl rounded-3xl">
              <CardContent className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
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
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  No assets found
                </h3>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Try adjusting your search criteria or filters to find what
                  you're looking for.
                </p>
                <Button
                  onClick={clearFilters}
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-semibold text-lg"
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
                // Handle images for both assets and consumables
                let imageUrls = [];
                let hasImages = false;

                if (item.itemType === "CONSUMABLE") {
                  // For consumables, use assetImage directly
                  if (item.assetImage) {
                    imageUrls = [item.assetImage];
                    hasImages = true;
                  }
                } else {
                  // For assets, use publicImages
                  imageUrls = assetImageService.getAssetImageUrls(
                    item.publicImages
                  );
                  hasImages = imageUrls && imageUrls.length > 0;
                }

                return (
                  <div key={item.$id} className="relative group">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-blue-100/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>

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
                            <div className="hidden w-full h-full bg-gradient-to-br from-primary-100 to-blue-100 items-center justify-center">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                  <span className="text-white font-bold text-xl">
                                    {item.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-primary-700 font-semibold">
                                  {item.itemType === "CONSUMABLE"
                                    ? "Consumable"
                                    : "Asset"}{" "}
                                  Image
                                </p>
                              </div>
                            </div>
                            {/* Enhanced Image count badge */}
                            {imageUrls.length > 1 && (
                              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                                +{imageUrls.length - 1}
                              </div>
                            )}
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <span className="text-white font-bold text-2xl">
                                  {item.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-primary-700 font-semibold text-lg">
                                No Image Available
                              </p>
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
                            <Badge className="px-4 py-2 bg-gradient-to-r from-primary-100 to-blue-100 text-primary-800 border border-primary-200 rounded-full font-medium text-sm">
                              {formatCategory(item.category)}
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
                            {item.itemType === "CONSUMABLE" ? (
                              // Consumable status
                              <Badge
                                className={`px-3 py-1 rounded-full font-medium text-sm ${
                                  getConsumableStatus(item) === "IN_STOCK"
                                    ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                                    : "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200"
                                }`}
                              >
                                {getConsumableStatus(item) === "IN_STOCK"
                                  ? "In Stock"
                                  : "Out of Stock"}
                              </Badge>
                            ) : (
                              // Asset status
                              <Badge
                                className={`px-3 py-1 rounded-full font-medium text-sm ${
                                  item.availableStatus === "AVAILABLE"
                                    ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                                    : "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200"
                                }`}
                              >
                                {mapToPublicStatusLabel(item.availableStatus)}
                              </Badge>
                            )}

                            {/* Stock info for consumables */}
                            {item.itemType === "CONSUMABLE" && (
                              <Badge className="px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200 rounded-full font-medium text-sm">
                                {getCurrentStock(item)}{" "}
                                {getConsumableUnit(item)}
                              </Badge>
                            )}

                            {item.publicConditionLabel && (
                              <Badge className="px-3 py-1 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 rounded-full font-medium text-sm">
                                {item.publicConditionLabel.replace(/_/g, " ")}
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
                              className="px-6 py-3 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-sm"
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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-blue-100/20 rounded-3xl blur-xl"></div>
                <div className="relative flex items-center justify-center space-x-6 bg-white/80 backdrop-blur-sm border border-gray-200/40 rounded-3xl shadow-xl p-6">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-8 py-4 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
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
                    <span className="text-xl font-bold text-gray-700 bg-gradient-to-r from-primary-100 to-blue-100 px-6 py-3 rounded-2xl border border-primary-200">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  <Button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-8 py-4 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
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
              </div>
            )}
          </>
        )}

        {/* Enhanced Call to Action */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-blue-100/30 rounded-3xl blur-2xl"></div>
          <Card className="relative bg-white/80 backdrop-blur-sm border border-gray-200/40 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="text-center py-16 px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-blue-600 bg-clip-text text-transparent mb-6">
                Need to Request Assets?
              </h3>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                Sign in to your staff account to request assets for your
                projects and training sessions.
              </p>
              <Button
                asChild
                className="px-10 py-5 bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 hover:from-primary-700 hover:via-blue-600 hover:to-primary-800 text-white text-xl font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
              >
                <Link href="/login" className="flex items-center">
                  <svg
                    className="w-6 h-6 mr-3"
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
                  Sign In to Request Assets
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
