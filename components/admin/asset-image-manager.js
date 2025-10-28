"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ImageUpload } from "../ui/image-upload";
import { assetImageService } from "../../lib/appwrite/image-service";
import { assetsService } from "../../lib/appwrite/provider";
import { useToastContext } from "../providers/toast-provider";
import { X, Upload, Image as ImageIcon } from "lucide-react";

export function AssetImageManager({ asset, onAssetUpdate }) {
  const toast = useToastContext();
  const [uploading, setUploading] = useState(false);

  const handleImagesChange = async (newImageIds) => {
    if (!asset) return;

    setUploading(true);
    try {
      // Update the asset with new image IDs
      await assetsService.update(asset.$id, {
        publicImages: newImageIds,
      });

      // Notify parent component
      onAssetUpdate?.({
        ...asset,
        publicImages: newImageIds,
      });
    } catch (error) {
      console.error("Error updating asset images:", error);
      toast.error("Failed to update asset images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!asset) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No asset selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="w-5 h-5 mr-2" />
          Manage Images for: {asset.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          assetId={asset.$id}
          existingImages={asset.publicImages || []}
          onImagesChange={handleImagesChange}
          maxImages={10}
        />

        {uploading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">Updating asset images...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
