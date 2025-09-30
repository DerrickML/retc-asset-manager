"use client";

import { useState, useRef } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { assetImageService } from "../../lib/appwrite/image-service";

export function ImageUpload({
  assetId,
  existingImages = [],
  onImagesChange,
  maxImages = 5,
  className = "",
}) {
  // Handle both string (JSON) and array formats for existing images
  const parseExistingImages = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
      try {
        return JSON.parse(images);
      } catch (e) {
        console.warn("Failed to parse existing images JSON:", e);
        return [];
      }
    }
    return [];
  };

  const [images, setImages] = useState(parseExistingImages(existingImages));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") &&
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        )
    );

    if (validFiles.length !== files.length) {
      alert("Please select only image files (JPEG, PNG, WebP)");
      return;
    }

    // Check max images limit
    if (images.length + validFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const newImageIds = await assetImageService.uploadMultipleImages(
        validFiles,
        assetId
      );
      const newImages = [...images, ...newImageIds];
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (imageId, index) => {
    try {
      await assetImageService.deleteImage(imageId);
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image. Please try again.");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Asset Images</h3>
        <Button
          type="button"
          onClick={openFileDialog}
          disabled={uploading || images.length >= maxImages}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Add Images"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageId, index) => (
            <Card key={imageId} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <img
                    src={assetImageService.getImageUrl(imageId)}
                    alt={`Asset image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="hidden w-full h-full bg-gray-100 items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Remove button */}
                  <Button
                    type="button"
                    onClick={() => handleRemoveImage(imageId, index)}
                    className="absolute top-2 right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="text-center py-8">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No images uploaded yet</p>
            <p className="text-sm text-gray-500">
              Click "Add Images" to upload asset photos
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-gray-500">
        Upload up to {maxImages} images. Supported formats: JPEG, PNG, WebP
      </p>
    </div>
  );
}
