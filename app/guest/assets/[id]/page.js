"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import {
  settingsService,
  assetsService,
} from "../../../../lib/appwrite/provider.js";
import {
  formatCategory,
  mapToPublicStatusLabel,
} from "../../../../lib/utils/mappings.js";
import { assetImageService } from "../../../../lib/appwrite/image-service.js";

export default function GuestAssetDetailPage() {
  const params = useParams();
  const [settings, setSettings] = useState(null);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [systemSettings, publicAssets] = await Promise.all([
        settingsService.get(),
        assetsService.getPublicAssets(),
      ]);

      setSettings(systemSettings);

      // Check if guest portal is enabled
      if (!systemSettings.guestPortal) {
        window.location.href = "/guest";
        return;
      }

      // Find the specific asset in public assets
      const assetData = publicAssets.documents.find((a) => a.$id === params.id);
      if (!assetData) {
        setError("Asset not found or not available for public viewing.");
      } else {
        setAsset(assetData);
      }
    } catch (err) {
      setError("Failed to load asset details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Service Unavailable
          </h1>
          <p className="text-gray-600">Unable to load the guest portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/40">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/guest" className="hover:text-gray-900">
            Home
          </Link>
          <span>→</span>
          <Link href="/guest/assets" className="hover:text-gray-900">
            Equipment Catalog
          </Link>
          <span>→</span>
          <span className="text-gray-900">
            {asset?.name || "Asset Details"}
          </span>
        </div>

        {error || !asset ? (
          <Alert variant="destructive">
            <AlertDescription>{error || "Asset not found"}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Asset Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {asset.name}
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                      {formatCategory(asset.category)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        className={
                          asset.availableStatus === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {mapToPublicStatusLabel(asset.availableStatus)}
                      </Badge>
                      {asset.publicConditionLabel && (
                        <Badge variant="outline">
                          {asset.publicConditionLabel.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>

                    {asset.publicLocationLabel && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span>{" "}
                        {asset.publicLocationLabel}
                      </div>
                    )}
                  </div>
                </div>

                {asset.publicSummary && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700">{asset.publicSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Public Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-sidebar-700 bg-clip-text text-transparent">
                  Asset Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const imageUrls = assetImageService.getAssetImageUrls(
                    asset.publicImages
                  );
                  const hasImages = imageUrls && imageUrls.length > 0;

                  return hasImages ? (
                    <div className="space-y-4">
                      {/* Main Image */}
                      <div className="aspect-video relative overflow-hidden rounded-lg">
                        <img
                          src={imageUrls[0]}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div className="hidden w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-white font-bold text-xl">
                                {asset.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-primary-700 font-semibold">
                              Asset Image
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Thumbnail Grid */}
                      {imageUrls.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {imageUrls.slice(1, 5).map((url, index) => (
                            <div
                              key={index}
                              className="aspect-square relative overflow-hidden rounded-lg"
                            >
                              <img
                                src={url}
                                alt={`${asset.name} ${index + 2}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                              />
                            </div>
                          ))}
                          {imageUrls.length > 5 && (
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 font-semibold">
                                +{imageUrls.length - 5}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white font-bold text-2xl">
                            {asset.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-primary-700 font-semibold text-lg">
                          No Images Available
                        </p>
                        <p className="text-primary-600 text-sm">
                          Images will appear here when uploaded
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Request CTA */}
            <Card
              style={{ backgroundColor: `${settings.branding.brandColor}10` }}
            >
              <CardContent className="text-center py-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Interested in This Equipment?
                </h3>
                <p className="text-gray-600 mb-4">
                  Sign in to your staff account to request this asset for your
                  projects and training needs.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    asChild
                    style={{ backgroundColor: settings.branding.brandColor }}
                  >
                    <Link href={`/login?next=/assets/${asset.$id}`}>
                      Sign In to Request
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/guest/assets">Browse More Equipment</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    How to Request
                  </h4>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                    <li>Sign in with your staff credentials</li>
                    <li>Navigate to the asset details page</li>
                    <li>Click "Request Asset" and fill out the request form</li>
                    <li>Wait for approval from the asset administrator</li>
                    <li>
                      Collect your approved assets from the designated location
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600">
                    Contact the asset management team for assistance with
                    equipment requests or technical support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
