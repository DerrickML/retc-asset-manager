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
  Image,
  CheckCircle,
  X,
} from "lucide-react";
import {
  assetsService,
  assetEventsService,
} from "../../../../../lib/appwrite/provider.js";
import { assetImageService } from "../../../../../lib/appwrite/image-service.js";
import { getCurrentStaff, permissions } from "../../../../../lib/utils/auth.js";
import { useToastContext } from "../../../../../components/providers/toast-provider";
// Removed useConfirmation import - using custom dialog instead
import { ENUMS } from "../../../../../lib/appwrite/config.js";
import {
  formatCategory,
  getStatusBadgeColor,
  getConditionBadgeColor,
} from "../../../../../lib/utils/mappings.js";

export default function EditConsumable() {
  const params = useParams();
  const router = useRouter();
  const toast = useToastContext();
  // Custom delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staff, setStaff] = useState(null);
  const [consumable, setConsumable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalConsumable, setOriginalConsumable] = useState(null);
  const [consumableId, setConsumableId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper functions to extract data from mapped fields
  const getCurrentStock = (consumable) => {
    if (
      consumable?.serialNumber &&
      consumable.serialNumber.startsWith("STOCK:")
    ) {
      return parseInt(consumable.serialNumber.replace("STOCK:", "")) || 0;
    }
    return 0;
  };

  const getMinStock = (consumable) => {
    if (consumable?.model && consumable.model.startsWith("MIN:")) {
      return parseInt(consumable.model.replace("MIN:", "")) || 0;
    }
    return 0;
  };

  const getMaxStock = (consumable) => {
    if (
      consumable?.manufacturer &&
      consumable.manufacturer.startsWith("MAX:")
    ) {
      return parseInt(consumable.manufacturer.replace("MAX:", "")) || 0;
    }
    return 0;
  };

  const getStatus = (consumable) => {
    if (consumable?.subcategory && consumable.subcategory.includes("|")) {
      return (
        consumable.subcategory.split("|")[1] || ENUMS.CONSUMABLE_STATUS.IN_STOCK
      );
    }
    return ENUMS.CONSUMABLE_STATUS.IN_STOCK;
  };

  const getUnit = (consumable) => {
    if (consumable?.subcategory && consumable.subcategory.includes("|")) {
      return (
        consumable.subcategory.split("|")[0] || ENUMS.CONSUMABLE_UNIT.PIECE
      );
    }
    return consumable?.subcategory || ENUMS.CONSUMABLE_UNIT.PIECE;
  };

  const getConsumableCategory = (consumable) => {
    if (consumable?.subcategory && consumable.subcategory.includes("|")) {
      const parts = consumable.subcategory.split("|");
      return parts[2] || ENUMS.CATEGORY.OFFICE_SUPPLIES;
    }
    return ENUMS.CATEGORY.OFFICE_SUPPLIES;
  };

  useEffect(() => {
    // For Next.js 15, params is already unwrapped in the component
    if (params?.id) {
      setConsumableId(params.id);
      checkPermissionsAndLoadConsumable(params.id);
    }
  }, [params]);

  const checkPermissionsAndLoadConsumable = async (id) => {
    try {
      const currentStaff = await getCurrentStaff();
      if (!currentStaff || !permissions.canManageAssets(currentStaff)) {
        window.location.href = "/unauthorized";
        return;
      }
      setStaff(currentStaff);
      await loadConsumable(id);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConsumable = async (id) => {
    try {
      const consumableData = await assetsService.get(id);
      if (!consumableData) {
        router.push("/admin/consumables");
        return;
      }

      // Process the consumable data to extract mapped fields
      const processedConsumable = {
        ...consumableData,
        // Extract stock data from mapped fields
        currentStock: getCurrentStock(consumableData),
        minStock: getMinStock(consumableData),
        maxStock: getMaxStock(consumableData),
        status: getStatus(consumableData),
        unit: getUnit(consumableData),
        consumableCategory: getConsumableCategory(consumableData),
      };

      setConsumable(processedConsumable);
      setOriginalConsumable(processedConsumable);
    } catch (error) {
      console.error("Failed to load consumable:", error);
      router.push("/admin/consumables");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare the updated data - map back to ASSETS collection fields
      // Filter out Appwrite metadata fields that shouldn't be sent in updates
      const {
        $id,
        $createdAt,
        $updatedAt,
        $databaseId,
        $collectionId,
        $permissions,
        ...consumableData
      } = consumable;

      // Use the EXACT same data structure as the creation form
      const updatedConsumable = {
        // Basic information - use existing ASSETS collection fields
        assetTag: consumableData.assetTag || `CONS-${Date.now()}`,
        name: consumable.name,
        category: ENUMS.CATEGORY.CONSUMABLE, // Use the correct CONSUMABLE category
        subcategory: `${consumable.unit}|${consumable.status}|${consumable.consumableCategory}`, // Store unit, status, and consumable category in subcategory
        itemType: ENUMS.ITEM_TYPE.CONSUMABLE,

        // Stock information - store in existing ASSETS fields
        serialNumber: `STOCK:${consumable.currentStock || 0}`, // Store current stock in serialNumber
        model: `MIN:${consumable.minStock || 0}`, // Store min stock in model
        manufacturer: `MAX:${consumable.maxStock || 0}`, // Store max stock in manufacturer

        // Location information
        locationName: consumable.locationName || "",
        roomOrArea: consumable.roomOrArea || "",

        // Public information
        isPublic: consumable.isPublic || false,
        publicSummary: consumable.publicSummary || "",
        publicImages: JSON.stringify([]), // Empty array as JSON string
        publicLocationLabel: "", // Empty string for consumables
        publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW, // Default for consumables

        // Required fields for ASSETS collection
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
        assetImage: consumable.assetImage || "", // Use existing image or empty string
      };

      // Log the data being sent for debugging
      // Preparing consumable data for update

      // Track changes for audit trail
      const changes = [];
      Object.keys(updatedConsumable).forEach((key) => {
        if (
          originalConsumable[key] !== updatedConsumable[key] &&
          key !== "currentStock" && // Skip these as they're derived fields
          key !== "minStock" &&
          key !== "maxStock" &&
          key !== "status" &&
          key !== "unit" &&
          key !== "consumableCategory"
        ) {
          changes.push({
            field: key,
            from: originalConsumable[key],
            to: updatedConsumable[key],
          });
        }
      });

      // Update the consumable
      await assetsService.update(
        consumableId,
        updatedConsumable,
        staff.$id,
        "Consumable updated"
      );

      // Log changes as asset events
      for (const change of changes) {
        try {
          // Convert values to strings and truncate if too long
          const fromValue = String(change.from || "").substring(0, 100);
          const toValue = String(change.to || "").substring(0, 100);

          await assetEventsService.create({
            assetId: consumableId,
            eventType: ENUMS.EVENT_TYPE.STATUS_CHANGED,
            fromValue: fromValue,
            toValue: toValue,
            actorStaffId: staff.$id,
            at: new Date().toISOString(),
            notes: `Updated ${change.field}`,
          });
        } catch (eventError) {
          console.error("Failed to log asset event:", eventError);
        }
      }

      // Refresh the consumable data
      await loadConsumable(consumableId);
      toast.success("Consumable updated successfully!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to update consumable:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
      });
      toast.error(
        `Failed to update consumable: ${error.message || "Please try again."}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteConsumable = async () => {
    try {
      await assetsService.delete(consumableId);
      toast.success("Consumable deleted successfully!");
      router.push("/admin/consumables");
    } catch (error) {
      toast.error("Failed to delete consumable. Please try again.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const cancelDeleteConsumable = () => {
    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!consumable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Consumable not found
          </h2>
          <p className="text-gray-600">
            The consumable you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/consumables">Back to Consumables</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 transition-colors duration-200"
              >
                <Link href="/admin/consumables">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Consumables
                </Link>
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-sidebar-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-sidebar-600 bg-clip-text text-transparent">
                    Edit Consumable
                  </h1>
                  <p className="text-gray-600 font-medium">{consumable.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                asChild
                variant="outline"
                className="border-sidebar-200 text-sidebar-600 hover:bg-sidebar-50 transition-all duration-200"
              >
                <Link href={`/admin/consumables/${consumable.$id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200"
              >
                <Link href={`/admin/consumables/${consumable.$id}/history`}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </Link>
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Current Status */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-sidebar-500 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <CheckCircle className="w-6 h-6 mr-3" />
              Current Status
            </h2>
            <p className="text-primary-100 mt-1">
              Overview of consumable details
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-primary-700">
                    Status
                  </Label>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                </div>
                <Badge
                  className={
                    consumable.status === ENUMS.CONSUMABLE_STATUS.IN_STOCK
                      ? "bg-green-500 text-white border-0 text-sm font-semibold px-3 py-1"
                      : consumable.status === ENUMS.CONSUMABLE_STATUS.LOW_STOCK
                      ? "bg-yellow-500 text-white border-0 text-sm font-semibold px-3 py-1"
                      : consumable.status ===
                        ENUMS.CONSUMABLE_STATUS.OUT_OF_STOCK
                      ? "bg-red-500 text-white border-0 text-sm font-semibold px-3 py-1"
                      : "bg-gray-500 text-white border-0 text-sm font-semibold px-3 py-1"
                  }
                >
                  {consumable.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-sidebar-50 to-sidebar-100 rounded-xl p-4 border border-sidebar-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-sidebar-700">
                    Category
                  </Label>
                  <Package className="w-4 h-4 text-sidebar-500" />
                </div>
                <Badge className="bg-sidebar-500 text-white border-0 text-sm font-semibold px-3 py-1">
                  {formatCategory(consumable.consumableCategory)}
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Unit
                  </Label>
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                </div>
                <Badge className="bg-gray-500 text-white border-0 text-sm font-semibold px-3 py-1">
                  {formatCategory(consumable.unit)}
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-primary-700">
                    Current Stock
                  </Label>
                  <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                </div>
                <div className="text-2xl font-bold text-primary-700">
                  {consumable.currentStock}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Basic Information */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-sidebar-500 to-sidebar-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Package className="w-5 h-5 mr-3" />
                Basic Information
              </h3>
              <p className="text-sidebar-100 text-sm mt-1">
                Core consumable details
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-sm font-semibold text-gray-700"
                >
                  Consumable Name *
                </Label>
                <Input
                  id="name"
                  value={consumable.name}
                  onChange={(e) =>
                    setConsumable({ ...consumable, name: e.target.value })
                  }
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl"
                  placeholder="Enter consumable name"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="consumableCategory"
                  className="text-sm font-semibold text-gray-700"
                >
                  Category
                </Label>
                <Select
                  value={consumable.consumableCategory}
                  onValueChange={(value) =>
                    setConsumable({ ...consumable, consumableCategory: value })
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
                  htmlFor="unit"
                  className="text-sm font-semibold text-gray-700"
                >
                  Unit
                </Label>
                <Select
                  value={consumable.unit}
                  onValueChange={(value) =>
                    setConsumable({ ...consumable, unit: value })
                  }
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-gray-200 shadow-xl">
                    {Object.values(ENUMS.CONSUMABLE_UNIT).map((unit) => (
                      <SelectItem
                        key={unit}
                        value={unit}
                        className="rounded-lg"
                      >
                        {formatCategory(unit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  value={consumable.publicSummary || ""}
                  onChange={(e) =>
                    setConsumable({
                      ...consumable,
                      publicSummary: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Brief description visible to guests"
                  className="border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Stock Management */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-3" />
                Stock Management
              </h3>
              <p className="text-primary-100 text-sm mt-1">
                Inventory and stock levels
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="currentStock"
                  className="text-sm font-semibold text-gray-700"
                >
                  Current Stock *
                </Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={consumable.currentStock}
                  onChange={(e) =>
                    setConsumable({
                      ...consumable,
                      currentStock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl text-lg font-semibold"
                  placeholder="Enter current stock"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label
                    htmlFor="minStock"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Minimum Stock
                  </Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={consumable.minStock}
                    onChange={(e) =>
                      setConsumable({
                        ...consumable,
                        minStock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-12 border-2 border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-200 rounded-xl"
                    placeholder="Min stock"
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="maxStock"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Maximum Stock
                  </Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={consumable.maxStock}
                    onChange={(e) =>
                      setConsumable({
                        ...consumable,
                        maxStock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-200 rounded-xl"
                    placeholder="Max stock"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="status"
                  className="text-sm font-semibold text-gray-700"
                >
                  Status
                </Label>
                <Select
                  value={consumable.status}
                  onValueChange={(value) =>
                    setConsumable({ ...consumable, status: value })
                  }
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-gray-200 shadow-xl">
                    {Object.values(ENUMS.CONSUMABLE_STATUS).map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="rounded-lg"
                      >
                        {status.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Enhanced Location Information */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-sidebar-500 to-sidebar-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Package className="w-5 h-5 mr-3" />
                Location Information
              </h3>
              <p className="text-sidebar-100 text-sm mt-1">
                Storage and visibility settings
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="locationName"
                  className="text-sm font-semibold text-gray-700"
                >
                  Location Name
                </Label>
                <Input
                  id="locationName"
                  value={consumable.locationName || ""}
                  onChange={(e) =>
                    setConsumable({
                      ...consumable,
                      locationName: e.target.value,
                    })
                  }
                  placeholder="e.g., Main Store, Warehouse A"
                  className="h-12 border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="roomOrArea"
                  className="text-sm font-semibold text-gray-700"
                >
                  Room/Area
                </Label>
                <Input
                  id="roomOrArea"
                  value={consumable.roomOrArea || ""}
                  onChange={(e) =>
                    setConsumable({ ...consumable, roomOrArea: e.target.value })
                  }
                  placeholder="e.g., Shelf 1, Cabinet B"
                  className="h-12 border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="isPublic"
                  className="text-sm font-semibold text-gray-700"
                >
                  Public Visibility
                </Label>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={consumable.isPublic || false}
                    onChange={(e) =>
                      setConsumable({
                        ...consumable,
                        isPublic: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <Label
                    htmlFor="isPublic"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Make this consumable visible in guest portal
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Image Management */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Image className="w-5 h-5 mr-3" />
                Image Management
              </h3>
              <p className="text-gray-100 text-sm mt-1">
                Visual representation
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Current Image
                </Label>
                {consumable.assetImage ? (
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <img
                      src={consumable.assetImage}
                      alt={consumable.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-green-300 shadow-lg"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-20 h-20 bg-gray-100 rounded-xl border-2 border-gray-200 items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-sm text-green-700 font-medium">
                      ✓ Image uploaded successfully
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                💡 To update the image, please use the main consumable
                management page.
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Internal Notes */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Package className="w-5 h-5 mr-3" />
              Internal Notes
            </h3>
            <p className="text-primary-100 text-sm mt-1">
              Internal comments and notes (not visible to guests)
            </p>
          </div>
          <div className="p-6">
            <Textarea
              value={consumable.notes || ""}
              onChange={(e) =>
                setConsumable({ ...consumable, notes: e.target.value })
              }
              rows={4}
              placeholder="Add internal notes and comments..."
              className="border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all duration-200 rounded-xl resize-none"
            />
          </div>
        </div>

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
                  Consumable updated successfully!
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
                      Delete Consumable
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
                  Are you sure you want to delete this consumable?
                </h3>
                <p className="text-gray-600">
                  This action will permanently remove the consumable and all its
                  data.
                </p>

                {/* Consumable Details */}
                {consumable && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {consumable.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCategory(consumable.consumableCategory)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock: {consumable.currentStock}{" "}
                          {formatCategory(consumable.unit)}
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
        )}
      </div>
    </div>
  );
}
