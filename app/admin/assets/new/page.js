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
  Calendar,
  Shield,
  Users,
  Image,
  FileText,
} from "lucide-react";
import { getCurrentStaff, permissions } from "../../../../lib/utils/auth.js";
import {
  assetsService,
  departmentsService,
  staffService,
} from "../../../../lib/appwrite/provider.js";
import { assetImageService } from "../../../../lib/appwrite/image-service.js";
import { useToastContext } from "../../../../components/providers/toast-provider";
import { ENUMS } from "../../../../lib/appwrite/config.js";
import { formatCategory } from "../../../../lib/utils/mappings.js";

export default function NewAssetPage() {
  const router = useRouter();
  const toast = useToastContext();
  const [currentStaff, setCurrentStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data lists
  const [departments, setDepartments] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);

  // Manual ID assignment state
  const [manualIdAssignment, setManualIdAssignment] = useState(false);

  // Asset form state
  const [asset, setAsset] = useState({
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
      const staff = await getCurrentStaff();
      setCurrentStaff(staff);

      if (!staff || !permissions.canManageAssets(staff)) {
        router.push("/unauthorized");
        return;
      }

      // Load departments and staff
      const [depts, staffList] = await Promise.all([
        departmentsService.list(),
        staffService.list(),
      ]);

      setDepartments(depts.documents || []);
      setStaffMembers(staffList.documents || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Generate asset tag if not manually provided
      const assetTag =
        manualIdAssignment && asset.assetTag
          ? asset.assetTag
          : `RETC-${Date.now()}`;

      // Prepare asset data
      const assetData = {
        assetTag,
        serialNumber: asset.serialNumber || "",
        name: asset.name,
        category: asset.category,
        subcategory: asset.subcategory || "",
        model: asset.model || "",
        manufacturer: asset.manufacturer || "",
        departmentId: asset.departmentId || "",
        custodianStaffId: asset.custodianStaffId || "",
        availableStatus: asset.availableStatus,
        currentCondition: asset.currentCondition,
        locationName: asset.locationName || "",
        roomOrArea: asset.roomOrArea || "",
        purchaseDate: asset.purchaseDate || null,
        warrantyExpiryDate: asset.warrantyExpiryDate || null,
        lastMaintenanceDate: null,
        nextMaintenanceDue: null,
        lastInventoryCheck: null,
        retirementDate: null,
        disposalDate: null,
        attachmentFileIds: [],
        isPublic: asset.isPublic || false,
        publicSummary: asset.publicSummary || "",
        publicImages: JSON.stringify(asset.publicImages || []),
        publicLocationLabel: asset.publicLocationLabel || "",
        publicConditionLabel:
          asset.publicConditionLabel || ENUMS.PUBLIC_CONDITION_LABEL.NEW,
        assetImage:
          asset.publicImages && asset.publicImages.length > 0
            ? assetImageService.getPublicImageUrl(asset.publicImages[0])
            : "",
        itemType: ENUMS.ITEM_TYPE.ASSET,
      };

      await assetsService.create(assetData, currentStaff.$id);

      toast.success("Asset created successfully!");

      // Redirect to assets list
      setTimeout(() => {
        router.push("/admin/assets");
      }, 500);
    } catch (error) {
      console.error("Failed to create asset:", error);
      toast.error("Failed to create asset. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!currentStaff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                asChild
                variant="ghost"
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
              >
                <Link href="/admin/assets">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assets
                </Link>
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Add New Asset
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Create a new asset for tracking and management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
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
                        setAsset({ ...asset, assetTag: "" });
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
                      Asset Tag <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="assetTag"
                      value={asset.assetTag}
                      onChange={(e) =>
                        setAsset({ ...asset, assetTag: e.target.value })
                      }
                      placeholder="e.g., RETC-LAP-001"
                      className="mt-2"
                      required={manualIdAssignment}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Asset Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={asset.name}
                    onChange={(e) => setAsset({ ...asset, name: e.target.value })}
                    placeholder="e.g., Dell Laptop, Office Chair"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={asset.serialNumber}
                    onChange={(e) =>
                      setAsset({ ...asset, serialNumber: e.target.value })
                    }
                    placeholder="Manufacturer serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={asset.category}
                    onValueChange={(value) =>
                      setAsset({ ...asset, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ENUMS.CATEGORY)
                        .filter((cat) => cat !== ENUMS.CATEGORY.CONSUMABLE)
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {formatCategory(category)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={asset.subcategory}
                    onChange={(e) =>
                      setAsset({ ...asset, subcategory: e.target.value })
                    }
                    placeholder="Asset subcategory"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={asset.manufacturer}
                    onChange={(e) =>
                      setAsset({ ...asset, manufacturer: e.target.value })
                    }
                    placeholder="e.g., Dell, HP, Apple"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={asset.model}
                    onChange={(e) => setAsset({ ...asset, model: e.target.value })}
                    placeholder="Model number or name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Condition */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Status & Condition
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="availableStatus">Availability Status</Label>
                  <Select
                    value={asset.availableStatus}
                    onValueChange={(value) =>
                      setAsset({ ...asset, availableStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatCategory(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentCondition">Current Condition</Label>
                  <Select
                    value={asset.currentCondition}
                    onValueChange={(value) =>
                      setAsset({ ...asset, currentCondition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ENUMS.CURRENT_CONDITION).map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {formatCategory(condition)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Department & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    value={asset.departmentId}
                    onValueChange={(value) =>
                      setAsset({ ...asset, departmentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.$id} value={dept.$id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custodianStaffId">Custodian</Label>
                  <Select
                    value={asset.custodianStaffId}
                    onValueChange={(value) =>
                      setAsset({ ...asset, custodianStaffId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select custodian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {staffMembers.map((member) => (
                        <SelectItem key={member.$id} value={member.$id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
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
                    value={asset.locationName}
                    onChange={(e) =>
                      setAsset({ ...asset, locationName: e.target.value })
                    }
                    placeholder="e.g., Building A, Office Block"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomOrArea">Room/Area</Label>
                  <Input
                    id="roomOrArea"
                    value={asset.roomOrArea}
                    onChange={(e) =>
                      setAsset({ ...asset, roomOrArea: e.target.value })
                    }
                    placeholder="e.g., Room 301, Floor 3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="border-yellow-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={asset.purchaseDate}
                    onChange={(e) =>
                      setAsset({ ...asset, purchaseDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiryDate">Warranty Expiry Date</Label>
                  <Input
                    id="warrantyExpiryDate"
                    type="date"
                    value={asset.warrantyExpiryDate}
                    onChange={(e) =>
                      setAsset({ ...asset, warrantyExpiryDate: e.target.value })
                    }
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
                  checked={asset.isPublic}
                  onChange={(e) =>
                    setAsset({ ...asset, isPublic: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Make this asset visible in guest portal
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicSummary">Public Summary</Label>
                <Textarea
                  id="publicSummary"
                  value={asset.publicSummary}
                  onChange={(e) =>
                    setAsset({ ...asset, publicSummary: e.target.value })
                  }
                  placeholder="Brief description visible to guests"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicLocationLabel">Public Location Label</Label>
                <Input
                  id="publicLocationLabel"
                  value={asset.publicLocationLabel}
                  onChange={(e) =>
                    setAsset({ ...asset, publicLocationLabel: e.target.value })
                  }
                  placeholder="Simplified location for public view"
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardTitle className="flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Asset Images
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ImageUpload
                assetId={asset.assetTag || `temp-${Date.now()}`}
                existingImages={asset.publicImages || []}
                onImagesChange={(newImages) => {
                  setAsset({ ...asset, publicImages: newImages });
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
              onClick={() => router.push("/admin/assets")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                !asset.name ||
                (manualIdAssignment && !asset.assetTag)
              }
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Asset
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
