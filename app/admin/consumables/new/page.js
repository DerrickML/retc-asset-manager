"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UnifiedItemForm } from "../../../../components/assets/unified-item-form";
import { getCurrentStaff, permissions } from "../../../../lib/utils/auth.js";

export default function NewConsumablePage() {
  const router = useRouter();
  const [currentStaff, setCurrentStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const staff = await getCurrentStaff();
      setCurrentStaff(staff);

      if (!staff || !permissions.canManageAssets(staff)) {
        router.push("/unauthorized");
        return;
      }
    } catch (error) {
      console.error("Failed to check permissions:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/admin/consumables");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!currentStaff) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Consumable</h1>
        <p className="text-gray-600">
          Create a new consumable item for inventory management
        </p>
      </div>

      <UnifiedItemForm itemType="consumable" onSuccess={handleSuccess} />
    </div>
  );
}



