"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  User,
  Mail,
  Shield,
  Building,
  Phone,
  Hash,
  AlertCircle,
  X,
  Loader2,
  CheckCircle,
  Copy,
  Users,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Pause,
  Archive,
  Zap,
  Target,
  Briefcase,
  Settings,
} from "lucide-react";
import {
  assetRequestsService,
  assetsService,
  staffService,
  departmentsService,
} from "../../../lib/appwrite/provider.js";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import { ENUMS } from "../../../lib/appwrite/config.js";
import Link from "next/link";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper function to get status badge color
const getStatusBadgeColor = (status) => {
  switch (status) {
    case ENUMS.REQUEST_STATUS.PENDING:
      return "bg-orange-100 text-orange-800";
    case ENUMS.REQUEST_STATUS.APPROVED:
      return "bg-primary-100 text-primary-800";
    case ENUMS.REQUEST_STATUS.DENIED:
      return "bg-red-100 text-red-800";
    case ENUMS.REQUEST_STATUS.FULFILLED:
      return "bg-sidebar-100 text-sidebar-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Helper function to get priority level
const getPriorityLevel = (priority) => {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-800";
    case "MEDIUM":
      return "bg-orange-100 text-orange-800";
    case "LOW":
      return "bg-primary-100 text-primary-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function RequestQueue() {
  const [currentStaff, setCurrentStaff] = useState(null);
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRequester, setSelectedRequester] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  // Load requester names when both requests and staff data are available
  useEffect(() => {
    if (requests.length > 0 && staff.length > 0) {
      // Both requests and staff loaded, requester names will be resolved
    }
  }, [requests, staff]);

  const initializeData = async () => {
    try {
      setError(null); // Clear any existing errors
      // Get current staff for permission checking
      const staff = await getCurrentStaff();
      if (!staff || !permissions.canManageRequests(staff)) {
        window.location.href = "/unauthorized";
        return;
      }
      setCurrentStaff(staff);

      // Load all data
      await Promise.all([
        loadRequests(),
        loadAssets(),
        loadStaff(),
        loadDepartments(),
      ]);
    } catch (error) {
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await assetRequestsService.list();
      const requests = response.documents || [];
      setRequests(requests);
    } catch (error) {
      throw error;
    }
  };

  const loadAssets = async () => {
    try {
      const response = await assetsService.list();
      setAssets(response.documents || []);
    } catch (error) {
      throw error;
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffService.list();
      const staff = response.documents || [];
      setStaff(staff);
      setStaffList(staff);
    } catch (error) {
      throw error;
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsService.list();
      setDepartments(response.documents || []);
    } catch (error) {
      throw error;
    }
  };

  const handleDecision = async (requestId, status) => {
    setDecisionLoading(true);
    setError(null); // Clear any existing errors
    try {
      // Only update the status field for now
      const updateData = {
        status,
      };

      await assetRequestsService.update(requestId, updateData);

      await loadRequests();
      setSelectedRequest(null);
    } catch (error) {
      setError("Failed to update request. Please try again.");
    } finally {
      setDecisionLoading(false);
    }
  };

  const getRequesterName = (requesterStaffId) => {
    if (!requesterStaffId) return "Unknown User";
    const requester = staff.find((s) => s.$id === requesterStaffId);
    return requester ? requester.name : "Unknown User";
  };

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "Unassigned";
    const dept = departments.find((d) => d.$id === departmentId);
    return dept ? dept.name : "Unknown Department";
  };

  // Filter requests based on all filters
  const filteredRequests = requests.filter((request) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      request.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRequesterName(request.requesterStaffId)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.assets?.some((asset) =>
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      request.$id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      selectedStatus === "all" || request.status === selectedStatus;

    // Requester filter
    const matchesRequester =
      selectedRequester === "all" ||
      request.requesterStaffId === selectedRequester;

    // Priority filter (assuming priority is stored in request.priority)
    const matchesPriority =
      selectedPriority === "all" || request.priority === selectedPriority;

    // Date range filter
    const matchesDateRange = (() => {
      if (dateRange === "all") return true;

      const requestDate = new Date(request.$createdAt);
      const now = new Date();

      switch (dateRange) {
        case "today":
          return requestDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return requestDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return requestDate >= monthAgo;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return requestDate >= quarterAgo;
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return requestDate >= yearAgo;
        default:
          return true;
      }
    })();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesRequester &&
      matchesPriority &&
      matchesDateRange
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-medium">Loading Requests</p>
              <p className="text-slate-500 text-sm">Fetching request data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error loading requests</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                initializeData();
              }}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>

      <div className="relative container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Modern Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-sidebar-900 to-sidebar-900 bg-clip-text text-transparent">
                    Request Queue
                  </h1>
                  <p className="text-slate-600 font-medium">
                    Manage and process asset requests
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => loadRequests()}
                variant="outline"
                disabled={loading}
                className="bg-white/90 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6 relative z-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Filter Requests
                </h2>
                <p className="text-sm text-slate-600">
                  Refine your search with advanced filters
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("all");
                setSelectedPriority("all");
              }}
              variant="outline"
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-slate-200"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Primary Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Search Requests
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by ID, purpose, or requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Status
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="z-30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={ENUMS.REQUEST_STATUS.PENDING}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={ENUMS.REQUEST_STATUS.APPROVED}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Approved</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={ENUMS.REQUEST_STATUS.DENIED}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Denied</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={ENUMS.REQUEST_STATUS.FULFILLED}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Fulfilled</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                Priority
              </Label>
              <Select
                value={selectedPriority}
                onValueChange={setSelectedPriority}
              >
                <SelectTrigger className="h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500/20 rounded-lg shadow-sm">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent className="z-30">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Low</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm ||
            selectedStatus !== "all" ||
            selectedPriority !== "all") && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-600">
                  Active filters:
                </span>
                {searchTerm && (
                  <Badge className="bg-primary-100 text-primary-700 border-primary-200">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-2 hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedStatus !== "all" && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("all")}
                      className="ml-2 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedPriority !== "all" && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    Priority: {selectedPriority}
                    <button
                      onClick={() => setSelectedPriority("all")}
                      className="ml-2 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6 animate-pulse"
              >
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading Staff State */}
        {!loading && staff.length === 0 && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600">Loading staff data...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && staff.length > 0 && filteredRequests.length === 0 && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Requests Found
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedStatus !== "all"
                  ? "No requests match your current filters."
                  : "No asset requests have been submitted yet."}
              </p>
            </div>
          </div>
        )}

        {/* Requests List */}
        {!loading && staff.length > 0 && filteredRequests.length > 0 && (
          <div className="space-y-6">
            {filteredRequests.map((request) => (
              <Card
                key={request.$id}
                className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl hover:shadow-2xl transition-shadow duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                    <div className="flex-1 space-y-4">
                      {/* Request Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                            Request #{request.$id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm bg-gradient-to-r from-sidebar-600 to-sidebar-700 bg-clip-text text-transparent font-medium">
                            by {getRequesterName(request.requesterStaffId)}
                          </p>
                        </div>
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>

                      {/* Request Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">
                            Purpose
                          </h4>
                          <p className="text-sm text-slate-600">
                            {request.purpose}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">
                            Duration
                          </h4>
                          <p className="text-sm text-slate-600">
                            {formatDate(request.issueDate)} -{" "}
                            {formatDate(request.expectedReturnDate)}
                          </p>
                        </div>
                      </div>

                      {/* Requested Assets */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">
                          Requested Assets
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {request.assets?.map((asset) => (
                            <Badge
                              key={asset.$id}
                              className="bg-sidebar-50 text-sidebar-700 border-sidebar-200 hover:bg-sidebar-100"
                            >
                              {asset.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="hover:bg-sidebar-100 hover:text-sidebar-700"
                      >
                        <Link href={`/requests/${request.$id}`}>
                          View Details
                        </Link>
                      </Button>

                      {request.status === ENUMS.REQUEST_STATUS.PENDING && (
                        <>
                          <Button
                            size="sm"
                            disabled={decisionLoading}
                            onClick={() =>
                              handleDecision(
                                request.$id,
                                ENUMS.REQUEST_STATUS.APPROVED
                              )
                            }
                            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                          >
                            {decisionLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            disabled={decisionLoading}
                            onClick={() =>
                              handleDecision(
                                request.$id,
                                ENUMS.REQUEST_STATUS.DENIED
                              )
                            }
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                          >
                            {decisionLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Deny
                          </Button>
                        </>
                      )}

                      {request.status === ENUMS.REQUEST_STATUS.APPROVED && (
                        <Button
                          asChild
                          size="sm"
                          className="bg-gradient-to-r from-sidebar-500 to-sidebar-600 hover:from-sidebar-600 hover:to-sidebar-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Link href={`/admin/issue/${request.$id}`}>
                            <Zap className="w-4 h-4 mr-2" />
                            Issue Assets
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
