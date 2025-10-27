"use client";

import Link from "next/link";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// Removed MainLayout import - using custom layout
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
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import {
  assetRequestsService,
  assetsService,
  assetIssuesService,
  staffService,
  writeAssetEvent,
} from "../../../../lib/appwrite/provider.js";
import { getCurrentStaff, permissions } from "../../../../lib/utils/auth.js";
import { ENUMS } from "../../../../lib/appwrite/config.js";
import { canIssueAsset } from "../../../../lib/utils/validation.js";
import { EmailService } from "../../../../lib/services/email.js";
import { assetImageService } from "../../../../lib/appwrite/image-service.js";

export default function IssueAssetsPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const [assets, setAssets] = useState([]);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");

  // Issue form data
  const [issueData, setIssueData] = useState({});
  const [handoverNote, setHandoverNote] = useState("");

  useEffect(() => {
    loadData();
  }, [params.requestId]);

  const loadData = async () => {
    try {
      const [requestData, currentStaff] = await Promise.all([
        assetRequestsService.get(params.requestId),
        getCurrentStaff(),
      ]);

      if (requestData.status !== ENUMS.REQUEST_STATUS.APPROVED) {
        setError("This request has not been approved yet.");
        return;
      }

      // Load assets and requester details
      const [assetsData, requester] = await Promise.all([
        Promise.all(
          requestData.requestedItems.map((id) => assetsService.get(id))
        ),
        staffService.get(requestData.requesterStaffId),
      ]);

      setRequest({ ...requestData, requester });
      setAssets(assetsData);
      setStaff(currentStaff);

      // Initialize issue data for each asset
      const initialIssueData = {};
      assetsData.forEach((asset) => {
        initialIssueData[asset.$id] = {
          preCondition: asset.currentCondition,
          accessories: [],
          customAccessory: "",
        };
      });
      setIssueData(initialIssueData);
    } catch (err) {
      setError("Failed to load request data.");
    } finally {
      setLoading(false);
    }
  };

  const updateAssetIssueData = (assetId, field, value) => {
    setIssueData((prev) => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        [field]: value,
      },
    }));
  };

  const addAccessory = (assetId, accessory) => {
    if (!accessory.trim()) return;

    setIssueData((prev) => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        accessories: [...prev[assetId].accessories, accessory.trim()],
        customAccessory: "",
      },
    }));
  };

  const removeAccessory = (assetId, index) => {
    setIssueData((prev) => ({
      ...prev,
      [assetId]: {
        ...prev[assetId],
        accessories: prev[assetId].accessories.filter((_, i) => i !== index),
      },
    }));
  };

  const handleIssue = async () => {
    setIssuing(true);
    setError("");

    try {
      // Validate all assets can be issued
      for (const asset of assets) {
        // Assign asset to custodian
        try {
          const assignCustodian = await assetsService.update(
            asset.$id,
            {
              custodianStaffId: request.requesterStaffId,
            },
            staff.$id,
            `Asset custodian changed to #${request.$id.slice(-8)}`
          );
        } catch (err) {
          console.error("Error assigning custodian for asset:", asset.$id, err);
          // throw new Error(`Failed to assign custodian for asset ${asset.name}: ${err.message}`)
        }

        // Now Validate all assets can be issued
        canIssueAsset(asset);
      }

      // Create issue records for each asset
      const issuePromises = assets.map(async (asset) => {
        const assetIssueData = issueData[asset.$id];

        // Create issue record
        const issue = await assetIssuesService.create({
          requestId: request.$id,
          assetId: asset.$id,
          issuedByStaffId: staff.$id,
          preCondition: assetIssueData.preCondition,
          accessories: assetIssueData.accessories,
          issuedAt: new Date().toISOString(),
          dueAt: request.expectedReturnDate,
          handoverNote,
          acknowledgedByRequester: false,
        });

        // Update asset/consumable status based on type
        if (asset.itemType === ENUMS.ITEM_TYPE.CONSUMABLE) {
          // For consumables, reduce stock by 1
          await assetsService.adjustConsumableStock(
            asset.$id,
            -1, // Reduce stock by 1
            staff.$id,
            `Consumable issued for request #${request.$id.slice(-8)}`
          );
        } else {
          // For assets, mark as IN_USE
          await assetsService.update(
            asset.$id,
            {
              availableStatus: ENUMS.AVAILABLE_STATUS.IN_USE,
              custodianStaffId: request.requesterStaffId,
            },
            staff.$id,
            `Asset issued for request #${request.$id.slice(-8)}`
          );
        }

        // Write assignment event
        await writeAssetEvent(
          asset.$id,
          ENUMS.EVENT_TYPE.ASSIGNED,
          null,
          request.requester.name,
          staff.$id,
          `Issued to ${request.requester.name} for: ${request.purpose}`
        );

        return issue;
      });

      await Promise.all(issuePromises);

      // Update request status to fulfilled
      await assetRequestsService.update(request.$id, {
        status: ENUMS.REQUEST_STATUS.FULFILLED,
      });

      // Send email notification to requester about asset issuance
      try {
        await EmailService.sendAssetIssued(
          request,
          request.requester,
          assets[0],
          staff
        );
      } catch (error) {
        // Failed to send notification, but continue
      }

      router.push("/admin/requests");
    } catch (err) {
      setError(err.message || "Failed to issue assets");
    } finally {
      setIssuing(false);
    }
  };

  const canIssueAssets = staff && permissions.canIssueAssets(staff);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-sidebar-50/40">
        <div className="relative max-w-6xl mx-auto space-y-8 p-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-8">
            <div className="animate-pulse">
              <div className="h-12 bg-gradient-to-r from-primary-200 to-sidebar-200 rounded-xl w-1/3 mb-4"></div>
              <div className="h-6 bg-gradient-to-r from-primary-200 to-sidebar-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gradient-to-r from-primary-200 to-sidebar-200 rounded-2xl"></div>
            <div className="h-48 bg-gradient-to-r from-primary-200 to-sidebar-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-sidebar-50/40">
        <div className="relative max-w-6xl mx-auto space-y-8 p-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-8">
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 text-red-800"
            >
              <AlertDescription>
                {error || "Request not found"}
              </AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button
                asChild
                variant="outline"
                className="bg-gradient-to-r from-primary-500 to-sidebar-500 hover:from-primary-600 hover:to-sidebar-600 text-white border-0"
              >
                <Link href="/admin/requests">Back to Requests</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check permissions after data is loaded
  if (!canIssueAssets) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-sidebar-50/40">
        <div className="relative max-w-6xl mx-auto space-y-8 p-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-8">
            <div className="text-center py-12">
              <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                You don't have permission to issue assets.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-primary-500 to-sidebar-500 hover:from-primary-600 hover:to-sidebar-600 text-white"
              >
                <Link href="/admin/requests">Back to Requests</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-sidebar-50/40">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNTk2NjkiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

      <div className="relative max-w-6xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent">
                Issue Assets
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                Complete the asset issuance for approved request
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="bg-red-50 border-red-200 text-red-800"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Request Summary */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-sidebar-50 rounded-t-2xl border-b border-primary-200/30">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-sidebar-500 rounded-full"></div>
              Request Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[120px]">
                    Request ID:
                  </span>
                  <Badge className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                    #{request.$id.slice(-8)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[120px]">
                    Requester:
                  </span>
                  <span className="bg-gray-100 px-3 py-2 rounded border">
                    {request.requester.name}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-700 min-w-[120px]">
                    Purpose:
                  </span>
                  <span className="bg-gray-100 px-3 py-2 rounded border flex-1">
                    {request.purpose}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[140px]">
                    Issue Date:
                  </span>
                  <span className="bg-green-50 px-3 py-2 rounded border border-green-200 text-green-800">
                    {new Date(request.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 min-w-[140px]">
                    Expected Return:
                  </span>
                  <span className="bg-blue-50 px-3 py-2 rounded border border-blue-200 text-blue-800">
                    {new Date(request.expectedReturnDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets to Issue */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-sidebar-500 to-primary-500 rounded-full"></div>
            Assets to Issue
          </h2>
          {assets.map((asset) => (
            <Card
              key={asset.$id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <CardHeader className="bg-gradient-to-r from-sidebar-50 to-primary-50 rounded-t-2xl border-b border-sidebar-200/30">
                <CardTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-sidebar-500 to-sidebar-600 rounded-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <span>{asset.name}</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full">
                    {asset.assetTag}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Asset Image Section */}
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          asset.assetImage ? "hidden" : "flex"
                        }`}
                      >
                        <div className="text-center">
                          <svg
                            className="w-16 h-16 text-gray-400 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          <p className="text-sm text-gray-500 font-medium">
                            No Image Available
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        className="bg-white/90 text-gray-800 hover:bg-white shadow-lg"
                        onClick={() => {
                          if (asset.assetImage) {
                            const imageUrl = asset.assetImage.startsWith("http")
                              ? asset.assetImage
                              : assetImageService.getPublicImageUrl(
                                  asset.assetImage
                                );
                            window.open(imageUrl, "_blank");
                          }
                        }}
                      >
                        View Full Size
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-primary-500 to-sidebar-500 rounded-full"></span>
                      Pre-Issue Condition
                    </Label>
                    <select
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      value={issueData[asset.$id]?.preCondition || ""}
                      onChange={(e) =>
                        updateAssetIssueData(
                          asset.$id,
                          "preCondition",
                          e.target.value
                        )
                      }
                    >
                      {Object.values(ENUMS.CURRENT_CONDITION).map(
                        (condition) => (
                          <option key={condition} value={condition}>
                            {condition.replace(/_/g, " ")}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-sidebar-500 to-primary-500 rounded-full"></span>
                      Location
                    </Label>
                    <div className="p-3 bg-gradient-to-r from-gray-50 to-sidebar-50/30 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium">
                        {asset.locationName}
                        {asset.roomOrArea && ` - ${asset.roomOrArea}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accessories */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gradient-to-r from-primary-500 to-sidebar-500 rounded-full"></span>
                    Accessories Included
                  </Label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {issueData[asset.$id]?.accessories.map(
                      (accessory, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-primary-50/30 border-primary-200 text-primary-800 px-3 py-2 rounded-xl"
                        >
                          {accessory}
                          <button
                            type="button"
                            onClick={() => removeAccessory(asset.$id, index)}
                            className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-5 h-5 flex items-center justify-center transition-all duration-200"
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Add accessory..."
                      value={issueData[asset.$id]?.customAccessory || ""}
                      onChange={(e) =>
                        updateAssetIssueData(
                          asset.$id,
                          "customAccessory",
                          e.target.value
                        )
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAccessory(
                            asset.$id,
                            issueData[asset.$id]?.customAccessory
                          );
                        }
                      }}
                      className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        addAccessory(
                          asset.$id,
                          issueData[asset.$id]?.customAccessory
                        )
                      }
                      className="bg-gradient-to-r from-primary-500 to-sidebar-500 hover:from-primary-600 hover:to-sidebar-600 text-white border-0 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Handover Notes */}
        <Card className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-sidebar-50 rounded-t-2xl border-b border-primary-200/30">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-sidebar-500 rounded-full"></div>
              Handover Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              placeholder="Add any special instructions or notes for the requester..."
              rows={4}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 resize-none text-gray-700 placeholder-gray-400 bg-white/80 backdrop-blur-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={issuing}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all duration-200 font-medium rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleIssue}
            disabled={issuing}
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-sidebar-600 hover:from-primary-700 hover:to-sidebar-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {issuing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Issuing Assets...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Issue Assets
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
