"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
// Removed MainLayout to eliminate navbar
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from "../../../components/ui/dialog";
import {
  Calendar,
  Clock,
  User,
  FileText,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  RotateCcw,
  Eye,
  MessageSquare,
} from "lucide-react";
import {
  assetRequestsService,
  assetsService,
  staffService,
  assetEventsService,
} from "../../../lib/appwrite/provider.js";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import { ENUMS } from "../../../lib/appwrite/config.js";
import { Query } from "appwrite";

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const [assets, setAssets] = useState([]);
  const [requester, setRequester] = useState(null);
  const [approver, setApprover] = useState(null);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [resubmitReason, setResubmitReason] = useState("");

  useEffect(() => {
    loadData();
  }, [params.requestId]);

  const loadData = async () => {
    try {
      const [requestData, staff] = await Promise.all([
        assetRequestsService.get(params.requestId),
        getCurrentStaff(),
      ]);

      setRequest(requestData);
      setCurrentStaff(staff);

      // Load requester details
      const requesterData = await staffService.get(
        requestData.requesterStaffId
      );
      setRequester(requesterData);

      // Load approver details if exists
      if (requestData.approverStaffId) {
        try {
          const approverData = await staffService.get(
            requestData.approverStaffId
          );
          setApprover(approverData);
        } catch (error) {
          console.warn("Could not load approver data:", error);
        }
      }

      // Load assets details
      const assetsData = await Promise.all(
        requestData.requestedItems.map(async (itemId) => {
          try {
            return await assetsService.get(itemId);
          } catch {
            return { name: "Asset not found", $id: itemId, notFound: true };
          }
        })
      );
      setAssets(assetsData);

      // Load timeline/history
      await loadTimeline(requestData);
    } catch (err) {
      setError("Failed to load request details");
      console.error("Error loading request:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (requestData) => {
    try {
      // Get related asset events for this request
      const eventsResult = await assetEventsService.list([
        Query.search("notes", `#${requestData.$id.slice(-8)}`),
        Query.orderDesc("at"),
      ]);

      const timelineItems = [
        {
          id: "created",
          type: "created",
          timestamp: requestData.$createdAt,
          title: "Request Submitted",
          description: `Request submitted by ${requester?.name || "Unknown"}`,
          icon: FileText,
          color: "blue",
        },
      ];

      // Add status changes
      if (
        requestData.status === ENUMS.REQUEST_STATUS.APPROVED &&
        requestData.approvedAt
      ) {
        timelineItems.push({
          id: "approved",
          type: "approved",
          timestamp: requestData.approvedAt,
          title: "Request Approved",
          description: `Approved by ${approver?.name || "Admin"}`,
          notes: requestData.approvalNotes,
          icon: CheckCircle,
          color: "green",
        });
      }

      if (
        requestData.status === ENUMS.REQUEST_STATUS.DENIED &&
        requestData.deniedAt
      ) {
        timelineItems.push({
          id: "denied",
          type: "denied",
          timestamp: requestData.deniedAt,
          title: "Request Denied",
          description: `Denied by ${approver?.name || "Admin"}`,
          notes: requestData.denialReason,
          icon: XCircle,
          color: "red",
        });
      }

      if (requestData.status === ENUMS.REQUEST_STATUS.FULFILLED) {
        timelineItems.push({
          id: "fulfilled",
          type: "fulfilled",
          timestamp: requestData.fulfilledAt || requestData.$updatedAt,
          title: "Assets Issued",
          description: "Assets have been issued and are ready for pickup",
          icon: Package,
          color: "blue",
        });
      }

      // Add asset events
      eventsResult.documents.forEach((event) => {
        timelineItems.push({
          id: event.$id,
          type: "asset_event",
          timestamp: event.at,
          title: `Asset ${event.eventType.replace(/_/g, " ")}`,
          description: event.notes,
          icon: Package,
          color: "gray",
        });
      });

      // Sort by timestamp descending
      timelineItems.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setTimeline(timelineItems);
    } catch (error) {
      console.warn("Could not load timeline:", error);
    }
  };

  const handleCancelRequest = async () => {
    setActionLoading(true);
    try {
      await assetRequestsService.update(request.$id, {
        status: ENUMS.REQUEST_STATUS.CANCELLED,
        decisionNotes: cancelReason,
        decidedAt: new Date().toISOString(),
      });
      setCancelDialogOpen(false);
      setCancelReason("");
      await loadData();
    } catch (error) {
      setError("Failed to cancel request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    setActionLoading(true);
    try {
      await assetRequestsService.delete(request.$id);
      setDeleteDialogOpen(false);
      router.push("/requests?deleted=true");
    } catch (error) {
      setError("Failed to delete request");
      setActionLoading(false);
    }
  };

  const handleResubmitRequest = async () => {
    setActionLoading(true);
    try {
      // Create a new request based on the current one
      const newRequestData = {
        requesterStaffId: request.requesterStaffId,
        requestedItems: request.requestedItems,
        purpose: request.purpose,
        issueDate: request.issueDate,
        expectedReturnDate: request.expectedReturnDate,
        status: ENUMS.REQUEST_STATUS.PENDING,
        resubmissionReason: resubmitReason,
        originalRequestId: request.$id,
      };

      const newRequest = await assetRequestsService.create(newRequestData, {
        sendNotification: true,
        requester: requester,
        asset: assets[0], // For notification purposes
      });

      setResubmitDialogOpen(false);
      setResubmitReason("");
      router.push(`/requests/${newRequest.$id}`);
    } catch (error) {
      setError("Failed to resubmit request");
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      [ENUMS.REQUEST_STATUS.PENDING]:
        "bg-orange-100 text-orange-800 border-orange-200",
      [ENUMS.REQUEST_STATUS.APPROVED]:
        "bg-primary-100 text-primary-800 border-primary-200",
      [ENUMS.REQUEST_STATUS.DENIED]: "bg-red-100 text-red-800 border-red-200",
      [ENUMS.REQUEST_STATUS.CANCELLED]:
        "bg-gray-100 text-gray-800 border-gray-200",
      [ENUMS.REQUEST_STATUS.FULFILLED]:
        "bg-sidebar-100 text-sidebar-800 border-sidebar-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      [ENUMS.REQUEST_STATUS.PENDING]: Clock,
      [ENUMS.REQUEST_STATUS.APPROVED]: CheckCircle,
      [ENUMS.REQUEST_STATUS.DENIED]: XCircle,
      [ENUMS.REQUEST_STATUS.CANCELLED]: XCircle,
      [ENUMS.REQUEST_STATUS.FULFILLED]: Package,
    };
    const IconComponent = icons[status] || AlertTriangle;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Permission checks
  const isRequester = currentStaff?.$id === request?.requesterStaffId;
  const isAdmin = currentStaff && permissions.canApproveRequests(currentStaff);
  const canEditRequest =
    isRequester && request?.status === ENUMS.REQUEST_STATUS.PENDING;
  const canCancelRequest =
    isRequester &&
    [ENUMS.REQUEST_STATUS.PENDING, ENUMS.REQUEST_STATUS.APPROVED].includes(
      request?.status
    );
  const canDeleteRequest =
    isRequester && request?.status === ENUMS.REQUEST_STATUS.PENDING;
  const canResubmitRequest =
    isRequester && request?.status === ENUMS.REQUEST_STATUS.DENIED;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
        <div className="max-w-6xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || "Request not found"}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link
                href={
                  currentStaff && permissions.canManageRequests(currentStaff)
                    ? "/admin/requests"
                    : "/requests"
                }
              >
                Back to Requests
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNTk2NjkiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

      <div className="relative max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary-100 hover:text-primary-700"
                >
                  <Link
                    href={
                      currentStaff &&
                      permissions.canManageRequests(currentStaff)
                        ? "/admin/requests"
                        : "/requests"
                    }
                  >
                    ← Back to Requests
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-sidebar-900 to-sidebar-900 bg-clip-text text-transparent">
                  Request #{request.$id.slice(-8)}
                </h1>
                <Badge
                  className={`${getStatusBadgeColor(
                    request.status
                  )} flex items-center gap-1 px-3 py-1`}
                >
                  {getStatusIcon(request.status)}
                  {request.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-slate-600 text-lg">{request.purpose}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {canEditRequest && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary-100 hover:text-primary-700 hover:border-primary-300"
                >
                  <Link href={`/requests/${request.$id}/edit`}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}

              {canCancelRequest && (
                <Dialog
                  open={cancelDialogOpen}
                  onOpenChange={setCancelDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Request</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel this request? This
                        action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cancelReason">
                          Cancellation Reason
                        </Label>
                        <Textarea
                          id="cancelReason"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Please provide a reason for cancellation..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleCancelRequest}
                        disabled={actionLoading || !cancelReason.trim()}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {actionLoading ? "Cancelling..." : "Cancel Request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canDeleteRequest && (
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Request</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to permanently delete this
                        request? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleDeleteRequest}
                        disabled={actionLoading}
                        variant="destructive"
                      >
                        {actionLoading ? "Deleting..." : "Delete Request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canResubmitRequest && (
                <Dialog
                  open={resubmitDialogOpen}
                  onOpenChange={setResubmitDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-sidebar-600 hover:text-sidebar-700 hover:bg-sidebar-50 hover:border-sidebar-300"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Resubmit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Resubmit Request</DialogTitle>
                      <DialogDescription>
                        This will create a new request with the same details.
                        Please provide any additional context.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="resubmitReason">
                          Additional Context (Optional)
                        </Label>
                        <Textarea
                          id="resubmitReason"
                          value={resubmitReason}
                          onChange={(e) => setResubmitReason(e.target.value)}
                          placeholder="Address any concerns from the previous denial..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleResubmitRequest}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {actionLoading ? "Resubmitting..." : "Resubmit Request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {isAdmin && request.status === ENUMS.REQUEST_STATUS.APPROVED && (
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href={`/admin/issue/${request.$id}`}>
                    <Package className="w-4 h-4 mr-2" />
                    Issue Assets
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Request Details */}
            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Requester
                    </Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-sm bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
                          {requester?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-900">
                        {requester?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Department
                    </Label>
                    <p className="text-sm mt-2 text-slate-600">
                      {requester?.department || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Issue Date
                    </Label>
                    <p className="text-sm mt-2 text-slate-600">
                      {formatDate(request.issueDate)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Expected Return
                    </Label>
                    <p className="text-sm mt-2 text-slate-600">
                      {formatDate(request.expectedReturnDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Purpose
                  </Label>
                  <p className="text-sm mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {request.purpose}
                  </p>
                </div>

                {request.resubmissionReason && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Resubmission Context
                    </Label>
                    <p className="text-sm mt-2 p-4 bg-sidebar-50 rounded-lg border border-sidebar-200">
                      {request.resubmissionReason}
                    </p>
                  </div>
                )}

                {(request.approvalNotes ||
                  request.denialReason ||
                  request.decisionNotes) && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      {request.status === ENUMS.REQUEST_STATUS.APPROVED
                        ? "Approval Notes"
                        : request.status === ENUMS.REQUEST_STATUS.DENIED
                        ? "Denial Reason"
                        : "Decision Notes"}
                    </Label>
                    <div
                      className={`text-sm mt-2 p-4 rounded-lg border ${
                        request.status === ENUMS.REQUEST_STATUS.APPROVED
                          ? "bg-primary-50 border-primary-200"
                          : request.status === ENUMS.REQUEST_STATUS.DENIED
                          ? "bg-red-50 border-red-200"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      {request.approvalNotes ||
                        request.denialReason ||
                        request.decisionNotes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requested Assets */}
            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-sidebar-50 to-sidebar-100/50 rounded-t-2xl">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-xl shadow-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  Requested Assets ({assets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.$id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-slate-900">
                            {asset.name}
                          </h4>
                          {asset.assetTag && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-sidebar-50 text-sidebar-700 border-sidebar-200"
                            >
                              {asset.assetTag}
                            </Badge>
                          )}
                          {asset.notFound && (
                            <Badge
                              variant="outline"
                              className="text-xs text-red-600 border-red-200 bg-red-50"
                            >
                              Not Found
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {asset.category?.replace(/_/g, " ")} •{" "}
                          {asset.locationName}
                          {asset.roomOrArea && ` - ${asset.roomOrArea}`}
                        </p>
                        {asset.currentCondition && (
                          <p className="text-xs text-slate-500 mt-1">
                            Condition:{" "}
                            {asset.currentCondition.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                      {!asset.notFound && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="hover:bg-sidebar-100 hover:text-sidebar-700 hover:border-sidebar-300"
                        >
                          <Link href={`/assets/${asset.$id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Info */}
            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-t-2xl">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Created</span>
                  <span className="text-slate-900">
                    {formatDateTime(request.$createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">
                    Last Updated
                  </span>
                  <span className="text-slate-900">
                    {formatDateTime(request.$updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Duration</span>
                  <span className="text-slate-900 font-semibold">
                    {Math.ceil(
                      (new Date(request.expectedReturnDate) -
                        new Date(request.issueDate)) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </div>
                {approver && (
                  <div className="pt-4 border-t border-slate-200">
                    <span className="text-xs text-slate-600 font-medium">
                      {request.status === ENUMS.REQUEST_STATUS.APPROVED
                        ? "Approved by"
                        : request.status === ENUMS.REQUEST_STATUS.DENIED
                        ? "Denied by"
                        : "Reviewed by"}
                    </span>
                    <div className="flex items-center gap-3 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-sidebar-100 to-sidebar-200 text-sidebar-700">
                          {approver.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-slate-900">
                        {approver.name}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-sidebar-50 to-sidebar-100/50 rounded-t-2xl">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-lg">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {timeline.map((item, index) => {
                    const IconComponent = item.icon;
                    const isLast = index === timeline.length - 1;
                    return (
                      <div key={item.id} className="relative flex gap-4">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm ${
                            item.color === "blue"
                              ? "bg-sidebar-50 border-sidebar-200"
                              : item.color === "green"
                              ? "bg-primary-50 border-primary-200"
                              : item.color === "red"
                              ? "bg-red-50 border-red-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <IconComponent
                            className={`w-5 h-5 ${
                              item.color === "blue"
                                ? "text-sidebar-600"
                                : item.color === "green"
                                ? "text-primary-600"
                                : item.color === "red"
                                ? "text-red-600"
                                : "text-slate-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </h4>
                            <time className="text-xs text-slate-500">
                              {formatDateTime(item.timestamp)}
                            </time>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {item.description}
                          </p>
                          {item.notes && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                              <MessageSquare className="w-3 h-3 inline mr-2 text-slate-500" />
                              {item.notes}
                            </div>
                          )}
                        </div>
                        {!isLast && (
                          <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
