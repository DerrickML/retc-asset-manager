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
  Calendar,
  Shield,
  Users,
  Image,
  Eye,
  Sparkles,
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
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
            <Link href="/admin/assets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assets
            </Link>
          </Button>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Add New Asset
                </h1>
                <p className="text-slate-600 mt-1">
                  Create a new asset record for tracking and management
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
                <Info className="w-5 h-5 text-blue-600" />
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
                        setAsset({ ...asset, assetTag: "" });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="manualIdAssignment"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Manually assign asset ID
                  </Label>
                </div>

                {manualIdAssignment && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="assetTag" className="text-sm font-medium text-slate-700">
                      Asset Tag <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="assetTag"
                      value={asset.assetTag}
                      onChange={(e) =>
                        setAsset({ ...asset, assetTag: e.target.value })
                      }
                      placeholder="e.g., RETC-LAP-001"
                      className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      required={manualIdAssignment}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Asset Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={asset.name}
                    onChange={(e) => setAsset({ ...asset, name: e.target.value })}
                    placeholder="e.g., Dell Laptop XPS 15"
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber" className="text-sm font-medium text-slate-700">
                    Serial Number
                  </Label>
                  <Input
                    id="serialNumber"
                    value={asset.serialNumber}
                    onChange={(e) =>
                      setAsset({ ...asset, serialNumber: e.target.value })
                    }
                    placeholder="Manufacturer serial number"
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={asset.category}
                    onValueChange={(value) =>
                      setAsset({ ...asset, category: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label htmlFor="subcategory" className="text-sm font-medium text-slate-700">
                    Subcategory
                  </Label>
                  <Input
                    id="subcategory"
                    value={asset.subcategory}
                    onChange={(e) =>
                      setAsset({ ...asset, subcategory: e.target.value })
                    }
                    placeholder="Asset subcategory"
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="text-sm font-medium text-slate-700">
                    Manufacturer
                  </Label>
                  <Input
                    id="manufacturer"
                    value={asset.manufacturer}
                    onChange={(e) =>
                      setAsset({ ...asset, manufacturer: e.target.value })
                    }
                    placeholder="e.g., Dell, HP, Apple"
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium text-slate-700">
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={asset.model}
                    onChange={(e) => setAsset({ ...asset, model: e.target.value })}
                    placeholder="Model number or name"
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Condition */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Status & Condition
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="availableStatus" className="text-sm font-medium text-slate-700">
                    Availability Status
                  </Label>
                  <Select
                    value={asset.availableStatus}
                    onValueChange={(value) =>
                      setAsset({ ...asset, availableStatus: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label htmlFor="currentCondition" className="text-sm font-medium text-slate-700">
                    Current Condition
                  </Label>
                  <Select
                    value={asset.currentCondition}
                    onValueChange={(value) =>
                      setAsset({ ...asset, currentCondition: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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

          {/* Department & Assignment */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Department & Assignment
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="departmentId" className="text-sm font-medium text-slate-700">
                    Department
                  </Label>
                  <Select
                    value={asset.departmentId}
                    onValueChange={(value) =>
                      setAsset({ ...asset, departmentId: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <Label htmlFor="custodianStaffId" className="text-sm font-medium text-slate-700">
                    Custodian
                  </Label>
                  <Select
                    value={asset.custodianStaffId}
                    onValueChange={(value) =>
                      setAsset({ ...asset, custodianStaffId: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
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
                    value={asset.locationName}
                    onChange={(e) =>
                      setAsset({ ...asset, locationName: e.target.value })
                    }
                    placeholder="e.g., Building A, Office Block"
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomOrArea" className="text-sm font-medium text-slate-700">
                    Room/Area
                  </Label>
                  <Input
                    id="roomOrArea"
                    value={asset.roomOrArea}
                    onChange={(e) =>
                      setAsset({ ...asset, roomOrArea: e.target.value })
                    }
                    placeholder="e.g., Room 301, Floor 3"
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Important Dates
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate" className="text-sm font-medium text-slate-700">
                    Purchase Date
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={asset.purchaseDate}
                    onChange={(e) =>
                      setAsset({ ...asset, purchaseDate: e.target.value })
                    }
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiryDate" className="text-sm font-medium text-slate-700">
                    Warranty Expiry Date
                  </Label>
                  <Input
                    id="warrantyExpiryDate"
                    type="date"
                    value={asset.warrantyExpiryDate}
                    onChange={(e) =>
                      setAsset({ ...asset, warrantyExpiryDate: e.target.value })
                    }
                    className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Visibility */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
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
                  checked={asset.isPublic}
                  onChange={(e) =>
                    setAsset({ ...asset, isPublic: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <Label htmlFor="isPublic" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Make this asset visible in guest portal
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicSummary" className="text-sm font-medium text-slate-700">
                  Public Summary
                </Label>
                <Textarea
                  id="publicSummary"
                  value={asset.publicSummary}
                  onChange={(e) =>
                    setAsset({ ...asset, publicSummary: e.target.value })
                  }
                  placeholder="Brief description visible to guests"
                  rows={3}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicLocationLabel" className="text-sm font-medium text-slate-700">
                  Public Location Label
                </Label>
                <Input
                  id="publicLocationLabel"
                  value={asset.publicLocationLabel}
                  onChange={(e) =>
                    setAsset({ ...asset, publicLocationLabel: e.target.value })
                  }
                  placeholder="Simplified location for public view"
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Asset Images */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <div className="flex items-center space-x-2">
                <Image className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Asset Images
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
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
          <div className="flex items-center justify-end space-x-3 pt-6 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/assets")}
              disabled={saving}
              className="h-11 px-6 border-slate-300 hover:bg-slate-50"
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
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Asset...
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
