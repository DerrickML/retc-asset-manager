"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import { assetsService } from "../../../../lib/appwrite/provider.js";
import { getCurrentStaff, permissions } from "../../../../lib/utils/auth.js";
import {
  getConsumableStatus,
  getConsumableStatusBadgeColor,
  getCurrentStock,
  getMinStock,
  getMaxStock,
  getConsumableUnit,
  getConsumableCategory,
} from "../../../../lib/utils/mappings.js";
import { ConsumableOverview } from "../../../../components/assets/consumable-overview";
import { ConsumableActivity } from "../../../../components/assets/consumable-activity";
// import { ConsumableDistribution } from "../../../../components/assets/consumable-distribution";
import {
  ArrowLeft,
  Edit,
  Package,
  Activity,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Tag,
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Image as ImageIcon,
} from "lucide-react";
import { formatCategory } from "../../../../lib/utils/mappings.js";

export default function ConsumableDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [consumable, setConsumable] = useState(null);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const [staff, consumableData] = await Promise.all([
        getCurrentStaff(),
        assetsService.get(params.id),
      ]);

      setCurrentStaff(staff);
      setConsumable(consumableData);
    } catch (error) {
      console.error("Failed to load consumable:", error);
      setError("Failed to load consumable details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "IN_STOCK":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "LOW_STOCK":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "OUT_OF_STOCK":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "DISCONTINUED":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      IN_STOCK: "bg-green-100 text-green-800 border-green-200",
      LOW_STOCK: "bg-yellow-100 text-yellow-800 border-yellow-200",
      OUT_OF_STOCK: "bg-red-100 text-red-800 border-red-200",
      DISCONTINUED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusText = (status) => {
    if (!status) return "Unknown";
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const canManageConsumables =
    currentStaff && permissions.canManageAssets(currentStaff);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading consumable...</span>
      </div>
    );
  }

  if (error || !consumable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading consumable</div>
          <div className="text-gray-600 mb-4">
            {error || "Consumable not found"}
          </div>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Parse images
  const images = consumable.publicImages
    ? typeof consumable.publicImages === "string"
      ? JSON.parse(consumable.publicImages || "[]")
      : consumable.publicImages
    : [];

  // Get stock metrics
  const currentStock = getCurrentStock(consumable);
  const minStock = getMinStock(consumable);
  const maxStock = getMaxStock(consumable);
  const status = getConsumableStatus(consumable);
  const unit = getConsumableUnit(consumable);

  // Calculate stock percentage
  const stockPercentage =
    maxStock > 0 ? Math.round((currentStock / maxStock) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/consumables")}
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Consumables
              </Button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {consumable.name}
                  </h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      <Tag className="w-3 h-3 mr-1" />
                      {consumable.assetTag}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      <Layers className="w-3 h-3 mr-1" />
                      {formatCategory(getConsumableCategory(consumable))}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            {canManageConsumables && (
              <Button
                onClick={() =>
                  router.push(`/admin/consumables/${consumable.$id}/edit`)
                }
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Consumable
              </Button>
            )}
          </div>
        </div>

        {/* Stock Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Current Stock Card */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-700">
                  {currentStock}
                </div>
                <div className="text-sm text-gray-600">
                  {unit ? formatCategory(unit) : "Units"}
                </div>
                {maxStock > 0 && (
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stockPercentage}% of capacity
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Minimum Stock Card */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2" />
                Minimum Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-yellow-700">
                  {minStock}
                </div>
                <div className="text-sm text-gray-600">
                  Reorder threshold
                </div>
                {currentStock <= minStock && minStock > 0 && (
                  <Badge className="bg-yellow-500 text-white mt-2">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Low Stock Alert
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Maximum Stock Card */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Maximum Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-700">
                  {maxStock || "N/A"}
                </div>
                <div className="text-sm text-gray-600">
                  Maximum capacity
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card
            className={`border-2 ${
              status === "IN_STOCK"
                ? "border-green-300 bg-gradient-to-br from-green-100 to-white"
                : status === "LOW_STOCK"
                ? "border-yellow-300 bg-gradient-to-br from-yellow-100 to-white"
                : "border-red-300 bg-gradient-to-br from-red-100 to-white"
            } shadow-lg hover:shadow-xl transition-shadow`}
          >
            <CardHeader className="pb-3">
              <CardTitle
                className={`text-sm font-medium flex items-center ${
                  status === "IN_STOCK"
                    ? "text-green-600"
                    : status === "LOW_STOCK"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {getStatusIcon(status)}
                <span className="ml-2">Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge
                  className={`text-base px-3 py-1 ${getConsumableStatusBadgeColor(
                    status
                  )}`}
                >
                  {getStatusText(status)}
                </Badge>
                <div className="text-xs text-gray-600 mt-2">
                  {status === "IN_STOCK"
                    ? "Available for distribution"
                    : status === "LOW_STOCK"
                    ? "Reorder recommended"
                    : "Out of stock"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-md rounded-xl p-1">
            <TabsTrigger
              value="overview"
              className="flex items-center data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
            >
              <Package className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger
              value="distribution"
              className="flex items-center data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg"
            >
              <Truck className="w-4 h-4 mr-2" />
              Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <ConsumableOverview
              consumable={consumable}
              onUpdate={(consumable) => {
                router.push(`/admin/consumables/${consumable.$id}/edit`);
              }}
              onStockUpdated={() => {
                loadData();
              }}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <ConsumableActivity consumableId={consumable.$id} />
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6 mt-6">
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50 border-b border-orange-100">
                <CardTitle className="text-orange-800 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Distribution History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Distribution tracking coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
