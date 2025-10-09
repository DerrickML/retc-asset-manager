"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { ImageUpload } from "../../../components/ui/image-upload";
import { assetImageService } from "../../../lib/appwrite/image-service";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  X,
  Package,
  AlertTriangle,
  Settings,
  DollarSign,
  MapPin,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Image,
} from "lucide-react";
import { assetsService } from "../../../lib/appwrite/provider.js";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import { ENUMS } from "../../../lib/appwrite/config.js";
import {
  formatCategory,
  getStatusBadgeColor,
  getConditionBadgeColor,
} from "../../../lib/utils/mappings.js";

export default function AdminAssetManagement() {
  const [staff, setStaff] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  // Export functionality state
  const [exporting, setExporting] = useState(false);

  // New asset form state - matching Appwrite collection attributes
  const [newAsset, setNewAsset] = useState({
    assetTag: "",
    serialNumber: "",
    name: "",
    category: ENUMS.CATEGORY.IT_EQUIPMENT,
    subcategory: "",
    model: "",
    manufacturer: "",
    departmentId: "",
    custodianStaffId: "",
    availableStatus: ENUMS.AVAILABLE_STATUS.AVAILABLE,
    currentCondition: ENUMS.CURRENT_CONDITION.NEW,
    locationName: "",
    roomOrArea: "",
    purchaseDate: "",
    warrantyExpiryDate: "",
    lastMaintenanceDate: "",
    nextMaintenanceDue: "",
    lastInventoryCheck: "",
    retirementDate: "",
    disposalDate: "",
    attachmentFileIds: [],
    isPublic: false,
    publicSummary: "",
    publicImages: [],
    publicLocationLabel: "",
    publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW,
  });

  useEffect(() => {
    checkPermissionsAndLoadData();
  }, []);

  const checkPermissionsAndLoadData = async () => {
    try {
      const currentStaff = await getCurrentStaff();
      if (!currentStaff || !permissions.canManageAssets(currentStaff)) {
        window.location.href = "/unauthorized";
        return;
      }
      setStaff(currentStaff);
      await loadAssets();
    } catch (error) {
      // Silent fail for data loading
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const result = await assetsService.list();
      setAssets(result.documents);
    } catch (error) {
      // Silent fail for assets loading
    }
  };

  const handleCreateAsset = async () => {
    try {
      // Generate asset tag if not provided
      const assetTag = newAsset.assetTag || `RETC-${Date.now()}`;

      // Prepare asset data matching Appwrite collection schema
      const assetData = {
        assetTag,
        serialNumber: newAsset.serialNumber || "",
        name: newAsset.name,
        category: newAsset.category,
        subcategory: newAsset.subcategory || "",
        model: newAsset.model || "",
        manufacturer: newAsset.manufacturer || "",
        departmentId: newAsset.departmentId || "",
        custodianStaffId: newAsset.custodianStaffId || "",
        availableStatus: newAsset.availableStatus,
        currentCondition: newAsset.currentCondition,
        locationName: newAsset.locationName || "",
        roomOrArea: newAsset.roomOrArea || "",
        purchaseDate: newAsset.purchaseDate || null,
        warrantyExpiryDate: newAsset.warrantyExpiryDate || null,
        lastMaintenanceDate: newAsset.lastMaintenanceDate || null,
        nextMaintenanceDue: newAsset.nextMaintenanceDue || null,
        lastInventoryCheck: newAsset.lastInventoryCheck || null,
        retirementDate: newAsset.retirementDate || null,
        disposalDate: newAsset.disposalDate || null,
        attachmentFileIds: newAsset.attachmentFileIds || [],
        isPublic: newAsset.isPublic || false,
        publicSummary: newAsset.publicSummary || "",
        publicImages: JSON.stringify(newAsset.publicImages || []),
        publicLocationLabel: newAsset.publicLocationLabel || "",
        publicConditionLabel:
          newAsset.publicConditionLabel || ENUMS.PUBLIC_CONDITION_LABEL.NEW,
        // Add required assetImage field - use first image URL or empty string
        assetImage:
          newAsset.publicImages && newAsset.publicImages.length > 0
            ? assetImageService.getPublicImageUrl(newAsset.publicImages[0])
            : "",
      };

      await assetsService.create(assetData, staff.$id);

      // Reset form and refresh assets
      setNewAsset({
        assetTag: "",
        serialNumber: "",
        name: "",
        category: ENUMS.CATEGORY.IT_EQUIPMENT,
        subcategory: "",
        model: "",
        manufacturer: "",
        departmentId: "",
        custodianStaffId: "",
        availableStatus: ENUMS.AVAILABLE_STATUS.AVAILABLE,
        currentCondition: ENUMS.CURRENT_CONDITION.NEW,
        locationName: "",
        roomOrArea: "",
        purchaseDate: "",
        warrantyExpiryDate: "",
        lastMaintenanceDate: "",
        nextMaintenanceDue: "",
        lastInventoryCheck: "",
        retirementDate: "",
        disposalDate: "",
        attachmentFileIds: [],
        isPublic: false,
        publicSummary: "",
        publicImages: "",
        publicLocationLabel: "",
        publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW,
      });

      setShowAddDialog(false);
      await loadAssets();
    } catch (error) {
      alert("Failed to create asset. Please try again.");
    }
  };

  const handleDeleteAsset = (asset) => {
    setAssetToDelete(asset);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;

    try {
      await assetsService.delete(assetToDelete.$id);
      await loadAssets();
      setShowDeleteDialog(false);
      setAssetToDelete(null);
    } catch (error) {
      alert("Failed to delete asset. Please try again.");
    }
  };

  const cancelDeleteAsset = () => {
    setShowDeleteDialog(false);
    setAssetToDelete(null);
  };

  /**
   * Export assets data to JSON file with comprehensive metadata
   *
   * This function provides two export modes:
   * 1. "Assets" - Exports ALL assets from the database
   * 2. "FilteredAssets" - Exports only the currently filtered/displayed assets
   *
   * Features:
   * - Includes metadata about the export (timestamp, user, filters applied)
   * - Proper error handling with user feedback
   * - Loading state management
   * - Memory cleanup after download
   * - Professional file naming with date stamps
   *
   * @param {string} type - Type of export ("Assets" | "FilteredAssets")
   * @returns {Promise<void>} - Promise that resolves when export is complete
   *
   * @example
   * // Export all assets
   * await exportAssetsData("Assets");
   *
   * // Export only filtered results
   * await exportAssetsData("FilteredAssets");
   */
  const exportAssetsData = async (type = "Assets") => {
    try {
      setExporting(true);

      let dataToExport = [];

      if (type === "FilteredAssets") {
        // Export only the currently filtered/displayed assets
        dataToExport = filteredAssets;
      } else {
        // Export all assets from the database
        const result = await assetsService.list();
        dataToExport = result.documents;
      }

      // Prepare the export data with additional metadata
      const exportData = {
        metadata: {
          exportType: type,
          exportedAt: new Date().toISOString(),
          totalAssets: dataToExport.length,
          exportedBy: staff?.name || "Unknown",
          filters: {
            searchTerm: searchTerm || null,
            category: filterCategory !== "all" ? filterCategory : null,
            status: filterStatus !== "all" ? filterStatus : null,
            condition: filterCondition !== "all" ? filterCondition : null,
          },
        },
        assets: dataToExport,
      };

      // Convert to JSON with proper formatting
      const jsonData = JSON.stringify(exportData, null, 2);

      // Create and download the file
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type.toLowerCase()}_export_${
        new Date().toISOString().split("T")[0]
      }.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Filter assets based on search and filters
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || asset.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || asset.availableStatus === filterStatus;
    const matchesCondition =
      filterCondition === "all" || asset.currentCondition === filterCondition;

    return (
      matchesSearch && matchesCategory && matchesStatus && matchesCondition
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Modern Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-1">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-sidebar-900 to-sidebar-900 bg-clip-text text-transparent">
                  Asset Management
                </h1>
                <p className="text-slate-600 font-medium">
                  Manage system assets, inventory, and equipment
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Export All Assets Button */}
              <Button
                onClick={() => exportAssetsData("Assets")}
                disabled={exporting}
                variant="outline"
                title="Export all assets from the database as JSON file"
                className="relative bg-white/90 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 ease-out group overflow-hidden hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center relative z-10">
                  <Download
                    className={`w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 ${
                      exporting ? "animate-spin" : ""
                    }`}
                  />
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    {exporting ? "Exporting..." : "Export All"}
                  </span>
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 bg-gray-100/50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              </Button>

              {/* Export Filtered Results Button - Only show if filters are applied */}
              {(searchTerm ||
                filterCategory !== "all" ||
                filterStatus !== "all" ||
                filterCondition !== "all") && (
                <Button
                  onClick={() => exportAssetsData("FilteredAssets")}
                  disabled={exporting}
                  variant="outline"
                  title="Export only the currently filtered/displayed assets as JSON file"
                  className="relative bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-700 transition-all duration-300 ease-out group overflow-hidden hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center relative z-10">
                    <Download
                      className={`w-4 h-4 mr-2 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 ${
                        exporting ? "animate-spin" : ""
                      }`}
                    />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                      {exporting ? "Exporting..." : "Export Filtered"}
                    </span>
                  </div>
                  {/* Ripple effect */}
                  <div className="absolute inset-0 bg-blue-100/50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                </Button>
              )}

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out group overflow-hidden hover:scale-105">
                    <div className="flex items-center justify-center relative z-10">
                      <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 group-hover:scale-110 transition-all duration-300" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                        Add Asset
                      </span>
                    </div>
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Ripple effect */}
                    <div className="absolute inset-0 bg-white/20 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -top-1 -left-1 w-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:w-full transition-all duration-500 ease-out" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader className="sticky top-0 bg-white border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle className="text-xl font-semibold">
                          Add New Asset
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 mt-1">
                          Create a new asset record in the system with detailed
                          information
                        </DialogDescription>
                      </div>
                      <DialogClose asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogHeader>

                  <div className="space-y-8 pb-4">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Basic Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="assetTag"
                            className="text-sm font-medium text-gray-700"
                          >
                            Asset Tag
                          </Label>
                          <Input
                            id="assetTag"
                            value={newAsset.assetTag}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                assetTag: e.target.value,
                              })
                            }
                            placeholder="Auto-generated if empty"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="name"
                            className="text-sm font-medium text-gray-700"
                          >
                            Asset Name *
                          </Label>
                          <Input
                            id="name"
                            value={newAsset.name}
                            onChange={(e) =>
                              setNewAsset({ ...newAsset, name: e.target.value })
                            }
                            placeholder="e.g., Dell Laptop XPS 13"
                            className="h-11"
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="category"
                            className="text-sm font-medium text-gray-700"
                          >
                            Category *
                          </Label>
                          <Select
                            value={newAsset.category}
                            onValueChange={(value) =>
                              setNewAsset({ ...newAsset, category: value })
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ENUMS.CATEGORY).map((category) => (
                                <SelectItem key={category} value={category}>
                                  {formatCategory(category)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="subcategory"
                            className="text-sm font-medium text-gray-700"
                          >
                            Subcategory
                          </Label>
                          <Input
                            id="subcategory"
                            value={newAsset.subcategory}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                subcategory: e.target.value,
                              })
                            }
                            placeholder="e.g., Laptop, Desktop, Server"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="serialNumber"
                            className="text-sm font-medium text-gray-700"
                          >
                            Serial Number
                          </Label>
                          <Input
                            id="serialNumber"
                            value={newAsset.serialNumber}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                serialNumber: e.target.value,
                              })
                            }
                            placeholder="e.g., ABC123456"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-blue-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Technical Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="model"
                            className="text-sm font-medium text-gray-700"
                          >
                            Model
                          </Label>
                          <Input
                            id="model"
                            value={newAsset.model}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                model: e.target.value,
                              })
                            }
                            placeholder="e.g., XPS-13-9310"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="manufacturer"
                            className="text-sm font-medium text-gray-700"
                          >
                            Manufacturer
                          </Label>
                          <Input
                            id="manufacturer"
                            value={newAsset.manufacturer}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                manufacturer: e.target.value,
                              })
                            }
                            placeholder="e.g., Dell Technologies"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Purchase & Warranty Information */}
                    <div className="bg-green-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Purchase & Warranty Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="purchaseDate"
                            className="text-sm font-medium text-gray-700"
                          >
                            Purchase Date
                          </Label>
                          <Input
                            id="purchaseDate"
                            type="datetime-local"
                            value={newAsset.purchaseDate}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                purchaseDate: e.target.value,
                              })
                            }
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="warrantyExpiryDate"
                            className="text-sm font-medium text-gray-700"
                          >
                            Warranty Expiry Date
                          </Label>
                          <Input
                            id="warrantyExpiryDate"
                            type="datetime-local"
                            value={newAsset.warrantyExpiryDate}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                warrantyExpiryDate: e.target.value,
                              })
                            }
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status & Location */}
                    <div className="bg-purple-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Status & Location
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="currentCondition"
                            className="text-sm font-medium text-gray-700"
                          >
                            Current Condition
                          </Label>
                          <Select
                            value={newAsset.currentCondition}
                            onValueChange={(value) =>
                              setNewAsset({
                                ...newAsset,
                                currentCondition: value,
                              })
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ENUMS.CURRENT_CONDITION).map(
                                (condition) => (
                                  <SelectItem key={condition} value={condition}>
                                    {condition.replace(/_/g, " ")}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="availableStatus"
                            className="text-sm font-medium text-gray-700"
                          >
                            Available Status
                          </Label>
                          <Select
                            value={newAsset.availableStatus}
                            onValueChange={(value) =>
                              setNewAsset({
                                ...newAsset,
                                availableStatus: value,
                              })
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ENUMS.AVAILABLE_STATUS).map(
                                (status) => (
                                  <SelectItem key={status} value={status}>
                                    {status.replace(/_/g, " ")}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="locationName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Location Name
                          </Label>
                          <Input
                            id="locationName"
                            value={newAsset.locationName}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                locationName: e.target.value,
                              })
                            }
                            placeholder="e.g., Building A"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="roomOrArea"
                            className="text-sm font-medium text-gray-700"
                          >
                            Room/Area
                          </Label>
                          <Input
                            id="roomOrArea"
                            value={newAsset.roomOrArea}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                roomOrArea: e.target.value,
                              })
                            }
                            placeholder="e.g., Room 101"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="publicLocationLabel"
                          className="text-sm font-medium text-gray-700"
                        >
                          Public Location Label
                        </Label>
                        <Input
                          id="publicLocationLabel"
                          value={newAsset.publicLocationLabel}
                          onChange={(e) =>
                            setNewAsset({
                              ...newAsset,
                              publicLocationLabel: e.target.value,
                            })
                          }
                          placeholder="e.g., Main Lab (visible to guests)"
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Public Information */}
                    <div className="bg-orange-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Public Information
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={newAsset.isPublic}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                isPublic: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <Label
                            htmlFor="isPublic"
                            className="text-sm font-medium text-gray-700"
                          >
                            Make this asset visible in guest portal
                          </Label>
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="publicSummary"
                            className="text-sm font-medium text-gray-700"
                          >
                            Public Summary
                          </Label>
                          <Textarea
                            id="publicSummary"
                            value={newAsset.publicSummary}
                            onChange={(e) =>
                              setNewAsset({
                                ...newAsset,
                                publicSummary: e.target.value,
                              })
                            }
                            placeholder="Brief description visible to guests and public viewers"
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label
                              htmlFor="publicConditionLabel"
                              className="text-sm font-medium text-gray-700"
                            >
                              Public Condition Label
                            </Label>
                            <Select
                              value={newAsset.publicConditionLabel}
                              onValueChange={(value) =>
                                setNewAsset({
                                  ...newAsset,
                                  publicConditionLabel: value,
                                })
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(
                                  ENUMS.PUBLIC_CONDITION_LABEL
                                ).map((condition) => (
                                  <SelectItem key={condition} value={condition}>
                                    {condition.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Asset Images Section */}
                    <div className="bg-gradient-to-br from-primary-50 to-sidebar-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <Image className="h-5 w-5 text-primary-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Asset Images
                        </h3>
                      </div>

                      <ImageUpload
                        assetId={newAsset.assetTag || "new_asset"}
                        existingImages={newAsset.publicImages || []}
                        onImagesChange={(newImages) => {
                          setNewAsset({ ...newAsset, publicImages: newImages });
                        }}
                        maxImages={10}
                      />
                    </div>
                  </div>

                  <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-6">
                    <div className="flex items-center justify-between w-full">
                      <p className="text-sm text-gray-500">
                        Fields marked with * are required
                      </p>
                      <div className="flex items-center space-x-3">
                        <DialogClose asChild>
                          <Button variant="outline" className="px-6">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          onClick={handleCreateAsset}
                          disabled={!newAsset.name || !newAsset.category}
                          className="px-6 bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Asset
                        </Button>
                      </div>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Modern Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Total Assets Card */}
            <Card className="bg-gradient-to-br from-sidebar-50 to-sidebar-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-sidebar-500/20 text-sidebar-600 border-sidebar-500/30">
                    Total
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900">
                    {assets.length}
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Assets
                  </p>
                  <p className="text-xs text-sidebar-600">
                    {
                      assets.filter(
                        (a) =>
                          a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE
                      ).length
                    }{" "}
                    available •{" "}
                    {
                      assets.filter(
                        (a) =>
                          a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE
                      ).length
                    }{" "}
                    in use
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Available Assets Card */}
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-primary-500/20 text-primary-600 border-primary-500/30">
                    Ready
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900">
                    {
                      assets.filter(
                        (a) =>
                          a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE
                      ).length
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Available
                  </p>
                  <p className="text-xs text-primary-600">
                    Ready for deployment
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* In Use Assets Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                    Active
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900">
                    {
                      assets.filter(
                        (a) =>
                          a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE
                      ).length
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-600">In Use</p>
                  <p className="text-xs text-orange-600">Currently assigned</p>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Assets Card */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
                    Alert
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900">
                    {
                      assets.filter(
                        (a) =>
                          a.availableStatus ===
                          ENUMS.AVAILABLE_STATUS.MAINTENANCE
                      ).length
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Maintenance
                  </p>
                  <p className="text-xs text-red-600">Needs attention</p>
                </div>
              </CardContent>
            </Card>

            {/* Staff Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                    Team
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900">5</div>
                  <p className="text-sm font-medium text-slate-600">Staff</p>
                  <p className="text-xs text-purple-600">2 departments</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Filters */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-6 relative z-20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Filters & Search
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Search Assets
                </Label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" />
                  <Input
                    placeholder="Search by name, tag, or serial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Category
                </Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 transition-all duration-200">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="z-30">
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.values(ENUMS.CATEGORY).map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 transition-all duration-200">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="z-30">
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Condition
                </Label>
                <Select
                  value={filterCondition}
                  onValueChange={setFilterCondition}
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 transition-all duration-200">
                    <SelectValue placeholder="All Conditions" />
                  </SelectTrigger>
                  <SelectContent className="z-30">
                    <SelectItem value="all">All Conditions</SelectItem>
                    {Object.values(ENUMS.CURRENT_CONDITION).map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Modern Assets Table */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden relative z-10">
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-xl shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Assets
                    </h2>
                    <p className="text-sm text-slate-600">
                      Manage and track all system assets
                    </p>
                  </div>
                </div>
                <Badge className="bg-sidebar-500/20 text-sidebar-600 border-sidebar-500/30 px-3 py-1">
                  {filteredAssets.length}{" "}
                  {filteredAssets.length === 1 ? "Asset" : "Assets"}
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Asset
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Images
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Category
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Condition
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Location
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Value
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6 text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset, index) => (
                      <TableRow
                        key={asset.$id}
                        className="hover:bg-gray-50/50 transition-colors duration-200 group border-b border-gray-100/50"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-sidebar-100 to-sidebar-200 rounded-lg group-hover:from-sidebar-200 group-hover:to-sidebar-300 transition-all duration-200">
                              <Package className="h-4 w-4 text-sidebar-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 group-hover:text-sidebar-700 transition-colors duration-200">
                                {asset.name}
                              </p>
                              {asset.serialNumber && (
                                <p className="text-sm text-slate-500">
                                  S/N: {asset.serialNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {(() => {
                            const imageUrls =
                              assetImageService.getAssetImageUrls(
                                asset.publicImages
                              );
                            return imageUrls.length > 0 ? (
                              <div className="flex items-center space-x-1">
                                <img
                                  src={imageUrls[0]}
                                  alt={asset.name}
                                  className="w-8 h-8 rounded object-cover border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div className="hidden w-8 h-8 bg-gray-100 rounded border border-gray-200 items-center justify-center">
                                  <Image className="w-4 h-4 text-gray-400" />
                                </div>
                                {imageUrls.length > 1 && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                                    +{imageUrls.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                <Image className="w-4 h-4 text-gray-400" />
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            variant="outline"
                            className="bg-sidebar-50 text-sidebar-700 border-sidebar-200 hover:bg-sidebar-100 transition-colors duration-200"
                          >
                            {formatCategory(asset.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            className={`${getStatusBadgeColor(
                              asset.availableStatus
                            )} shadow-sm`}
                          >
                            {asset.availableStatus.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            className={`${getConditionBadgeColor(
                              asset.currentCondition
                            )} shadow-sm`}
                          >
                            {asset.currentCondition.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-700">
                              {asset.locationName ||
                                asset.roomOrArea ||
                                "Not specified"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-500">-</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-sidebar-100 hover:text-sidebar-700 transition-all duration-200 group/btn"
                            >
                              <Link href={`/assets/${asset.$id}`}>
                                <Eye className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-primary-100 hover:text-primary-700 transition-all duration-200 group/btn"
                            >
                              <Link href={`/admin/assets/${asset.$id}/edit`}>
                                <Edit className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAsset(asset)}
                              className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 group/btn"
                            >
                              <Trash2 className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-slate-600">
                              No assets found
                            </p>
                            <p className="text-sm text-slate-400">
                              Try adjusting your search or filters
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowAddDialog(true)}
                            className="mt-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Asset
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
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
            className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto w-full m-4 hover:bg-white"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white !important",
              position: "relative",
              zIndex: 51,
            }}
          >
            <div
              className="flex flex-col items-center space-y-6 p-6 hover:bg-white"
              style={{
                backgroundColor: "white !important",
                position: "relative",
                zIndex: 52,
              }}
            >
              {/* Warning Icon */}
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>

              {/* Dialog Content */}
              <div className="text-center space-y-4 p-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Delete Asset
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this asset? This action cannot
                  be undone.
                </p>

                {/* Asset Details */}
                {assetToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {assetToDelete.name}
                        </p>
                        {assetToDelete.serialNumber && (
                          <p className="text-sm text-gray-500">
                            S/N: {assetToDelete.serialNumber}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {formatCategory(assetToDelete.category)}
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
        </div>
      )}
    </div>
  );
}

