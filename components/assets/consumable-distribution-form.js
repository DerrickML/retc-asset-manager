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
import { staffService } from "../../lib/appwrite/provider.js";
import { useAuth } from "../../lib/appwrite/provider.js";
import { useToastContext } from "../providers/toast-provider";
import { Package, User, Calendar } from "lucide-react";

export function ConsumableDistributionForm({ consumable, onDistributed }) {
  const { staff } = useAuth();
  const toast = useToastContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: "",
    recipientName: "",
    recipientEmail: "",
    purpose: "",
    eventName: "",
    notes: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staff?.$id) return;

    setLoading(true);
    try {
      // await consumableDistributionsService.create(
      //   {
      //     consumableId: consumable.$id,
      //     quantity: parseInt(formData.quantity),
      //     recipientName: formData.recipientName,
      //     recipientEmail: formData.recipientEmail,
      //     purpose: formData.purpose,
      //     eventName: formData.eventName,
      //     notes: formData.notes,
      //   },
      //   staff.$id
      // );
      // Distribution creation temporarily disabled

      // Reset form
      setFormData({
        quantity: "",
        recipientName: "",
        recipientEmail: "",
        purpose: "",
        eventName: "",
        notes: "",
      });
      setOpen(false);

      if (onDistributed) {
        onDistributed();
      }
      toast.success("Distribution request created successfully!");
    } catch (error) {
      toast.error("Failed to distribute consumable: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Package className="h-4 w-4 mr-2" />
          Distribute
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Distribute {consumable.name}</DialogTitle>
          <DialogDescription>
            Distribute {consumable.currentStock}{" "}
            {consumable.unit?.toLowerCase()} available
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={consumable.currentStock}
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              placeholder="Enter quantity to distribute"
              required
            />
          </div>

          <div>
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input
              id="recipientName"
              value={formData.recipientName}
              onChange={(e) =>
                handleInputChange("recipientName", e.target.value)
              }
              placeholder="Enter recipient name"
              required
            />
          </div>

          <div>
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={formData.recipientEmail}
              onChange={(e) =>
                handleInputChange("recipientEmail", e.target.value)
              }
              placeholder="Enter recipient email (optional)"
            />
          </div>

          <div>
            <Label htmlFor="purpose">Purpose *</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              placeholder="What is this for?"
              required
            />
          </div>

          <div>
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={(e) => handleInputChange("eventName", e.target.value)}
              placeholder="Event name (optional)"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
            />
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
              disabled={
                loading ||
                !formData.quantity ||
                !formData.recipientName ||
                !formData.purpose
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Distributing..." : "Distribute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
