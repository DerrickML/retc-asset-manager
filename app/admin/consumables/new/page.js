"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { ImageUpload } from "../../../../components/ui/image-upload";
import {
  ArrowLeft,
  Package,
  Save,
  Info,
  MapPin,
  BarChart3,
  Image,
  Eye,
} from "lucide-react";
import { getCurrentStaff, permissions } from "../../../../lib/utils/auth.js";
import { assetsService } from "../../../../lib/appwrite/provider.js";
import { useToastContext } from "../../../../components/providers/toast-provider";
import { ENUMS } from "../../../../lib/appwrite/config.js";
import { formatCategory } from "../../../../lib/utils/mappings.js";

export default function NewConsumablePage() {
  const router = useRouter();
  const toast = useToastContext();
  const [currentStaff, setCurrentStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Manual ID assignment state
  const [manualIdAssignment, setManualIdAssignment] = useState(false);

  // Consumable form state
  const [consumable, setConsumable] = useState({
    assetTag: "",
    name: "",
    consumableCategory: ENUMS.CONSUMABLE_CATEGORY.FLIERS,
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: ENUMS.CONSUMABLE_UNIT.PIECE,
    locationName: "",
    roomOrArea: "",
    isPublic: false,
    publicSummary: "",
    publicImages: [],
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const staff = await getCurrentStaff();
      setCurrentStaff(staff);

      if (!staff || !permissions.canManageAssets(staff)) {
        router.push("/unauthorized");
        return;
      }
    } catch (error) {
      console.error("Failed to check permissions:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare consumable data
      const consumableData = {
        assetTag:
          manualIdAssignment && consumable.assetTag
            ? consumable.assetTag
            : `CONS-${Date.now()}`,
        name: consumable.name,
        category: ENUMS.CATEGORY.CONSUMABLE,
        subcategory: consumable.consumableCategory,
        itemType: ENUMS.ITEM_TYPE.CONSUMABLE,

        // Stock information - use new proper database fields
        currentStock: consumable.currentStock || 0,
        minimumStock: consumable.minStock || 0,
        unit: consumable.unit,

        // Legacy fields - keep empty for backward compatibility
        serialNumber: "",
        model: "",
        manufacturer: "",

        // Location information
        locationName: consumable.locationName || "",
        roomOrArea: consumable.roomOrArea || "",

        // Public information
        isPublic: consumable.isPublic || false,
        publicSummary: consumable.publicSummary || "",
        publicImages: JSON.stringify(consumable.publicImages || []),
        publicLocationLabel: "",
        publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW,
        assetImage:
          consumable.publicImages && consumable.publicImages.length > 0
            ? `https://appwrite.nrep.ug/v1/storage/buckets/68a2fbbc002e7db3db22/files/${consumable.publicImages[0]}/view?project=${
                process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
                "6745fd58001e7fcbf850"
              }`
            : "",

        // Required fields for ASSETS collection
        departmentId: "",
        custodianStaffId: "",
        availableStatus: ENUMS.AVAILABLE_STATUS.AVAILABLE,
        currentCondition: ENUMS.CURRENT_CONDITION.NEW,
        purchaseDate: null,
        warrantyExpiryDate: null,
        lastMaintenanceDate: null,
        nextMaintenanceDue: null,
        lastInventoryCheck: null,
        retirementDate: null,
        disposalDate: null,
        attachmentFileIds: [],
      };

      await assetsService.create(consumableData, currentStaff.$id);

      toast.success("Consumable created successfully!");

      // Redirect to consumables list
      setTimeout(() => {
        router.push("/admin/consumables");
      }, 500);
    } catch (error) {
      console.error("Failed to create consumable:", error);
      toast.error("Failed to create consumable. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-600 font-medium">Loading...</p>
      </div>
    );
  }

  if (!currentStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Clean Header */}
        <div className="space-y-6">
          <Button
            asChild
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 -ml-2"
          >
            <Link href="/admin/consumables">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Consumables
            </Link>
          </Button>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Add New Consumable
                </h1>
                <p className="text-slate-600 mt-1">
                  Create a new consumable item for inventory management
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Basic Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              {/* Manual ID Assignment */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id="manualIdAssignment"
                    checked={manualIdAssignment}
                    onChange={(e) => {
                      setManualIdAssignment(e.target.checked);
                      if (!e.target.checked) {
                        setConsumable({ ...consumable, assetTag: "" });
                      }
                    }}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                  />
                  <Label
                    htmlFor="manualIdAssignment"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Manually assign consumable ID
                  </Label>
                </div>

                {manualIdAssignment && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="assetTag" className="text-sm font-medium text-slate-700">
                      Consumable ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="assetTag"
                      value={consumable.assetTag}
                      onChange={(e) =>
                        setConsumable({ ...consumable, assetTag: e.target.value })
                      }
                      placeholder="e.g., CONS-PAPER-001"
                      className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                      required={manualIdAssignment}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Consumable Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={consumable.name}
                    onChange={(e) =>
                      setConsumable({ ...consumable, name: e.target.value })
                    }
                    placeholder="e.g., A4 Paper, Office Pens"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumableCategory" className="text-sm font-medium text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={consumable.consumableCategory}
                    onValueChange={(value) =>
                      setConsumable({ ...consumable, consumableCategory: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ENUMS.CONSUMABLE_CATEGORY).map((category) => (
                        <SelectItem key={category} value={category}>
                          {formatCategory(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium text-slate-700">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={consumable.unit}
                    onValueChange={(value) =>
                      setConsumable({ ...consumable, unit: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ENUMS.CONSUMABLE_UNIT).map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {formatCategory(unit)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Management */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Stock Management
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentStock" className="text-sm font-medium text-slate-700">
                    Current Stock
                  </Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="0"
                    value={consumable.currentStock}
                    onChange={(e) =>
                      setConsumable({
                        ...consumable,
                        currentStock: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock" className="text-sm font-medium text-slate-700">
                    Minimum Stock
                  </Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={consumable.minStock}
                    onChange={(e) =>
                      setConsumable({
                        ...consumable,
                        minStock: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-slate-500">Reorder threshold</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStock" className="text-sm font-medium text-slate-700">
                    Maximum Stock
                  </Label>
                  <Input
                    id="maxStock"
                    type="number"
                    min="0"
                    value={consumable.maxStock}
                    onChange={(e) =>
                      setConsumable({
                        ...consumable,
                        maxStock: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-slate-500">Maximum capacity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Location Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="locationName" className="text-sm font-medium text-slate-700">
                    Location Name
                  </Label>
                  <Input
                    id="locationName"
                    value={consumable.locationName}
                    onChange={(e) =>
                      setConsumable({
                        ...consumable,
                        locationName: e.target.value,
                      })
                    }
                    placeholder="e.g., Storage Room A, Main Warehouse"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomOrArea" className="text-sm font-medium text-slate-700">
                    Room/Area
                  </Label>
                  <Input
                    id="roomOrArea"
                    value={consumable.roomOrArea}
                    onChange={(e) =>
                      setConsumable({ ...consumable, roomOrArea: e.target.value })
                    }
                    placeholder="e.g., Shelf 1, Cabinet B"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Visibility */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Public Visibility
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={consumable.isPublic}
                  onChange={(e) =>
                    setConsumable({ ...consumable, isPublic: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                />
                <Label htmlFor="isPublic" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Make this consumable visible in guest portal
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicSummary" className="text-sm font-medium text-slate-700">
                  Public Summary
                </Label>
                <Textarea
                  id="publicSummary"
                  value={consumable.publicSummary}
                  onChange={(e) =>
                    setConsumable({
                      ...consumable,
                      publicSummary: e.target.value,
                    })
                  }
                  placeholder="Brief description visible to guests"
                  rows={3}
                  className="border-slate-300 focus:border-orange-500 focus:ring-orange-500 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Consumable Images */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Image className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Consumable Images
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <ImageUpload
                assetId={consumable.assetTag || `temp-${Date.now()}`}
                existingImages={consumable.publicImages || []}
                onImagesChange={(newImages) => {
                  setConsumable({ ...consumable, publicImages: newImages });
                }}
                maxImages={10}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/consumables")}
              disabled={saving}
              className="h-11 px-6 border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                !consumable.name ||
                (manualIdAssignment && !consumable.assetTag)
              }
              className="h-11 px-6 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Consumable...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Consumable
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
