"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
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
  projectsService,
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
  List,
  Grid3X3,
} from "lucide-react";
import { useOrgTheme } from "../../components/providers/org-theme-provider";
import { PageLoading } from "../../components/ui/loading";

export default function ConsumablesPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [consumables, setConsumables] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentStaff, setCurrentStaff] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const { orgCode } = useOrgTheme();
  const normalizedOrgCode = (orgCode || "").toUpperCase();
  const isNrepOrg = normalizedOrgCode === "NREP";
  const ADMIN_PLACEHOLDER_PROJECT_ID = "ADMIN";

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMode = window.localStorage.getItem("consumablesViewMode");
    if (storedMode === "cards" || storedMode === "table") {
      setViewMode(storedMode);
    }
  }, []);

  useEffect(() => {
    if (!orgCode) return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgCode]);

  const handleViewModeChange = (mode) => {
    if (mode === "table" || mode === "cards") {
      setViewMode(mode);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("consumablesViewMode", mode);
      }
    }
  };

  const loadData = async () => {
    try {
      const projectPromise = isNrepOrg
        ? projectsService.list([Query.orderAsc("name")])
        : Promise.resolve({ documents: [] });

      const [staff, deptResult, projectResult, consumablesResult] =
        await Promise.all([
          getCurrentStaff(),
          departmentsService.list(),
          projectPromise,
          assetsService.list([Query.orderDesc("$createdAt")]),
        ]);

      setCurrentStaff(staff);
      setDepartments(deptResult.documents);
      setProjects(projectResult.documents || []);

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
  const filteredConsumables = (consumables || []).filter((consumable) => {
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
    if (departmentFilter) {
      if (isNrepOrg) {
        const projectId = consumable.projectId || ADMIN_PLACEHOLDER_PROJECT_ID;
        if (departmentFilter === ADMIN_PLACEHOLDER_PROJECT_ID) {
          if (projectId && projectId !== ADMIN_PLACEHOLDER_PROJECT_ID) {
            return false;
          }
        } else if (projectId !== departmentFilter) {
          return false;
        }
      } else if (consumable.departmentId !== departmentFilter) {
        return false;
      }
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

  const getDepartmentName = useMemo(() => {
    const lookup = new Map();
    (departments || []).forEach((dept) => {
      if (!dept?.$id) return;
      lookup.set(dept.$id, dept.name || dept.title || dept.code || "");
    });
    return (departmentId) => {
      if (!departmentId) return "Not specified";
      return lookup.get(departmentId) || "Not specified";
    };
  }, [departments]);

  const getProjectName = useMemo(() => {
    const lookup = new Map();
    lookup.set(ADMIN_PLACEHOLDER_PROJECT_ID, "Administrative");
    (projects || []).forEach((project) => {
      if (!project?.$id) return;
      lookup.set(project.$id, project.name || project.title || project.code || "");
    });
    return (projectId) => {
      if (!projectId) return "Administrative";
      return lookup.get(projectId) || "Administrative";
    };
  }, [projects]);

  if (loading) {
    return <PageLoading message="Loading consumables..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--org-background)" }}>
        <div className="text-center bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-xl px-8 py-10 rounded-2xl">
          <div className="text-red-600 mb-4 font-semibold">Error loading consumables</div>
          <div className="text-gray-600 mb-6 max-w-sm">{error}</div>
          <Button onClick={() => loadData()} className="bg-org-gradient text-white shadow-md hover:shadow-lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Consumables</h1>
          <p className="text-gray-600">Browse and request consumable items</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/requests/new?type=consumable")}
            className="bg-org-gradient text-white shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <Package className="w-4 h-4 mr-2" />
            Request Consumables
          </Button>
        </div>
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
                {isNrepOrg ? "Project" : "Department"}
              </label>
              {isNrepOrg ? (
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All projects</SelectItem>
                    <SelectItem value={ADMIN_PLACEHOLDER_PROJECT_ID}>
                      Administrative
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.$id} value={project.$id}>
                        {project.name || project.title || project.code || project.$id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
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
              )}
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

      {/* View Mode Toggle */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-1.5 py-1 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewModeChange("table")}
            className={`h-8 px-3 rounded-full flex items-center gap-2 transition-all font-medium ${
              viewMode === "table"
                ? "bg-[var(--org-primary)] text-white shadow-sm hover:bg-[var(--org-primary)]/90"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewModeChange("cards")}
            className={`h-8 px-3 rounded-full flex items-center gap-2 transition-all font-medium ${
              viewMode === "cards"
                ? "bg-[var(--org-primary)] text-white shadow-sm hover:bg-[var(--org-primary)]/90"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </Button>
        </div>
      </div>

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
      ) : viewMode === "table" ? (
        <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                    Consumable
                  </TableHead>
                  <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                    Category
                  </TableHead>
                  <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </TableHead>
                  <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                    Stock
                  </TableHead>
                  <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700">
                    {isNrepOrg ? "Project" : "Department"}
                  </TableHead>
                  <TableHead className="py-4 px-6 text-sm font-semibold text-gray-700 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsumables.map((consumable) => (
                  <TableRow key={consumable.$id} className="hover:bg-gray-50/70">
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {consumable.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {consumable.assetTag || "No tag"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {formatCategory(getConsumableCategory(consumable))}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(consumable)}
                        {getStatusBadge(consumable)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="font-semibold text-gray-900">
                        {getCurrentStock(consumable)} {" "}
                        {getConsumableUnit(consumable)?.toLowerCase()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {isNrepOrg
                        ? getProjectName(
                            consumable.projectId || ADMIN_PLACEHOLDER_PROJECT_ID
                          )
                        : getDepartmentName(consumable.departmentId)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <Button
                        onClick={() =>
                          router.push(`/consumables/${consumable.$id}`)
                        }
                        className="inline-flex items-center gap-2 bg-org-gradient text-white shadow-sm hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredConsumables.map((consumable) => {
            return (
              <Card
                key={consumable.$id}
                className="bg-white border border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="p-5 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-[var(--org-primary)] bg-[var(--org-primary)]/12 shadow-[0_10px_25px_-18px_rgba(14,99,112,0.7)]">
                        {consumable.name.charAt(0).toUpperCase()}
                        <span className="absolute inset-0 rounded-xl border border-white/50" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 text-lg tracking-tight">
                          {consumable.name}
                        </h3>
                        <p className="text-sm font-medium text-[var(--org-primary)]/80">
                          {formatCategory(getConsumableCategory(consumable))}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Tag: {consumable.assetTag || "No tag"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(consumable)}
                      {getStatusBadge(consumable)}
                    </div>
                  </div>

                  {isNrepOrg && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--org-primary)]/8 border border-[var(--org-primary)]/20 px-3 py-1 text-xs font-medium text-[var(--org-primary)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--org-primary)]"></span>
                      {getProjectName(
                        consumable.projectId || ADMIN_PLACEHOLDER_PROJECT_ID
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-500">Current Stock</span>
                      <span className="block text-lg font-semibold text-gray-900">
                        {getCurrentStock(consumable)}{" "}
                        {getConsumableUnit(consumable)?.toLowerCase()}
                      </span>
                    </div>
                    {getMinStock(consumable) > 0 && (
                      <div className="space-y-1">
                        <span className="text-gray-500">Min Stock</span>
                        <span className="block text-lg font-semibold text-gray-900">
                          {getMinStock(consumable)}{" "}
                          {getConsumableUnit(consumable)?.toLowerCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      Location: {consumable.locationName || "Not specified"}
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      router.push(`/consumables/${consumable.$id}`)
                    }
                    className="w-full bg-org-gradient text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}