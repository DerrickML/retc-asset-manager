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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

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
      const queries = [];

      // Add search query
      if (search) {
        queries.push(Query.search("name", search));
      }

      // Add filters
      if (categoryFilter !== "all") {
        queries.push(Query.equal("category", categoryFilter));
      }
      if (statusFilter !== "all") {
        queries.push(Query.equal("availableStatus", statusFilter));
      }
      if (locationFilter !== "all") {
        queries.push(Query.equal("publicLocationLabel", locationFilter));
      }

      // Add pagination
      queries.push(Query.limit(pageSize));
      queries.push(Query.offset((currentPage - 1) * pageSize));
      queries.push(Query.orderDesc("$createdAt"));

      const result = await assetsService.getPublicAssets(queries);
      setAssets(result.documents);
      setTotalPages(Math.ceil(result.total / pageSize));
    } catch (error) {
      console.error("Failed to load assets:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent mb-3">
            Assets Catalog
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            Browse our available training assets and resources
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-300"
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
                </div>
                <Input
                  placeholder="Search assets, tools, or resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-l-xl rounded-r-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 shadow-lg hover:border-primary-400 hover:shadow-xl transition-all duration-300 group-hover:shadow-2xl focus:outline-none"
                />
                <Button
                  type="submit"
                  className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-sidebar-600 hover:to-primary-800 px-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold rounded-r-xl rounded-l-none border-l-0 border-2 border-primary-600 hover:border-primary-700"
                >
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 hover:border-primary-400 transition-all duration-300">
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 hover:border-primary-400 transition-all duration-300">
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
                  <SelectTrigger className="border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 hover:border-primary-400 transition-all duration-300">
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
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-2 border-primary-600 hover:border-primary-700 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl px-6 py-3"
                >
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-primary-600"
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
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent mb-3">
                No assets found
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Try adjusting your search criteria or filters.
              </p>
              <Button
                onClick={clearFilters}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-2 border-primary-600 hover:border-primary-700 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl px-6 py-3"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {assets.map((asset) => {
                const imageUrls = assetImageService.getAssetImageUrls(
                  asset.publicImages
                );
                const hasImages = imageUrls && imageUrls.length > 0;

                return (
                  <Card
                    key={asset.$id}
                    className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 hover:shadow-2xl transition-all duration-300 hover:scale-105 group overflow-hidden"
                  >
                    <CardContent className="p-0">
                      {/* Asset Image */}
                      {hasImages ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={imageUrls[0]}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="hidden w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 items-center justify-center">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-white font-bold text-lg">
                                  {asset.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-primary-700 font-semibold">
                                Asset Image
                              </p>
                            </div>
                          </div>
                          {/* Image count badge */}
                          {imageUrls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                              +{imageUrls.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-white font-bold text-xl">
                                {asset.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-primary-700 font-semibold">
                              No Image Available
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-gray-900 flex-1 line-clamp-2 group-hover:text-primary-700 transition-colors duration-200">
                            {asset.name}
                          </h3>
                        </div>

                        <p className="text-sm font-semibold text-sidebar-600 mb-3 bg-sidebar-50 px-3 py-1 rounded-full inline-block">
                          {formatCategory(asset.category)}
                        </p>

                        {asset.publicSummary && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                            {asset.publicSummary}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge
                            className={
                              asset.availableStatus === "AVAILABLE"
                                ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-primary-300"
                                : "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300"
                            }
                          >
                            {mapToPublicStatusLabel(asset.availableStatus)}
                          </Badge>
                          {asset.publicConditionLabel && (
                            <Badge className="bg-gradient-to-r from-sidebar-100 to-sidebar-200 text-sidebar-800 border-sidebar-300">
                              {asset.publicConditionLabel.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 font-medium">
                            {asset.publicLocationLabel && (
                              <span>📍 {asset.publicLocationLabel}</span>
                            )}
                          </div>
                          <Button
                            asChild
                            className="bg-gradient-to-r from-sidebar-600 to-sidebar-700 hover:from-sidebar-700 hover:to-sidebar-800 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <Link href={`/guest/assets/${asset.$id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-gradient-to-r from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white border-2 border-sidebar-600 hover:border-sidebar-700 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 px-6 py-3"
                >
                  Previous
                </Button>

                <span className="text-lg font-semibold text-gray-700 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-gray-200/60">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="bg-gradient-to-r from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white border-2 border-sidebar-600 hover:border-sidebar-700 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 px-6 py-3"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-br from-primary-50 via-primary-100/50 to-sidebar-50 border-2 border-primary-200/60 shadow-2xl">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-white"
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
            <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent mb-4">
              Need to Request Assets?
            </h3>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Sign in to your staff account to request assets for your projects.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-primary-600 via-primary-700 to-sidebar-600 hover:from-primary-700 hover:via-sidebar-600 hover:to-primary-800 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/login" className="flex items-center">
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
  );
}
