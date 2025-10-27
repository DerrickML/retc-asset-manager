"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  assetsService,
  departmentsService,
} from "../../lib/appwrite/provider.js";
import { ENUMS } from "../../lib/appwrite/config.js";
import { Query } from "appwrite";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import { useToastContext } from "../../components/providers/toast-provider";
import {
  formatCategory,
  getCurrentStock,
  getMinStock,
  getConsumableStatus,
  getConsumableUnit,
  getConsumableCategory,
  getConsumableStatusBadgeColor,
} from "../../lib/utils/mappings.js";
import {
  Package,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ConsumablesPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [consumables, setConsumables] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentStaff, setCurrentStaff] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staff, deptResult, consumablesResult] = await Promise.all([
        getCurrentStaff(),
        departmentsService.list(),
        assetsService.list([Query.orderDesc("$createdAt")]),
      ]);

      setCurrentStaff(staff);
      setDepartments(deptResult.documents);

      // Filter showing consumables that are available (have stock > 0)
      const consumablesOnly = consumablesResult.documents.filter((item) => {
        if (item.itemType !== ENUMS.ITEM_TYPE.CONSUMABLE) return false;

        // Check if consumable has stock available
        const currentStock = getCurrentStock(item);
        return currentStock > 0;
      });

      setConsumables(consumablesOnly);
    } catch (error) {
      setError("Failed to load consumables");
      toast.error("Failed to load consumables. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Search is handled in the filteredConsumables calculation
    // This function is called when search input changes
  };

  const handleFilter = () => {
    // Filtering is handled in the filteredConsumables calculation
    // This function is called when filter dropdowns change
  };

  // Calculate filtered consumables
  const filteredConsumables = consumables.filter((consumable) => {
    // Search filter
    if (
      searchQuery &&
      !consumable.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Category filter
    if (
      categoryFilter &&
      getConsumableCategory(consumable) !== categoryFilter
    ) {
      return false;
    }

    // Status filter
    if (statusFilter && getConsumableStatus(consumable) !== statusFilter) {
      return false;
    }

    // Department filter
    if (departmentFilter && consumable.departmentId !== departmentFilter) {
      return false;
    }

    return true;
  });

  const getStatusIcon = (consumable) => {
    const status = getConsumableStatus(consumable);
    switch (status) {
      case "IN_STOCK":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "LOW_STOCK":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "OUT_OF_STOCK":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "DISCONTINUED":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (consumable) => {
    const status = getConsumableStatus(consumable);
    const statusText = status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <Badge className={getConsumableStatusBadgeColor(status)}>
        {statusText}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading consumables...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading consumables</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <Button onClick={() => loadData()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consumables</h1>
          <p className="text-gray-600">Browse and request consumable items</p>
        </div>
        <Button
          onClick={() => router.push("/requests/new")}
          className="bg-green-600 hover:bg-green-700"
        >
          <Package className="w-4 h-4 mr-2" />
          Request Items
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search consumables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {Object.entries(ENUMS.CATEGORY).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {Object.entries(ENUMS.CONSUMABLE_STATUS).map(
                    ([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.$id} value={dept.$id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleFilter} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consumables List */}
      {filteredConsumables.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No consumables found
          </h3>
          <p className="text-gray-500">
            {searchQuery || categoryFilter || statusFilter || departmentFilter
              ? "Try adjusting your search or filter criteria."
              : "No consumables are currently available."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredConsumables.map((consumable) => {
            return (
              <Card
                key={consumable.$id}
                className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="p-0">
                  {/* Consumable Icon Placeholder - Consumables don't have images */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-xl">
                          {consumable.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium text-sm">
                        Consumable
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 truncate flex-1 text-lg">
                        {consumable.name}
                      </h3>
                      <div className="flex items-center space-x-2 ml-2">
                        {getStatusIcon(consumable)}
                        {getStatusBadge(consumable)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 font-medium">
                      {formatCategory(getConsumableCategory(consumable))}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">
                        Current Stock:
                      </span>
                      <span className="font-semibold text-lg">
                        {getCurrentStock(consumable)}{" "}
                        {getConsumableUnit(consumable)?.toLowerCase()}
                      </span>
                    </div>

                    {getMinStock(consumable) > 0 && (
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-gray-600">Min Stock:</span>
                        <span className="text-gray-900">
                          {getMinStock(consumable)}{" "}
                          {getConsumableUnit(consumable)?.toLowerCase()}
                        </span>
                      </div>
                    )}

                    {consumable.supplier && (
                      <div className="text-sm text-gray-500 mb-4">
                        <span className="font-medium">Supplier:</span>{" "}
                        {consumable.supplier}
                      </div>
                    )}

                    <div className="text-sm text-gray-500 mb-4 space-y-1">
                      <p>
                        Location: {consumable.locationName || "Not specified"}
                      </p>
                    </div>

                    <Button
                      onClick={() =>
                        router.push(`/consumables/${consumable.$id}`)
                      }
                      className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
