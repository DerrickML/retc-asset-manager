"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { AssetForm } from "../../../../components/assets/asset-form";

export default function NewAssetPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-6">
          <Button
            asChild
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 -ml-2"
          >
            <Link href="/admin/assets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assets
            </Link>
          </Button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-org-primary rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Add New Asset</h1>
              <p className="text-slate-600 mt-1">
                Create a new asset record for tracking and management
              </p>
            </div>
          </div>

          <AssetForm onSuccess={() => router.push("/admin/assets")} />
        </div>
      </div>
    </div>
  );
}
