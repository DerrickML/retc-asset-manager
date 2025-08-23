"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "../../../components/layout/main-layout"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { AssetOverview } from "../../../components/assets/asset-overview"
import { AssetActivity } from "../../../components/assets/asset-activity"
import { AssetCustody } from "../../../components/assets/asset-custody"
import { assetsService } from "../../../lib/appwrite/provider.js"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { getStatusBadgeColor, getConditionBadgeColor, formatCategory } from "../../../lib/utils/mappings.js"

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState(null)
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadAssetData()
  }, [params.id])

  const loadAssetData = async () => {
    try {
      const [assetData, currentStaff] = await Promise.all([assetsService.get(params.id), getCurrentStaff()])

      setAsset(assetData)
      setStaff(currentStaff)
    } catch (err) {
      setError("Asset not found or you don't have permission to view it.")
    } finally {
      setLoading(false)
    }
  }

  const canManageAssets = staff && permissions.canManageAssets(staff)

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !asset) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || "Asset not found"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/assets">Back to Assets</Link>
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/assets">← Back to Assets</Link>
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
              {asset.isPublic && <Badge variant="outline">Public</Badge>}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getStatusBadgeColor(asset.availableStatus)}>
                {asset.availableStatus.replace(/_/g, " ")}
              </Badge>
              <Badge className={getConditionBadgeColor(asset.currentCondition)}>
                {asset.currentCondition.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline">{formatCategory(asset.category)}</Badge>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                Asset Tag: <span className="font-mono">{asset.assetTag}</span>
              </p>
              {asset.serialNumber && (
                <p>
                  Serial: <span className="font-mono">{asset.serialNumber}</span>
                </p>
              )}
            </div>
          </div>

          {canManageAssets && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/assets/${asset.$id}/edit`}>Edit Asset</Link>
              </Button>
              <Button asChild>
                <Link href={`/admin/issue?asset=${asset.$id}`}>Issue Asset</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="custody">Custody</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AssetOverview asset={asset} onUpdate={loadAssetData} />
          </TabsContent>

          <TabsContent value="activity">
            <AssetActivity assetId={asset.$id} />
          </TabsContent>

          <TabsContent value="custody">
            <AssetCustody assetId={asset.$id} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
