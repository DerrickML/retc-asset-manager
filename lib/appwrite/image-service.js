import { storage } from "./client";
import { BUCKETS } from "./config";

// Helper function to generate valid file IDs
function generateFileId() {
  const timestamp = Date.now().toString(36); // Convert to base36 for shorter string
  const randomId = Math.random().toString(36).substring(2, 8); // 6 char random string
  return `img_${timestamp}_${randomId}`; // Total: ~20 chars, starts with letter
}

// Asset Images Service
export const assetImageService = {
  // Upload asset image
  async uploadImage(file, assetId) {
    try {
      const fileId = generateFileId();

      const result = await storage.createFile(
        BUCKETS.PUBLIC_IMAGES,
        fileId,
        file
      );
      return result;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  // Get image URL
  getImageUrl(fileId) {
    if (!fileId) return null;
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.PUBLIC_IMAGES}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&mode=admin`;
  },

  // Get public image URL (for guest portal)
  getPublicImageUrl(fileId) {
    if (!fileId) return null;
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKETS.PUBLIC_IMAGES}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  },

  // Delete image
  async deleteImage(fileId) {
    try {
      await storage.deleteFile(BUCKETS.PUBLIC_IMAGES, fileId);
      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },

  // Upload multiple images
  async uploadMultipleImages(files, assetId) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, assetId)
      );
      const results = await Promise.all(uploadPromises);
      return results.map((result) => result.$id);
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      throw error;
    }
  },

  // Get all image URLs for an asset
  getAssetImageUrls(publicImages) {
    if (!publicImages) return [];

    // Handle both string (JSON) and array formats
    let imageIds = [];
    if (typeof publicImages === "string") {
      // Handle empty string or invalid JSON
      if (
        publicImages.trim() === "" ||
        publicImages === "null" ||
        publicImages === "undefined"
      ) {
        return [];
      }

      try {
        const parsed = JSON.parse(publicImages);
        imageIds = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn(
          "Failed to parse publicImages JSON:",
          e,
          "Value:",
          publicImages
        );
        return [];
      }
    } else if (Array.isArray(publicImages)) {
      imageIds = publicImages;
    } else {
      console.warn(
        "Unexpected publicImages type:",
        typeof publicImages,
        publicImages
      );
      return [];
    }

    // Filter out invalid file IDs and generate URLs
    return imageIds
      .filter(
        (fileId) => fileId && typeof fileId === "string" && fileId.trim() !== ""
      )
      .map((fileId) => this.getPublicImageUrl(fileId))
      .filter((url) => url !== null);
  },
};

