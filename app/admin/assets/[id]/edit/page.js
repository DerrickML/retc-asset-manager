"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Trash2, Eye, History } from "lucide-react";
import {
  assetsService,
  assetEventsService,
} from "../../../../../lib/appwrite/provider.js";
import { getCurrentStaff, permissions } from "../../../../../lib/utils/auth.js";
import { ENUMS } from "../../../../../lib/appwrite/config.js";
import {
  formatCategory,
  getStatusBadgeColor,
  getConditionBadgeColor,
} from "../../../../../lib/utils/mappings.js";

export default function EditAsset({ params }) {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalAsset, setOriginalAsset] = useState(null);
  const [assetId, setAssetId] = useState(null);

  useEffect(() => {
    // For Next.js 15, params is already unwrapped in the component
    if (params?.id) {
      setAssetId(params.id);
      checkPermissionsAndLoadAsset(params.id);
    }
  }, [params]);

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
      // Prepare the updated data
      const updatedAsset = {
        ...asset,
        purchasePrice: parseFloat(asset.purchasePrice) || 0,
        currentValue: parseFloat(asset.currentValue) || 0,
        specifications: asset.specifications
          ? JSON.stringify({ details: asset.specifications })
          : "{}",
      };

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
      await assetsService.update(assetId, updatedAsset);

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
      alert("Asset updated successfully!");
    } catch (error) {
      console.error("Failed to update asset:", error);
      alert("Failed to update asset. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this asset? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await assetsService.delete(assetId);
      router.push("/admin/assets");
    } catch (error) {
      console.error("Failed to delete asset:", error);
      alert("Failed to delete asset. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/assets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assets
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Asset</h1>
            <p className="text-gray-600">{asset.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href={`/assets/${asset.$id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Public
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/assets/${asset.$id}/history`}>
              <History className="w-4 h-4 mr-2" />
              History
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div>
              <Label className="text-sm text-gray-600">Status</Label>
              <div className="mt-1">
                <Badge className={getStatusBadgeColor(asset.availableStatus)}>
                  {asset.availableStatus.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Condition</Label>
              <div className="mt-1">
                <Badge
                  className={getConditionBadgeColor(asset.currentCondition)}
                >
                  {asset.currentCondition.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Category</Label>
              <div className="mt-1">
                <Badge variant="outline">
                  {formatCategory(asset.category)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={asset.name}
                onChange={(e) => setAsset({ ...asset, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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
                  {Object.values(ENUMS.CATEGORY).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={asset.description || ""}
                onChange={(e) =>
                  setAsset({ ...asset, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicSummary">Public Summary</Label>
              <Textarea
                id="publicSummary"
                value={asset.publicSummary || ""}
                onChange={(e) =>
                  setAsset({ ...asset, publicSummary: e.target.value })
                }
                rows={2}
                placeholder="Brief description visible to guests"
              />
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={asset.manufacturer || ""}
                onChange={(e) =>
                  setAsset({ ...asset, manufacturer: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelNumber">Model Number</Label>
              <Input
                id="modelNumber"
                value={asset.modelNumber || ""}
                onChange={(e) =>
                  setAsset({ ...asset, modelNumber: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={asset.serialNumber || ""}
                onChange={(e) =>
                  setAsset({ ...asset, serialNumber: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specifications">Specifications</Label>
              <Textarea
                id="specifications"
                value={asset.specifications || ""}
                onChange={(e) =>
                  setAsset({ ...asset, specifications: e.target.value })
                }
                rows={3}
                placeholder="Technical specifications, features, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Status & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="availableStatus">Available Status</Label>
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
                      {status.replace(/_/g, " ")}
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
                      {condition.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Internal Location</Label>
              <Input
                id="location"
                value={asset.location || ""}
                onChange={(e) =>
                  setAsset({ ...asset, location: e.target.value })
                }
                placeholder="e.g., Building A, Room 101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicLocationLabel">Public Location</Label>
              <Input
                id="publicLocationLabel"
                value={asset.publicLocationLabel || ""}
                onChange={(e) =>
                  setAsset({ ...asset, publicLocationLabel: e.target.value })
                }
                placeholder="e.g., Main Lab"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={asset.purchaseDate || ""}
                onChange={(e) =>
                  setAsset({ ...asset, purchaseDate: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={asset.purchasePrice || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, purchasePrice: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentValue">Current Value ($)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  value={asset.currentValue || ""}
                  onChange={(e) =>
                    setAsset({ ...asset, currentValue: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="warrantyExpiry"
                type="date"
                value={asset.warrantyExpiry || ""}
                onChange={(e) =>
                  setAsset({ ...asset, warrantyExpiry: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
          <CardDescription>
            Internal comments and notes (not visible to guests)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={asset.notes || ""}
            onChange={(e) => setAsset({ ...asset, notes: e.target.value })}
            rows={4}
            placeholder="Add internal notes and comments..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
