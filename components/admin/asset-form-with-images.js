"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ImageUpload } from "../ui/image-upload";
import { ENUMS } from "../../lib/appwrite/config";

export function AssetFormWithImages({
  asset = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    name: asset?.name || "",
    category: asset?.category || "",
    publicSummary: asset?.publicSummary || "",
    publicLocationLabel: asset?.publicLocationLabel || "",
    availableStatus: asset?.availableStatus || "AVAILABLE",
    publicConditionLabel: asset?.publicConditionLabel || "GOOD",
    isPublic: asset?.isPublic || true,
    publicImages: asset?.publicImages || [],
  });

  const [images, setImages] = useState(asset?.publicImages || []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    setFormData((prev) => ({
      ...prev,
      publicImages: newImages,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENUMS.CATEGORY).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {value.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.publicLocationLabel}
                onChange={(e) =>
                  handleInputChange("publicLocationLabel", e.target.value)
                }
                className="mt-1"
                placeholder="e.g., Main Lab, Workshop"
              />
            </div>

            <div>
              <Label htmlFor="status">Availability Status</Label>
              <Select
                value={formData.availableStatus}
                onValueChange={(value) =>
                  handleInputChange("availableStatus", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OUT_FOR_SERVICE">
                    Out of Service
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.publicConditionLabel}
                onValueChange={(value) =>
                  handleInputChange("publicConditionLabel", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="GOOD">Good</SelectItem>
                  <SelectItem value="FAIR">Fair</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Images and Description */}
        <Card>
          <CardHeader>
            <CardTitle>Images & Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              assetId={asset?.$id || "new"}
              existingImages={images}
              onImagesChange={handleImagesChange}
              maxImages={10}
            />

            <div>
              <Label htmlFor="summary">Public Description</Label>
              <Textarea
                id="summary"
                value={formData.publicSummary}
                onChange={(e) =>
                  handleInputChange("publicSummary", e.target.value)
                }
                className="mt-1"
                rows={4}
                placeholder="Describe this asset for public viewing..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) =>
                  handleInputChange("isPublic", e.target.checked)
                }
                className="rounded"
              />
              <Label htmlFor="isPublic">
                Make this asset visible in guest portal
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
        >
          {loading ? "Saving..." : asset ? "Update Asset" : "Create Asset"}
        </Button>
      </div>
    </form>
  );
}
