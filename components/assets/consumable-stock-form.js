"use client";

import { useState } from "react";
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

export function ConsumableStockForm({ consumable, onStockUpdated }) {
  const { staff } = useAuth();
  const toast = useToastContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adjustment: "",
    notes: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staff?.$id) return;

    setLoading(true);
    try {
      await assetsService.adjustConsumableStock(
        consumable.$id,
        parseInt(formData.adjustment),
        staff.$id,
        formData.notes ||
          `Stock adjusted by ${formData.adjustment > 0 ? "+" : ""}${
            formData.adjustment
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
      toast.success(
        `Stock ${
          isPositive ? "increased" : isNegative ? "decreased" : "adjusted"
        } successfully!`
      );
    } catch (error) {
      toast.error("Failed to adjust stock: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isPositive = parseInt(formData.adjustment) > 0;
  const isNegative = parseInt(formData.adjustment) < 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock for {consumable.name}</DialogTitle>
          <DialogDescription>
            Current stock: {consumable.currentStock}{" "}
            {consumable.unit?.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="adjustment">Stock Adjustment *</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const current = parseInt(formData.adjustment) || 0;
                  handleInputChange("adjustment", current - 1);
                }}
                className="px-2"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="adjustment"
                type="number"
                value={formData.adjustment}
                onChange={(e) =>
                  handleInputChange("adjustment", e.target.value)
                }
                placeholder="Enter adjustment amount"
                className="text-center"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const current = parseInt(formData.adjustment) || 0;
                  handleInputChange("adjustment", current + 1);
                }}
                className="px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Use positive numbers to add stock, negative to remove
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Reason for Adjustment</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Why are you adjusting the stock?"
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              New Stock Will Be:
            </p>
            <p className="text-lg font-bold text-gray-900">
              {consumable.currentStock + (parseInt(formData.adjustment) || 0)}{" "}
              {consumable.unit?.toLowerCase()}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.adjustment}
              className={
                isPositive
                  ? "bg-green-600 hover:bg-green-700"
                  : isNegative
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {loading
                ? "Updating..."
                : `${
                    isPositive ? "Add" : isNegative ? "Remove" : "Adjust"
                  } Stock`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
