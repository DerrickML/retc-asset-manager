"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
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
  ShoppingCart,
} from "lucide-react";
import {
  assetsService,
  departmentsService,
} from "../../../lib/appwrite/provider.js";
import { assetImageService } from "../../../lib/appwrite/image-service.js";
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js";
import { useToastContext } from "../../../components/providers/toast-provider";
import { useConfirmation } from "../../../components/ui/confirmation-dialog";
import { ENUMS } from "../../../lib/appwrite/config.js";
import { Query } from "appwrite";
import {
  formatCategory,
  getStatusBadgeColor,
  getConditionBadgeColor,
} from "../../../lib/utils/mappings.js";

export default function AdminConsumablesPage() {
  const router = useRouter();
  const toast = useToastContext();
  const { confirm } = useConfirmation();
  const [staff, setStaff] = useState(null);
  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [consumableToDelete, setConsumableToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Export functionality state
  const [exporting, setExporting] = useState(false);

  // Helper functions to extract stock data from stored fields
  const getCurrentStock = (consumable) => {
    if (
      consumable.serialNumber &&
      consumable.serialNumber.startsWith("STOCK:")
    ) {
      return parseInt(consumable.serialNumber.replace("STOCK:", "")) || 0;
    }
    return 0;
  };

  const getMinStock = (consumable) => {
    if (consumable.model && consumable.model.startsWith("MIN:")) {
      return parseInt(consumable.model.replace("MIN:", "")) || 0;
    }
    return 0;
  };

  const getMaxStock = (consumable) => {
    if (consumable.manufacturer && consumable.manufacturer.startsWith("MAX:")) {
      return parseInt(consumable.manufacturer.replace("MAX:", "")) || 0;
    }
    return 0;
  };

  const getStatus = (consumable) => {
    if (consumable.subcategory && consumable.subcategory.includes("|")) {
      return (
        consumable.subcategory.split("|")[1] || ENUMS.CONSUMABLE_STATUS.IN_STOCK
      );
    }
    return ENUMS.CONSUMABLE_STATUS.IN_STOCK;
  };

  const getUnit = (consumable) => {
    if (consumable.subcategory && consumable.subcategory.includes("|")) {
      return (
        consumable.subcategory.split("|")[0] || ENUMS.CONSUMABLE_UNIT.PIECE
      );
    }
    return consumable.subcategory || ENUMS.CONSUMABLE_UNIT.PIECE;
  };

  const getConsumableCategory = (consumable) => {
    if (consumable.subcategory && consumable.subcategory.includes("|")) {
      const parts = consumable.subcategory.split("|");
      return parts[2] || ENUMS.CATEGORY.OFFICE_SUPPLIES;
    }
    return ENUMS.CATEGORY.OFFICE_SUPPLIES;
  };

  // New consumable form state - matching Appwrite collection attributes
  const [newConsumable, setNewConsumable] = useState({
    name: "",
    category: ENUMS.CATEGORY.CONSUMABLE,
    consumableCategory: ENUMS.CATEGORY.OFFICE_SUPPLIES,
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: ENUMS.CONSUMABLE_UNIT.PIECE,
    status: ENUMS.CONSUMABLE_STATUS.IN_STOCK,
    locationName: "",
    roomOrArea: "",
    isPublic: false,
    publicSummary: "",
    itemType: ENUMS.ITEM_TYPE.CONSUMABLE,
    assetImage: "", // Will store the uploaded image URL
    selectedFile: null, // Store the selected file
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
      await loadConsumables();
    } catch (error) {
      // Silent fail for data loading
    } finally {
      setLoading(false);
    }
  };

  const loadConsumables = async () => {
    try {
      const result = await assetsService.getConsumables();
      setConsumables(result.documents);
    } catch (error) {
      // Silent fail for consumables loading
    }
  };

  const handleCreateConsumable = async () => {
    try {
      let imageUrl = "";

      // Upload image if one is selected
      if (newConsumable.selectedFile) {
        try {
          const uploadResult = await assetImageService.uploadImage(
            newConsumable.selectedFile,
            `consumable-${Date.now()}` // Use a temporary ID for the upload
          );
          imageUrl = assetImageService.getPublicImageUrl(uploadResult.$id);
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
          toast.error("Failed to upload image. Please try again.");
          return;
        }
      }

      // Prepare consumable data matching Appwrite collection schema
      const consumableData = {
        // Basic information - use existing ASSETS collection fields
        assetTag: `CONS-${Date.now()}`, // Generate unique tag for consumables
        name: newConsumable.name,
        category: ENUMS.CATEGORY.CONSUMABLE, // Use the correct CONSUMABLE category
        subcategory: `${newConsumable.unit}|${newConsumable.status}|${newConsumable.consumableCategory}`, // Store unit, status, and consumable category in subcategory
        itemType: ENUMS.ITEM_TYPE.CONSUMABLE,

        // Stock information - store in existing ASSETS fields
        // Store stock data in existing fields that aren't used by consumables
        serialNumber: `STOCK:${newConsumable.currentStock || 0}`, // Store current stock in serialNumber
        model: `MIN:${newConsumable.minStock || 0}`, // Store min stock in model
        manufacturer: `MAX:${newConsumable.maxStock || 0}`, // Store max stock in manufacturer

        // Location information
        locationName: newConsumable.locationName || "",
        roomOrArea: newConsumable.roomOrArea || "",

        // Public information
        isPublic: newConsumable.isPublic || false,
        publicSummary: newConsumable.publicSummary || "",
        publicImages: JSON.stringify([]), // Empty array as JSON string
        publicLocationLabel: "", // Empty string for consumables
        publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW, // Default for consumables

        // Required fields for ASSETS collection (already set above for stock data)
        departmentId: "", // Empty for consumables
        custodianStaffId: "", // Empty for consumables
        availableStatus: ENUMS.AVAILABLE_STATUS.AVAILABLE, // Default for consumables
        currentCondition: ENUMS.CURRENT_CONDITION.NEW, // Default for consumables
        purchaseDate: null, // Empty for consumables
        warrantyExpiryDate: null, // Empty for consumables
        lastMaintenanceDate: null, // Empty for consumables
        nextMaintenanceDue: null, // Empty for consumables
        lastInventoryCheck: null, // Empty for consumables
        retirementDate: null, // Empty for consumables
        disposalDate: null, // Empty for consumables
        attachmentFileIds: [], // Empty array for consumables
        assetImage: imageUrl, // Use uploaded image URL or empty string
      };

      console.log("Creating consumable with data:", consumableData);
      const result = await assetsService.create(consumableData, staff.$id);
      console.log("Consumable created successfully:", result);

      // Reset form and refresh consumables
      setNewConsumable({
        name: "",
        category: ENUMS.CATEGORY.CONSUMABLE,
        consumableCategory: ENUMS.CATEGORY.OFFICE_SUPPLIES,
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
        unit: ENUMS.CONSUMABLE_UNIT.PIECE,
        status: ENUMS.CONSUMABLE_STATUS.IN_STOCK,
        locationName: "",
        roomOrArea: "",
        isPublic: false,
        publicSummary: "",
        itemType: ENUMS.ITEM_TYPE.CONSUMABLE,
        assetImage: "",
        selectedFile: null,
      });

      setShowAddDialog(false);
      await loadConsumables();
      toast.success("Consumable created successfully!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to create consumable:", error);
      toast.error(
        `Failed to create consumable: ${error.message || "Please try again."}`
      );
    }
  };

  const handleDeleteConsumable = (consumable) => {
    setConsumableToDelete(consumable);
    setShowDeleteDialog(true);
  };

  const confirmDeleteConsumable = async () => {
    if (!consumableToDelete) return;

    try {
      await assetsService.delete(consumableToDelete.$id);
      await loadConsumables();
      setShowDeleteDialog(false);
      setConsumableToDelete(null);
      toast.success("Consumable deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete consumable. Please try again.");
    }
  };

  const cancelDeleteConsumable = () => {
    setShowDeleteDialog(false);
    setConsumableToDelete(null);
  };

  /**
   * Export consumables data to JSON file with comprehensive metadata
   */
  const exportConsumablesData = async (type = "Consumables") => {
    try {
      setExporting(true);

      let dataToExport = [];

      if (type === "FilteredConsumables") {
        // Export only the currently filtered/displayed consumables
        dataToExport = filteredConsumables;
      } else {
        // Export all consumables from the database
        const result = await assetsService.getConsumables();
        dataToExport = result.documents;
      }

      // Prepare the export data with additional metadata
      const exportData = {
        metadata: {
          exportType: type,
          exportedAt: new Date().toISOString(),
          totalConsumables: dataToExport.length,
          exportedBy: staff?.name || "Unknown",
          filters: {
            searchTerm: searchTerm || null,
            category: filterCategory !== "all" ? filterCategory : null,
            status: filterStatus !== "all" ? filterStatus : null,
          },
        },
        consumables: dataToExport,
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
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Filter consumables based on search and filters
  const filteredConsumables = consumables.filter((consumable) => {
    const matchesSearch =
      consumable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consumable.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" ||
      getConsumableCategory(consumable) === filterCategory;
    const matchesStatus =
      filterStatus === "all" || getStatus(consumable) === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
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
                  Consumable Management
                </h1>
                <p className="text-slate-600 font-medium">
                  Manage consumable inventory and stock levels
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Export All Consumables Button */}
              <Button
                onClick={() => exportConsumablesData("Consumables")}
                disabled={exporting}
                variant="outline"
                title="Export all consumables from the database as JSON file"
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
                filterStatus !== "all") && (
                <Button
                  onClick={() => exportConsumablesData("FilteredConsumables")}
                  disabled={exporting}
                  variant="outline"
                  title="Export only the currently filtered/displayed consumables as JSON file"
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
                        Add Consumable
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
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader className="sticky top-0 bg-white border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle className="text-xl font-semibold">
                          Add New Consumable
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 mt-1">
                          Create a new consumable item in the system with
                          detailed information
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

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="name"
                            className="text-sm font-medium text-gray-700"
                          >
                            Consumable Name *
                          </Label>
                          <Input
                            id="name"
                            value={newConsumable.name}
                            onChange={(e) =>
                              setNewConsumable({
                                ...newConsumable,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g., A4 Paper, Office Pens"
                            className="h-11"
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="consumableCategory"
                            className="text-sm font-medium text-gray-700"
                          >
                            Category *
                          </Label>
                          <Select
                            value={newConsumable.consumableCategory}
                            onValueChange={(value) =>
                              setNewConsumable({
                                ...newConsumable,
                                consumableCategory: value,
                              })
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
                    </div>

                    {/* Stock Information */}
                    <div className="bg-blue-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Stock Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label
                            htmlFor="currentStock"
                            className="text-sm font-medium text-gray-700"
                          >
                            Current Stock *
                          </Label>
                          <Input
                            id="currentStock"
                            type="number"
                            value={newConsumable.currentStock}
                            onChange={(e) =>
                              setNewConsumable({
                                ...newConsumable,
                                currentStock: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="h-11"
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="minStock"
                            className="text-sm font-medium text-gray-700"
                          >
                            Minimum Stock
                          </Label>
                          <Input
                            id="minStock"
                            type="number"
                            value={newConsumable.minStock}
                            onChange={(e) =>
                              setNewConsumable({
                                ...newConsumable,
                                minStock: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="unit"
                            className="text-sm font-medium text-gray-700"
                          >
                            Unit *
                          </Label>
                          <Select
                            value={newConsumable.unit}
                            onValueChange={(value) =>
                              setNewConsumable({
                                ...newConsumable,
                                unit: value,
                              })
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ENUMS.CONSUMABLE_UNIT).map(
                                (unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {formatCategory(unit)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
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
                            htmlFor="status"
                            className="text-sm font-medium text-gray-700"
                          >
                            Status
                          </Label>
                          <Select
                            value={newConsumable.status}
                            onValueChange={(value) =>
                              setNewConsumable({
                                ...newConsumable,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ENUMS.CONSUMABLE_STATUS).map(
                                (status) => (
                                  <SelectItem key={status} value={status}>
                                    {formatCategory(status)}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="locationName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Location Name
                          </Label>
                          <Input
                            id="locationName"
                            value={newConsumable.locationName}
                            onChange={(e) =>
                              setNewConsumable({
                                ...newConsumable,
                                locationName: e.target.value,
                              })
                            }
                            placeholder="e.g., Storage Room A"
                            className="h-11"
                          />
                        </div>
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
                          value={newConsumable.roomOrArea}
                          onChange={(e) =>
                            setNewConsumable({
                              ...newConsumable,
                              roomOrArea: e.target.value,
                            })
                          }
                          placeholder="e.g., Shelf 1, Cabinet B"
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bg-green-50 p-6 rounded-lg space-y-6">
                      <div className="flex items-center space-x-2">
                        <Image className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Image
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="assetImage"
                          className="text-sm font-medium text-gray-700"
                        >
                          Consumable Image
                        </Label>
                        <Input
                          id="assetImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setNewConsumable({
                                ...newConsumable,
                                selectedFile: file,
                                assetImage: file.name, // Show file name in UI
                              });
                            }
                          }}
                          className="h-11"
                        />
                        <p className="text-xs text-gray-500">
                          Upload an image for this consumable (optional)
                        </p>
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
                            checked={newConsumable.isPublic}
                            onChange={(e) =>
                              setNewConsumable({
                                ...newConsumable,
                                isPublic: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <Label
                            htmlFor="isPublic"
                            className="text-sm font-medium text-gray-700"
                          >
                            Make this consumable visible in guest portal
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
                            value={newConsumable.publicSummary}
                            onChange={(e) =>
                              setNewConsumable({
                                ...newConsumable,
                                publicSummary: e.target.value,
                              })
                            }
                            placeholder="Brief description visible to guests and public viewers"
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                      </div>
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
                          onClick={handleCreateConsumable}
                          disabled={
                            !newConsumable.name ||
                            !newConsumable.consumableCategory
                          }
                          className="px-6 bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Consumable
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
            {/* Total Consumables Card */}
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
                    {consumables.length}
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Consumables
                  </p>
                  <p className="text-xs text-sidebar-600">
                    {
                      consumables.filter(
                        (c) => getStatus(c) === ENUMS.CONSUMABLE_STATUS.IN_STOCK
                      ).length
                    }{" "}
                    in stock •{" "}
                    {
                      consumables.filter(
                        (c) =>
                          getStatus(c) === ENUMS.CONSUMABLE_STATUS.LOW_STOCK
                      ).length
                    }{" "}
                    low stock
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* In Stock Card */}
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
                      consumables.filter(
                        (c) => getStatus(c) === ENUMS.CONSUMABLE_STATUS.IN_STOCK
                      ).length
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-600">In Stock</p>
                  <p className="text-xs text-primary-600">Available for use</p>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                    Alert
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900">
                    {
                      consumables.filter(
                        (c) =>
                          getStatus(c) === ENUMS.CONSUMABLE_STATUS.LOW_STOCK
                      ).length
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Low Stock
                  </p>
                  <p className="text-xs text-orange-600">Needs restocking</p>
                </div>
              </CardContent>
            </Card>

            {/* Out of Stock Card */}
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
                      consumables.filter(
                        (c) =>
                          getStatus(c) === ENUMS.CONSUMABLE_STATUS.OUT_OF_STOCK
                      ).length
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Out of Stock
                  </p>
                  <p className="text-xs text-red-600">
                    Needs immediate attention
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Categories Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                    Types
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900">
                    {
                      new Set(consumables.map((c) => getConsumableCategory(c)))
                        .size
                    }
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Categories
                  </p>
                  <p className="text-xs text-purple-600">Different types</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Search Consumables
                </Label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200" />
                  <Input
                    placeholder="Search by name or category..."
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
                    {Object.values(ENUMS.CONSUMABLE_STATUS).map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatCategory(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Modern Consumables Table */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl overflow-hidden relative z-10">
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-xl shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Consumables
                    </h2>
                    <p className="text-sm text-slate-600">
                      Manage and track all consumable inventory
                    </p>
                  </div>
                </div>
                <Badge className="bg-sidebar-500/20 text-sidebar-600 border-sidebar-500/30 px-3 py-1">
                  {filteredConsumables.length}{" "}
                  {filteredConsumables.length === 1
                    ? "Consumable"
                    : "Consumables"}
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Consumable
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Image
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Category
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Stock
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6">
                      Location
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 py-4 px-6 text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsumables.length > 0 ? (
                    filteredConsumables.map((consumable, index) => (
                      <TableRow
                        key={consumable.$id}
                        className="hover:bg-gray-50/50 transition-colors duration-200 group border-b border-gray-100/50"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-sidebar-100 to-sidebar-200 rounded-lg group-hover:from-sidebar-200 group-hover:to-sidebar-300 transition-all duration-200">
                              <Package className="h-4 w-4 text-sidebar-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 group-hover:text-sidebar-700 transition-colors duration-200">
                                {consumable.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {formatCategory(getUnit(consumable))}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {consumable.assetImage ? (
                            <div className="flex items-center space-x-1">
                              <img
                                src={consumable.assetImage}
                                alt={consumable.name}
                                className="w-8 h-8 rounded object-cover border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div className="hidden w-8 h-8 bg-gray-100 rounded border border-gray-200 items-center justify-center">
                                <Image className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <Image className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            variant="outline"
                            className="bg-sidebar-50 text-sidebar-700 border-sidebar-200 hover:bg-sidebar-100 transition-colors duration-200"
                          >
                            {formatCategory(getConsumableCategory(consumable))}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-900">
                              {getCurrentStock(consumable)}
                            </span>
                            {getMinStock(consumable) > 0 && (
                              <span className="text-sm text-slate-500">
                                (min: {getMinStock(consumable)})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            className={`${
                              getStatus(consumable) ===
                              ENUMS.CONSUMABLE_STATUS.IN_STOCK
                                ? "bg-green-100 text-green-700 border-green-200"
                                : getStatus(consumable) ===
                                  ENUMS.CONSUMABLE_STATUS.LOW_STOCK
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : getStatus(consumable) ===
                                  ENUMS.CONSUMABLE_STATUS.OUT_OF_STOCK
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            } shadow-sm`}
                          >
                            {getStatus(consumable).replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-700">
                              {consumable.locationName ||
                                consumable.roomOrArea ||
                                "Not specified"}
                            </span>
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
                              <Link
                                href={`/admin/consumables/${consumable.$id}`}
                              >
                                <Eye className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-primary-100 hover:text-primary-700 transition-all duration-200 group/btn"
                            >
                              <Link
                                href={`/admin/consumables/${consumable.$id}/edit`}
                              >
                                <Edit className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-200" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteConsumable(consumable)}
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
                              No consumables found
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
                            Add First Consumable
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
          onClick={cancelDeleteConsumable}
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
                  Delete Consumable
                </h3>
                <p className="text-gray-600">
                  Are you sure you want to delete this consumable? This action
                  cannot be undone.
                </p>

                {/* Consumable Details */}
                {consumableToDelete && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {consumableToDelete.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCategory(
                            getConsumableCategory(consumableToDelete)
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock: {getCurrentStock(consumableToDelete)}{" "}
                          {formatCategory(getUnit(consumableToDelete))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 w-full pt-4">
                  <Button
                    onClick={cancelDeleteConsumable}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteConsumable}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Consumable
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-primary-900/20 to-sidebar-900/20 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-[10000] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Success Content */}
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>

              {/* Success Message */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Success!
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                Consumable created successfully!
              </p>

              {/* Action Button */}
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
