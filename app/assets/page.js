"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Package,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import {
  assetsService,
  departmentsService,
} from "../../lib/appwrite/provider.js";
import { ENUMS } from "../../lib/appwrite/config.js";
import {
  getStatusBadgeColor,
  getConditionBadgeColor,
  formatCategory,
} from "../../lib/utils/mappings.js";
import { getCurrentStaff, permissions } from "../../lib/utils/auth.js";
import { assetImageService } from "../../lib/appwrite/image-service.js";
import { Query } from "appwrite";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [search, categoryFilter, statusFilter, departmentFilter, currentPage]);

  const loadInitialData = async () => {
    try {
      const [currentStaff, deptResult] = await Promise.all([
        getCurrentStaff(),
        departmentsService.list(),
      ]);
      setStaff(currentStaff);
      setDepartments(deptResult.documents);
    } catch (error) {
      console.error("Failed to load initial data:", error);
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
      if (categoryFilter) {
        queries.push(Query.equal("category", categoryFilter));
      }
      if (statusFilter) {
        queries.push(Query.equal("availableStatus", statusFilter));
      }
      if (departmentFilter) {
        queries.push(Query.equal("departmentId", departmentFilter));
      }

      // Add pagination
      queries.push(Query.limit(pageSize));
      queries.push(Query.offset((currentPage - 1) * pageSize));
      queries.push(Query.orderDesc("$createdAt"));

      const result = await assetsService.list(queries);
      setAssets(result.documents);
      setTotalPages(Math.ceil(result.total / pageSize));
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setDepartmentFilter("");
    setCurrentPage(1);
  };

  const canManageAssets = staff && permissions.canManageAssets(staff);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
                <Package className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
                <p className="text-gray-600 text-lg mt-1">
                  Manage and track your organization's assets
                </p>
              </div>
            </div>
            {canManageAssets && (
              <Button
                asChild
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/assets/new" className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Asset
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Search & Filter
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-gray-300 focus:border-primary-500 focus:ring-primary-500">
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
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="lg:w-48">
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="border-gray-300 focus:border-primary-500 focus:ring-primary-500">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.$id} value={dept.$id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card
                key={i}
                className="animate-pulse bg-white border border-gray-200"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4">
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
          <Card className="bg-white border border-gray-200">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No assets found
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {search || categoryFilter || statusFilter || departmentFilter
                  ? "No assets match your current filters. Try adjusting your search criteria."
                  : "Get started by adding your first asset."}
              </p>
              {canManageAssets && (
                <Button
                  asChild
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/assets/new" className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add First Asset
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map((asset) => {
              const imageUrls = assetImageService.getAssetImageUrls(
                asset.publicImages
              );
              const hasImages = imageUrls && imageUrls.length > 0;

              return (
                <Card
                  key={asset.$id}
                  className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  <CardContent className="p-0">
                    {/* Asset Image */}
                    {hasImages ? (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={imageUrls[0]}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                            <p className="text-primary-700 font-semibold text-sm">
                              Asset Image
                            </p>
                          </div>
                        </div>
                        {/* Image count badge */}
                        {imageUrls.length > 1 && (
                          <div className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            +{imageUrls.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-white font-bold text-xl">
                              {asset.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 font-medium text-sm">
                            No Image
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 truncate flex-1 text-lg">
                          {asset.name}
                        </h3>
                        {asset.isPublic && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300"
                          >
                            Public
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-4 font-medium">
                        {formatCategory(asset.category)}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge
                          className={`${getStatusBadgeColor(
                            asset.availableStatus
                          )} text-xs font-medium`}
                        >
                          {asset.availableStatus.replace(/_/g, " ")}
                        </Badge>
                        <Badge
                          className={`${getConditionBadgeColor(
                            asset.currentCondition
                          )} text-xs font-medium`}
                        >
                          {asset.currentCondition.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-500 mb-4 space-y-1">
                        <p className="font-medium">Tag: {asset.assetTag}</p>
                        <p>Location: {asset.locationName || "Not specified"}</p>
                      </div>

                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <Link
                          href={`/assets/${asset.$id}`}
                          className="flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 mt-12">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
