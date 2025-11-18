"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { Badge } from "../../../../../components/ui/badge";
import {
  ArrowLeft,
  Save,
  Trash2,
  Eye,
  History,
  Package,
  CheckCircle,
  Image,
  X,
} from "lucide-react";
import {
  assetsService,
  assetEventsService,
} from "../../../../../lib/appwrite/provider.js";
import { getCurrentStaff, permissions } from "../../../../../lib/utils/auth.js";
import { useToastContext } from "../../../../../components/providers/toast-provider";
// Removed useConfirmation import - using custom dialog instead
import { ENUMS } from "../../../../../lib/appwrite/config.js";
import {
  formatCategory,
  getStatusBadgeColor,
  getConditionBadgeColor,
} from "../../../../../lib/utils/mappings.js";
import { useOrgTheme } from "../../../../../components/providers/org-theme-provider";
import { PageLoading } from "../../../../../components/ui/loading";

export default function EditAsset() {
  const params = useParams();
  const router = useRouter();
  const toast = useToastContext();
  const { orgCode, theme } = useOrgTheme();
  const normalizedOrgCode = (orgCode || theme?.code || "").toUpperCase();
  const isNrepOrg = normalizedOrgCode === "NREP";
  const primaryGradient = isNrepOrg
    ? "from-[var(--org-primary)] to-[var(--org-accent)]"
    : "from-primary-500 to-primary-600";
  const secondaryGradient = isNrepOrg
    ? "from-[var(--org-primary-dark)] to-[var(--org-accent)]"
    : "from-sidebar-500 to-sidebar-600";
  const surfaceClass = isNrepOrg
    ? "bg-white/95 border border-[var(--org-primary)]/10"
    : "bg-white border border-white/20";
  const subCardBaseClass = isNrepOrg
    ? "rounded-xl p-4 bg-white border border-[var(--org-primary)]/15 shadow-sm"
    : "rounded-xl p-4";

  // Custom delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staff, setStaff] = useState(null);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalAsset, setOriginalAsset] = useState(null);
  const [assetId, setAssetId] = useState(null);

  useEffect(() => {
    if (params?.id) {
      setAssetId(params.id);
      checkPermissionsAndLoadAsset(params.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const checkPermissionsAndLoadAsset = async (id) => {
    try {
      const currentStaff = await getCurrentStaff();
      if (!currentStaff || !permissions.canManageAssets(currentStaff)) {
        window.location.href = "/unauthorized";
        return;
      }
      setStaff(currentStaff);
      await loadAsset(id);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAsset = async (id) => {
    try {
      const assetData = await assetsService.get(id);
      if (!assetData) {
        router.push("/admin/assets");
        return;
      }

      // Parse JSON fields and set default values
      const processedAsset = {
        ...assetData,
        specifications:
          typeof assetData.specifications === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(assetData.specifications);
                  return parsed.details || "";
                } catch {
                  return assetData.specifications;
                }
              })()
            : assetData.specifications?.details || "",
        purchasePrice: assetData.purchasePrice || 0,
        currentValue: assetData.currentValue || 0,
        purchaseDate: assetData.purchaseDate
          ? assetData.purchaseDate.split("T")[0]
          : "",
        warrantyExpiry: assetData.warrantyExpiry
          ? assetData.warrantyExpiry.split("T")[0]
          : "",
      };

      setAsset(processedAsset);
      setOriginalAsset(processedAsset);
    } catch (error) {
      console.error("Failed to load asset:", error);
      router.push("/admin/assets");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare the updated data - ONLY include fields that exist in Appwrite schema
      const updatedAsset = {
        // Basic information (from asset creation schema)
        name: asset.name,
        category: asset.category,
        publicSummary: asset.publicSummary || "",

        // Technical details (from asset creation schema)
        manufacturer: asset.manufacturer || "",
        model: asset.modelNumber || "", // Form uses modelNumber, DB expects model
        serialNumber: asset.serialNumber || "",

        // Status and condition (from asset creation schema)
        availableStatus: asset.availableStatus,
        currentCondition: asset.currentCondition,

        // Location information (from asset creation schema)
        locationName: asset.location || "", // Form uses location, DB expects locationName
        roomOrArea: asset.roomOrArea || "",
        publicLocationLabel: asset.publicLocationLabel || "",

        // Financial information (from asset creation schema)
        purchaseDate: asset.purchaseDate || null,
        warrantyExpiryDate: asset.warrantyExpiry || null, // Form uses warrantyExpiry, DB expects warrantyExpiryDate

        // Additional fields (from asset creation schema)
        assetTag: asset.assetTag || "",
        subcategory: asset.subcategory || "",
        departmentId: asset.departmentId || "",
        custodianStaffId: asset.custodianStaffId || "",
        isPublic: asset.isPublic || false,
        publicImages: asset.publicImages || "[]",
        publicConditionLabel:
          asset.publicConditionLabel || ENUMS.PUBLIC_CONDITION_LABEL.NEW,
        assetImage: asset.assetImage || "",

        // Maintenance fields (from asset creation schema)
        lastMaintenanceDate: asset.lastMaintenanceDate || null,
        nextMaintenanceDue: asset.nextMaintenanceDue || null,
        lastInventoryCheck: asset.lastInventoryCheck || null,
        retirementDate: asset.retirementDate || null,
        disposalDate: asset.disposalDate || null,
        attachmentFileIds: asset.attachmentFileIds || [],

        // Required for Appwrite validation
        itemType: asset.itemType || ENUMS.ITEM_TYPE.ASSET,
      };

      // Validate required fields
      if (!updatedAsset.name) {
        throw new Error("Asset name is required");
      }
      if (!updatedAsset.category) {
        throw new Error("Asset category is required");
      }
      if (!updatedAsset.availableStatus) {
        throw new Error("Asset available status is required");
      }
      if (!updatedAsset.currentCondition) {
        throw new Error("Asset current condition is required");
      }

      // Track changes for audit trail
      const changes = [];
      Object.keys(updatedAsset).forEach((key) => {
        if (
          originalAsset[key] !== updatedAsset[key] &&
          key !== "$id" &&
          key !== "$createdAt" &&
          key !== "$updatedAt"
        ) {
          changes.push({
            field: key,
            from: originalAsset[key],
            to: updatedAsset[key],
          });
        }
      });

      // Update the asset
      try {
        await assetsService.update(assetId, updatedAsset, staff?.$id);
      } catch (updateError) {
        console.error("Detailed update error:", updateError);
        console.error("Error response:", updateError.response);
        console.error("Error message:", updateError.message);
        throw updateError;
      }

      // Log changes as asset events
      for (const change of changes) {
        try {
          await assetEventsService.create({
            assetId: assetId,
            eventType: ENUMS.EVENT_TYPE.STATUS_CHANGED,
            fromValue: change.from,
            toValue: change.to,
            actorStaffId: staff.$id,
            at: new Date().toISOString(),
            notes: `Updated ${change.field}`,
          });
        } catch (eventError) {
          console.error("Failed to log asset event:", eventError);
        }
      }

      // Refresh the asset data
      await loadAsset(assetId);
      toast.success("Asset updated successfully!");
    } catch (error) {
      console.error("Failed to update asset:", error);
      toast.error("Failed to update asset. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteAsset = async () => {
    try {
      await assetsService.delete(assetId);
      toast.success("Asset deleted successfully!");
      router.push("/admin/assets");
    } catch (error) {
      console.error("Failed to delete asset:", error);
      toast.error("Failed to delete asset. Please try again.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const cancelDeleteAsset = () => {
    setShowDeleteDialog(false);
  };

  if (loading) {
    return <PageLoading message="Loading asset details..." />;
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Asset not found
          </h2>
          <p className="text-gray-600">
            The asset you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/assets">Back to Assets</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Mobile-optimized Header */}
        <div className={`rounded-2xl shadow-xl backdrop-blur-sm p-4 sm:p-6 ${surfaceClass}`}>
          <div className="flex flex-col gap-4">
            {/* Back Button - Full width on mobile */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full bg-org-gradient text-white shadow-md hover:shadow-lg transition-colors duration-200 hover:from-[var(--org-primary-dark)] hover:to-[var(--org-primary)]"
            >
              <Link href="/admin/assets">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assets
              </Link>
            </Button>

            {/* Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-[var(--org-primary)] to-[var(--org-accent)]">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-[var(--org-primary)] to-[var(--org-accent)] bg-clip-text text-transparent">
                    Edit Asset
                  </h1>
                  <p className="text-gray-600 font-medium text-sm sm:text-base break-words max-w-xs sm:max-w-none">
                    {asset.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Responsive layout */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full sm:w-auto justify-center border-[var(--org-primary)]/25 text-[var(--org-primary)] hover:bg-[var(--org-primary)]/10 transition-all duration-200"
              >
                <Link href={`/assets/${asset.$id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">View Public</span>
                  <span className="sm:hidden">View</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full sm:w-auto justify-center border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <Link href={`/admin/assets/${asset.$id}/history`}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </Link>
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto justify-center bg-org-gradient hover:from-[var(--org-primary-dark)] hover:to-[var(--org-primary)] text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {saving ? "Saving..." : "Save Changes"}
                </span>
                <span className="sm:hidden">
                  {saving ? "Saving..." : "Save"}
                </span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Current Status */}
        <div className={`rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden ${surfaceClass}`}>
          <div className={`bg-gradient-to-r ${primaryGradient} p-6`}>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              Current Status
            </h2>
            <p className="text-white/80 mt-1">Overview of asset details</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className={`${subCardBaseClass} ${
                  isNrepOrg
                    ? ""
                    : "bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-gray-800">
                    Status
                  </Label>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                </div>
                <Badge
                  className={
                    getStatusBadgeColor(asset.availableStatus) +
                    " text-sm font-semibold px-3 py-1"
                  }
                >
                  {asset.availableStatus.replace(/_/g, " ")}
                </Badge>
              </div>

              <div
                className={`${subCardBaseClass} ${
                  isNrepOrg
                    ? ""
                    : "bg-gradient-to-br from-sidebar-50 to-sidebar-100 border border-sidebar-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-gray-800">
                    Condition
                  </Label>
                  <Package className="w-4 h-4 text-sidebar-500" />
                </div>
                <Badge
                  className={
                    getConditionBadgeColor(asset.currentCondition) +
                    " text-sm font-semibold px-3 py-1"
                  }
                >
                  {asset.currentCondition.replace(/_/g, " ")}
                </Badge>
              </div>

              <div
                className={`${subCardBaseClass} ${
                  isNrepOrg
                    ? ""
                    : "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-gray-800">
                    Category
                  </Label>
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                </div>
                <Badge
                  className={`text-sm font-semibold px-3 py-1 ${
                    isNrepOrg
                      ? "bg-[var(--org-primary)]/12 text-[var(--org-primary)] border border-[var(--org-primary)]/25"
                      : "bg-gray-500 text-white border-0"
                  }`}
                >
                  {formatCategory(asset.category)}
                </Badge>
              </div>

              <div
                className={`${subCardBaseClass} ${
                  isNrepOrg
                    ? ""
                    : "bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-gray-800">
                    Asset ID
                  </Label>
                  <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                </div>
                <div className="text-2xl font-bold text-[var(--org-primary)]">
                  {asset.$id?.slice(-6) || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Basic Information */}
          <div className={`rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden ${surfaceClass}`}>
            <div className={`bg-gradient-to-r ${secondaryGradient} p-6`}>
              <h3 className="text-xl font-bold text-white flex items-center">
                <Package className="w-5 h-5 mr-3" />
                Basic Information
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Core asset details
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-sm font-semibold text-gray-700"
                >
                  Asset Name *
                </Label>
                <Input
                  id="name"
                  value={asset.name}
                  onChange={(e) => setAsset({ ...asset, name: e.target.value })}
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                  placeholder="Enter asset name"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="category"
                  className="text-sm font-semibold text-gray-700"
                >
                  Category
                </Label>
                <Select
                  value={asset.category}
                  onValueChange={(value) =>
                    setAsset({ ...asset, category: value })
                  }
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-gray-200 shadow-xl">
                    {Object.values(ENUMS.CATEGORY).map((category) => (
                      <SelectItem
                        key={category}
                        value={category}
                        className="rounded-lg"
                      >
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="description"
                  className="text-sm font-semibold text-gray-700"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={asset.description || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Detailed description of the asset"
                  className="border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="publicSummary"
                  className="text-sm font-semibold text-gray-700"
                >
                  Public Summary
                </Label>
                <Textarea
                  id="publicSummary"
                  value={asset.publicSummary || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, publicSummary: e.target.value })
                  }
                  rows={2}
                  placeholder="Brief description visible to guests"
                  className="border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Technical Details */}
          <div className={`rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden ${surfaceClass}`}>
            <div className={`bg-gradient-to-r ${primaryGradient} p-6`}>
              <h3 className="text-xl font-bold text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-3" />
                Technical Details
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Technical specifications and hardware info
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="manufacturer"
                  className="text-sm font-semibold text-gray-700"
                >
                  Manufacturer
                </Label>
                <Input
                  id="manufacturer"
                  value={asset.manufacturer || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, manufacturer: e.target.value })
                  }
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                  placeholder="Enter manufacturer name"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="modelNumber"
                  className="text-sm font-semibold text-gray-700"
                >
                  Model Number
                </Label>
                <Input
                  id="modelNumber"
                  value={asset.modelNumber || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, modelNumber: e.target.value })
                  }
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                  placeholder="Enter model number"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="serialNumber"
                  className="text-sm font-semibold text-gray-700"
                >
                  Serial Number
                </Label>
                <Input
                  id="serialNumber"
                  value={asset.serialNumber || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, serialNumber: e.target.value })
                  }
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                  placeholder="Enter serial number"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="specifications"
                  className="text-sm font-semibold text-gray-700"
                >
                  Specifications
                </Label>
                <Textarea
                  id="specifications"
                  value={asset.specifications || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, specifications: e.target.value })
                  }
                  rows={3}
                  placeholder="Technical specifications, features, etc."
                  className="border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Status & Location */}
          <div className={`rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden ${surfaceClass}`}>
            <div className={`bg-gradient-to-r ${secondaryGradient} p-6`}>
              <h3 className="text-xl font-bold text-white flex items-center">
                <Package className="w-5 h-5 mr-3" />
                Status & Location
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Asset status and location details
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="availableStatus"
                  className="text-sm font-semibold text-gray-700"
                >
                  Available Status
                </Label>
                <Select
                  value={asset.availableStatus}
                  onValueChange={(value) =>
                    setAsset({ ...asset, availableStatus: value })
                  }
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-[var(--org-primary)] focus:ring-4 focus:ring-[var(--org-primary)]/20 transition-all duration-200 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[999] rounded-xl border-2 border-gray-200 shadow-2xl bg-white">
                    {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="rounded-lg text-gray-800 focus:bg-[var(--org-primary)] focus:text-white"
                      >
                        {status.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="currentCondition"
                  className="text-sm font-semibold text-gray-700"
                >
                  Current Condition
                </Label>
                <Select
                  value={asset.currentCondition}
                  onValueChange={(value) =>
                    setAsset({ ...asset, currentCondition: value })
                  }
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-[var(--org-primary)] focus:ring-4 focus:ring-[var(--org-primary)]/20 transition-all duration-200 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[999] rounded-xl border-2 border-gray-200 shadow-2xl bg-white">
                    {Object.values(ENUMS.CURRENT_CONDITION).map((condition) => (
                      <SelectItem
                        key={condition}
                        value={condition}
                        className="rounded-lg text-gray-800 focus:bg-[var(--org-primary)] focus:text-white"
                      >
                        {condition.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="location"
                  className="text-sm font-semibold text-gray-700"
                >
                  Internal Location
                </Label>
                <Input
                  id="location"
                  value={asset.location || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, location: e.target.value })
                  }
                  placeholder="e.g., Building A, Room 101"
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="publicLocationLabel"
                  className="text-sm font-semibold text-gray-700"
                >
                  Public Location
                </Label>
                <Input
                  id="publicLocationLabel"
                  value={asset.publicLocationLabel || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, publicLocationLabel: e.target.value })
                  }
                  placeholder="e.g., Main Lab"
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Financial Information */}
          <div className={`rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden ${surfaceClass}`}>
            <div className={`bg-gradient-to-r ${primaryGradient} p-6`}>
              <h3 className="text-xl font-bold text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-3" />
                Financial Information
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Purchase and valuation details
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="purchaseDate"
                  className="text-sm font-semibold text-gray-700"
                >
                  Purchase Date
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={asset.purchaseDate || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, purchaseDate: e.target.value })
                  }
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="purchasePrice"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Purchase Price ($)
                  </Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={asset.purchasePrice || ""}
                    onChange={(e) =>
                      setAsset({ ...asset, purchasePrice: e.target.value })
                    }
                    className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="currentValue"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Current Value ($)
                  </Label>
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.01"
                    value={asset.currentValue || ""}
                    onChange={(e) =>
                      setAsset({ ...asset, currentValue: e.target.value })
                    }
                    className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="warrantyExpiry"
                  className="text-sm font-semibold text-gray-700"
                >
                  Warranty Expiry
                </Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={asset.warrantyExpiry || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, warrantyExpiry: e.target.value })
                  }
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Internal Notes */}
        <div className={`rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden ${surfaceClass}`}>
          <div className={`bg-gradient-to-r ${primaryGradient} p-6`}>
            <h3 className="text-xl font-bold text-white flex items-center">
              <Package className="w-5 h-5 mr-3" />
              Internal Notes
            </h3>
            <p className="text-white/80 text-sm mt-1">
              Internal comments and notes (not visible to guests)
            </p>
          </div>
          <div className="p-6">
            <Textarea
              value={asset.notes || ""}
              onChange={(e) => setAsset({ ...asset, notes: e.target.value })}
              rows={4}
              placeholder="Add internal notes and comments..."
              className="border-2 border-gray-200 focus:border-[var(--org-primary)] focus:ring-4 focus:ring-[var(--org-primary)]/20 transition-all duration-200 rounded-xl resize-none"
            />
          </div>
        </div>

        {/* Custom Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={cancelDeleteAsset}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              isolation: "isolate",
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Delete Asset
                    </h2>
                    <p className="text-red-100 text-sm">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Dialog Content */}
              <div className="text-center space-y-4 p-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Are you sure you want to delete this asset?
                </h3>
                <p className="text-gray-600">
                  This action will permanently remove the asset and all its
                  data.
                </p>

                {/* Asset Details */}
                {asset && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {asset.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCategory(asset.category)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Serial: {asset.serialNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 w-full pt-4">
                  <Button
                    onClick={cancelDeleteAsset}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteAsset}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Asset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
