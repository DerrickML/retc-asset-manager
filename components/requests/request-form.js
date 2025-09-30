"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Clock,
  Package,
  CheckCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  assetsService,
  assetRequestsService,
} from "../../lib/appwrite/provider.js";
import { assetImageService } from "../../lib/appwrite/image-service.js";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import { ENUMS } from "../../lib/appwrite/config.js";
import { validateRequestDates } from "../../lib/utils/validation.js";
import { formatCategory } from "../../lib/utils/mappings.js";
import { Query } from "appwrite";

export function RequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    purpose: "",
    issueDate: "",
    expectedReturnDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentStaff, assetsResult] = await Promise.all([
        getCurrentStaff(),
        assetsService.list([
          Query.equal("availableStatus", ENUMS.AVAILABLE_STATUS.AVAILABLE),
          Query.orderAsc("name"),
        ]),
      ]);

      setStaff(currentStaff);
      setAvailableAssets(assetsResult.documents);

      // Set default dates (tomorrow to next week)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 8);

      setFormData({
        purpose: "",
        issueDate: tomorrow.toISOString().split("T")[0],
        expectedReturnDate: nextWeek.toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Failed to load form data:", error);
      setError("Failed to load form data. Please refresh the page.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate form
      if (selectedAssets.length === 0) {
        throw new Error("Please select at least one asset to request.");
      }

      validateRequestDates(formData.issueDate, formData.expectedReturnDate);

      // Create request
      const requestData = {
        requesterStaffId: staff.$id,
        purpose: formData.purpose,
        issueDate: new Date(formData.issueDate).toISOString(),
        expectedReturnDate: new Date(formData.expectedReturnDate).toISOString(),
        requestedItems: selectedAssets,
        status: ENUMS.REQUEST_STATUS.PENDING,
      };

      await assetRequestsService.create(requestData);

      router.push("/requests");
    } catch (err) {
      setError(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAssetSelection = (assetId) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const getAssetsByCategory = () => {
    const grouped = {};
    availableAssets.forEach((asset) => {
      if (!grouped[asset.category]) {
        grouped[asset.category] = [];
      }
      grouped[asset.category].push(asset);
    });
    return grouped;
  };

  const assetsByCategory = getAssetsByCategory();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Request Details */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Request Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="purpose"
              className="text-sm font-medium text-gray-700"
            >
              Purpose *
            </Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => updateField("purpose", e.target.value)}
              placeholder="Describe what you need these assets for..."
              required
              disabled={loading}
              className="min-h-[100px] border-gray-300 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="issueDate"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-primary-600" />
                Issue Date *
              </Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => updateField("issueDate", e.target.value)}
                required
                disabled={loading}
                className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="expectedReturnDate"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-primary-600" />
                Expected Return Date *
              </Label>
              <Input
                id="expectedReturnDate"
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) =>
                  updateField("expectedReturnDate", e.target.value)
                }
                required
                disabled={loading}
                className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Selection */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-sidebar-50 to-sidebar-100 border-b border-sidebar-200">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-sidebar-600" />
            Select Assets
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose the assets you need for your request
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {selectedAssets.length > 0 && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
              <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Selected Assets ({selectedAssets.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((assetId) => {
                  const asset = availableAssets.find((a) => a.$id === assetId);
                  return (
                    <Badge
                      key={assetId}
                      variant="outline"
                      className="bg-white border-primary-300 text-primary-800 px-3 py-1"
                    >
                      {asset?.name || "Unknown Asset"}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {Object.keys(assetsByCategory).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">
                No available assets found.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(assetsByCategory).map(([category, assets]) => (
                <div key={category}>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {formatCategory(category)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map((asset) => {
                      const imageUrls = assetImageService.getAssetImageUrls(
                        asset.publicImages
                      );
                      const hasImages = imageUrls && imageUrls.length > 0;
                      const isSelected = selectedAssets.includes(asset.$id);

                      return (
                        <div
                          key={asset.$id}
                          className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-primary-500 bg-primary-50 shadow-md"
                              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                          onClick={() => toggleAssetSelection(asset.$id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleAssetSelection(asset.$id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              {/* Asset Image */}
                              <div className="mb-3">
                                {hasImages ? (
                                  <div className="aspect-video relative overflow-hidden rounded-lg">
                                    <img
                                      src={imageUrls[0]}
                                      alt={asset.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "flex";
                                      }}
                                    />
                                    <div className="hidden w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 items-center justify-center">
                                      <div className="text-center">
                                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                          <span className="text-white font-bold text-sm">
                                            {asset.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <p className="text-primary-700 text-xs font-medium">
                                          Asset Image
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-white font-bold text-lg">
                                          {asset.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <p className="text-gray-600 text-xs font-medium">
                                        No Image
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Asset Details */}
                              <div>
                                <h5 className="font-semibold text-gray-900 truncate mb-2">
                                  {asset.name}
                                </h5>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>Tag: {asset.assetTag}</p>
                                  <p>Location: {asset.locationName}</p>
                                </div>
                                <Badge className="mt-2 text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300">
                                  Available
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || selectedAssets.length === 0}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
