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
  Layers,
  MapPin,
  BarChart3,
  Image,
  CheckCircle,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!currentStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                asChild
                variant="ghost"
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200"
              >
                <Link href="/admin/consumables">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Consumables
                </Link>
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Add New Consumable
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Create a new consumable item for inventory management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Manual ID Assignment */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
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
                    className="rounded"
                  />
                  <Label
                    htmlFor="manualIdAssignment"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Manually assign ID
                  </Label>
                </div>
                {manualIdAssignment && (
                  <div>
                    <Label htmlFor="assetTag">
                      Consumable ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="assetTag"
                      value={consumable.assetTag}
                      onChange={(e) =>
                        setConsumable({ ...consumable, assetTag: e.target.value })
                      }
                      placeholder="e.g., CONS-PAPER-001"
                      className="mt-2"
                      required={manualIdAssignment}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Consumable Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={consumable.name}
                    onChange={(e) =>
                      setConsumable({ ...consumable, name: e.target.value })
                    }
                    placeholder="e.g., A4 Paper, Office Pens"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumableCategory">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={consumable.consumableCategory}
                    onValueChange={(value) =>
                      setConsumable({ ...consumable, consumableCategory: value })
                    }
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="unit">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={consumable.unit}
                    onValueChange={(value) =>
                      setConsumable({ ...consumable, unit: value })
                    }
                  >
                    <SelectTrigger>
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
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Stock Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Current Stock</Label>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock">Minimum Stock</Label>
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
                  />
                  <p className="text-xs text-gray-500">Reorder threshold</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStock">Maximum Stock</Label>
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
                  />
                  <p className="text-xs text-gray-500">Maximum capacity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="locationName">Location Name</Label>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomOrArea">Room/Area</Label>
                  <Input
                    id="roomOrArea"
                    value={consumable.roomOrArea}
                    onChange={(e) =>
                      setConsumable({ ...consumable, roomOrArea: e.target.value })
                    }
                    placeholder="e.g., Shelf 1, Cabinet B"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Visibility */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
              <CardTitle className="flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                Public Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={consumable.isPublic}
                  onChange={(e) =>
                    setConsumable({ ...consumable, isPublic: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Make this consumable visible in guest portal
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicSummary">Public Summary</Label>
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
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="border-amber-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <CardTitle className="flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Consumable Images
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
          <div className="flex items-center justify-end space-x-4 sticky bottom-0 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/consumables")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !consumable.name || (manualIdAssignment && !consumable.assetTag)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
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



