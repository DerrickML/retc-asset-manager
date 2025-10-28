"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Checkbox } from "../../../../components/ui/checkbox";
import { Badge } from "../../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  CalendarDays,
  Package,
  AlertTriangle,
  Save,
  X,
  ArrowLeft,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";
import {
  assetRequestsService,
  assetsService,
  staffService,
} from "../../../../lib/appwrite/provider.js";
import { assetImageService } from "../../../../lib/appwrite/image-service.js";
import {
  getCurrentStaff,
  getCurrentViewMode,
} from "../../../../lib/utils/auth.js";
import { ENUMS } from "../../../../lib/appwrite/config.js";
import { validateRequestDates } from "../../../../lib/utils/validation.js";
import { formatCategory } from "../../../../lib/utils/mappings.js";
import { Query } from "appwrite";

export default function EditRequestPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentStaff, setCurrentStaff] = useState(null);
  const [request, setRequest] = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    purpose: "",
    issueDate: "",
    expectedReturnDate: "",
  });

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, [params.requestId]);

  const loadData = async () => {
    try {
      console.log("Loading request with ID:", params.requestId);

      // Add timeout and better error handling
      const requestPromise = assetRequestsService.get(params.requestId);
      const staffPromise = getCurrentStaff();

      const [requestData, staff] = await Promise.all([
        requestPromise.catch((err) => {
          console.error("Error loading request:", err);
          throw new Error(`Failed to load request: ${err.message}`);
        }),
        staffPromise.catch((err) => {
          console.error("Error loading staff:", err);
          throw new Error(`Failed to load staff data: ${err.message}`);
        }),
      ]);

      console.log("Request data loaded:", requestData);

      // Check if request has invalid image references
      if (requestData.requestedItems && requestData.requestedItems.length > 0) {
        console.log("Requested items:", requestData.requestedItems);
      }

      // Check if user can edit this request
      const viewMode = getCurrentViewMode();

      // Admins cannot edit requests in admin mode
      if (viewMode === "admin") {
        setError(
          "Admins cannot edit requests. Switch to user mode to edit your own requests."
        );
        return;
      }

      // Users can only edit their own requests
      if (requestData.requesterStaffId !== staff.$id) {
        setError("You can only edit your own requests");
        return;
      }

      if (requestData.status !== ENUMS.REQUEST_STATUS.PENDING) {
        setError("Only pending requests can be edited");
        return;
      }

      setRequest(requestData);
      setCurrentStaff(staff);

      // Set form data
      setFormData({
        purpose: requestData.purpose,
        issueDate: requestData.issueDate.split("T")[0], // Format for date input
        expectedReturnDate: requestData.expectedReturnDate.split("T")[0],
      });

      // Load current assets and set them as selected
      const currentAssets = await Promise.all(
        requestData.requestedItems.map(async (itemId) => {
          try {
            const asset = await assetsService.get(itemId);
            // Clean up any invalid image references that might cause 404s
            if (
              asset.assetImage &&
              asset.assetImage.includes("appwrite.nrep.ug")
            ) {
              // Check if the image URL is valid by testing it
              try {
                const response = await fetch(asset.assetImage, {
                  method: "HEAD",
                });
                if (!response.ok) {
                  console.warn(
                    `Invalid image URL for asset ${asset.name}:`,
                    asset.assetImage
                  );
                  asset.assetImage = null; // Remove invalid image reference
                }
              } catch {
                console.warn(
                  `Failed to validate image URL for asset ${asset.name}:`,
                  asset.assetImage
                );
                asset.assetImage = null; // Remove invalid image reference
              }
            }
            return asset;
          } catch (error) {
            console.warn(`Failed to load asset ${itemId}:`, error);
            return null;
          }
        })
      );

      const validAssets = currentAssets.filter((asset) => asset !== null);
      setSelectedAssets(validAssets);

      // Load available assets
      await loadAvailableAssets();
    } catch (err) {
      console.error("Error loading request:", err);

      // Check if it's a network error and suggest retry
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("Network")
      ) {
        setError(
          "Network error. Please check your connection and try again. If the problem persists, the Appwrite server might be temporarily unavailable."
        );
      } else {
        setError(err.message || "Failed to load request data");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAssets = async () => {
    try {
      const queries = [
        Query.equal("availableStatus", ENUMS.AVAILABLE_STATUS.AVAILABLE),
        Query.equal("isPublic", true),
        Query.orderAsc("name"),
      ];

      if (categoryFilter !== "all") {
        queries.push(Query.equal("category", categoryFilter));
      }

      if (searchTerm) {
        queries.push(Query.search("name", searchTerm));
      }

      const result = await assetsService.getPublicAssets(queries);
      setAvailableAssets(result.documents);
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };

  useEffect(() => {
    if (currentStaff && !loading) {
      loadAvailableAssets();
    }
  }, [searchTerm, categoryFilter, currentStaff, loading]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleAssetToggle = (asset) => {
    setSelectedAssets((prev) => {
      const isSelected = prev.some((selected) => selected.$id === asset.$id);
      if (isSelected) {
        return prev.filter((selected) => selected.$id !== asset.$id);
      } else {
        return [...prev, asset];
      }
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Validation
      if (!formData.purpose.trim()) {
        throw new Error("Purpose is required");
      }

      if (selectedAssets.length === 0) {
        throw new Error("Please select at least one asset");
      }

      const dateValidation = validateRequestDates(
        formData.issueDate,
        formData.expectedReturnDate
      );
      if (!dateValidation.isValid) {
        throw new Error(dateValidation.error);
      }

      // Update request data
      const updateData = {
        purpose: formData.purpose.trim(),
        issueDate: new Date(formData.issueDate).toISOString(),
        expectedReturnDate: new Date(formData.expectedReturnDate).toISOString(),
        requestedItems: selectedAssets.map((asset) => asset.$id),
      };

      console.log("Updating request with ID:", request.$id);
      console.log("Update data:", updateData);
      await assetRequestsService.update(request.$id, updateData);
      console.log("Request updated successfully");
      router.push(`/requests/${request.$id}`);
    } catch (err) {
      setError(err.message || "Failed to update request");
    } finally {
      setSaving(false);
    }
  };

  const filteredAssets = availableAssets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gradient-to-r from-green-200 to-blue-200 rounded w-1/3"></div>
        <div className="h-64 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg"></div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setError("");
              setLoading(true);
              loadData();
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            Retry
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Link href="/requests">Back to Requests</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-green-600 hover:bg-green-50"
              >
                <Link
                  href={`/requests/${request.$id}`}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Request
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Edit Request #{request.$id.slice(-8)}
                </h1>
                <p className="text-gray-600 mt-1">
                  Make changes to your pending request
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Details */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Request Details
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div>
              <Label
                htmlFor="purpose"
                className="text-sm font-semibold text-gray-700 mb-2 block"
              >
                Purpose *
              </Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => handleInputChange("purpose", e.target.value)}
                placeholder="Describe why you need these assets..."
                rows={4}
                className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label
                  htmlFor="issueDate"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Issue Date *
                </Label>
                <Input
                  type="date"
                  id="issueDate"
                  value={formData.issueDate}
                  onChange={(e) =>
                    handleInputChange("issueDate", e.target.value)
                  }
                  className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="expectedReturnDate"
                  className="text-sm font-semibold text-gray-700 mb-2 block"
                >
                  Expected Return Date *
                </Label>
                <Input
                  type="date"
                  id="expectedReturnDate"
                  value={formData.expectedReturnDate}
                  onChange={(e) =>
                    handleInputChange("expectedReturnDate", e.target.value)
                  }
                  className="mt-1 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Selection */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Select Assets ({selectedAssets.length} selected)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Selected Assets */}
            {selectedAssets.length > 0 && (
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Selected Assets:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedAssets.map((asset) => (
                    <div
                      key={asset.$id}
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Asset Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {asset.assetImage ? (
                            <img
                              src={
                                asset.assetImage.startsWith("http")
                                  ? asset.assetImage
                                  : assetImageService.getPublicImageUrl(
                                      asset.assetImage
                                    )
                              }
                              alt={asset.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full flex items-center justify-center text-gray-400"
                            style={{
                              display: asset.assetImage ? "none" : "flex",
                            }}
                          >
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        </div>

                        {/* Asset Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {asset.name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {formatCategory(asset.category)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {asset.locationName}
                            {asset.roomOrArea && ` - ${asset.roomOrArea}`}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleAssetToggle(asset)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.values(ENUMS.CATEGORY).map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Available Assets */}
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">No assets found</p>
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = selectedAssets.some(
                    (selected) => selected.$id === asset.$id
                  );
                  return (
                    <div
                      key={asset.$id}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-md"
                          : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-200 hover:shadow-sm"
                      }`}
                      onClick={() => handleAssetToggle(asset)}
                    >
                      <Checkbox
                        checked={isSelected}
                        readOnly
                        className={`${
                          isSelected
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300"
                        }`}
                      />

                      {/* Asset Image */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {asset.assetImage ? (
                          <img
                            src={
                              asset.assetImage.startsWith("http")
                                ? asset.assetImage
                                : assetImageService.getPublicImageUrl(
                                    asset.assetImage
                                  )
                            }
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center text-gray-400"
                          style={{
                            display: asset.assetImage ? "none" : "flex",
                          }}
                        >
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {asset.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${
                              isSelected
                                ? "border-blue-500 text-blue-600 bg-blue-50"
                                : "border-gray-300 text-gray-600"
                            }`}
                          >
                            {formatCategory(asset.category)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          📍 {asset.locationName}
                          {asset.roomOrArea && ` - ${asset.roomOrArea}`}
                        </p>
                        {asset.publicSummary && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {asset.publicSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <Button
            asChild
            variant="outline"
            disabled={saving}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 px-6 py-2"
          >
            <Link
              href={`/requests/${request.$id}`}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={saving || selectedAssets.length === 0}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Updating..." : "Update Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
