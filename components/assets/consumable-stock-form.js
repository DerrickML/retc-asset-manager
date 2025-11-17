"use client";

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { assetsService } from "../../lib/appwrite/provider.js";
import { useAuth } from "../../lib/appwrite/provider.js";
import { useToastContext } from "../providers/toast-provider";
import { Package, Plus, Minus } from "lucide-react";
import { useOrgTheme } from "../providers/org-theme-provider";
import { getCurrentStaff } from "../../lib/utils/auth";

export function ConsumableStockForm({ consumable, onStockUpdated }) {
  const { staff } = useAuth();
  const toast = useToastContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adjustment: "",
    notes: "",
  });
  const { theme } = useOrgTheme();
  const primaryColor = theme?.colors?.primary || "#0E6370";
  const primaryDark = theme?.colors?.primaryDark || "#0A4E57";
  const mutedBg = theme?.colors?.muted || "rgba(222, 243, 245, 0.6)";
  const accentColor = theme?.colors?.accent || primaryColor;
  const accentDark = theme?.colors?.accentDark || primaryDark;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAdjustment = Number(formData.adjustment);

    let actorStaffId = staff?.$id;
    if (!actorStaffId) {
      try {
        const refreshedStaff = await getCurrentStaff();
        actorStaffId = refreshedStaff?.$id;
      } catch (error) {
        console.error("Failed to load staff profile for stock adjustment", error);
      }
    }

    if (!actorStaffId) {
      toast.show({
        type: "error",
        message: "Unable to load your staff profile. Please refresh and try again.",
      });
      return;
    }

    console.log("Submitting consumable stock adjustment", {
      consumableId: consumable.$id,
      adjustment: parsedAdjustment,
      staffId: actorStaffId,
    });
    if (Number.isNaN(parsedAdjustment) || formData.adjustment.trim() === "") {
      toast.show({
        type: "error",
        message: "Enter a valid adjustment amount.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await assetsService.adjustConsumableStock(
        consumable.$id,
        parsedAdjustment,
        actorStaffId,
        formData.notes ||
          `Stock adjusted by ${parsedAdjustment > 0 ? "+" : ""}${
            parsedAdjustment
          }`
      );

      // Reset form
      setFormData({
        adjustment: "",
        notes: "",
      });
      setOpen(false);

      if (onStockUpdated) {
        onStockUpdated();
      }
      toast.show({
        type: "success",
        message: `Stock ${
          parsedAdjustment > 0
            ? "increased"
            : parsedAdjustment < 0
            ? "decreased"
            : "adjusted"
        } successfully!`,
      });
    } catch (error) {
      toast.show({
        type: "error",
        message: "Failed to adjust stock: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: String(value) }));
  };

  const currentAdjustment = Number(formData.adjustment);
  const safeAdjustment = Number.isNaN(currentAdjustment) ? 0 : currentAdjustment;
  const isPositive = safeAdjustment > 0;
  const isNegative = safeAdjustment < 0;

  const actionButtonClass = useMemo(() => {
    if (isPositive) return "bg-emerald-600 hover:bg-emerald-700";
    if (isNegative) return "bg-rose-600 hover:bg-rose-700";
    return "bg-slate-600 hover:bg-slate-700";
  }, [isPositive, isNegative]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden shadow-2xl border-0">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${mutedBg} 0%, #ffffff 35%, #ffffff 100%)`,
          }}
        >
          <div className="px-6 pt-6 pb-4 border-b border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-slate-900">
                    Adjust Stock for {consumable.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500">
                    Current stock: {consumable.currentStock}{" "}
                    {consumable.unit?.toLowerCase()}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adjustment" className="text-sm font-medium text-slate-700">
                Stock Adjustment
              </Label>
              <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    const current = Number(formData.adjustment) || 0;
                    handleInputChange("adjustment", String(current - 1));
                  }}
                  className="h-11 w-11 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <Input
                  id="adjustment"
                  type="number"
                  value={formData.adjustment}
                  onChange={(e) => handleInputChange("adjustment", e.target.value)}
                  placeholder="Enter amount"
                  className="h-11 flex-1 border-0 text-center focus-visible:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = Number(formData.adjustment) || 0;
                    handleInputChange("adjustment", String(current + 1));
                  }}
                  className="h-11 w-11 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Use positive numbers to add stock, negative numbers to remove stock.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Reason for Adjustment
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add an optional note for audit trail"
                rows={3}
                className="resize-none rounded-xl border border-slate-200 focus-visible:ring-1 focus-visible:ring-[var(--org-primary)]"
              />
            </div>

            <div className="rounded-xl border border-slate-100 bg-white/70 px-4 py-3">
              <p className="text-sm text-slate-500">New stock will be</p>
              <p className="text-2xl font-semibold text-slate-900">
                {consumable.currentStock + safeAdjustment}{" "}
                {consumable.unit?.toLowerCase()}
              </p>
            </div>

            <DialogFooter className="flex justify-between items-center pt-2 pb-4 space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="px-6 border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  formData.adjustment.trim() === "" ||
                  Number.isNaN(currentAdjustment)
                }
                className={`px-6 text-white ${actionButtonClass}`}
              >
                {loading
                  ? "Updating..."
                  : `${isPositive ? "Add" : isNegative ? "Remove" : "Adjust"} Stock`}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
