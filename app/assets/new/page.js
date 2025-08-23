"use client"

import { MainLayout } from "../../../components/layout/main-layout"
import { AssetForm } from "../../../components/assets/asset-form"

export default function NewAssetPage() {
  return (
    <MainLayout requiredPermission="canManageAssets">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Asset</h1>
          <p className="text-gray-600">Create a new asset record in the system</p>
        </div>

        <AssetForm />
      </div>
    </MainLayout>
  )
}
