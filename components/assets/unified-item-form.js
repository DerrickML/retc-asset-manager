"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  assetsService,
  departmentsService,
  staffService,
} from "../../lib/appwrite/provider.js";
import { ENUMS } from "../../lib/appwrite/config.js";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import { validateAssetTag } from "../../lib/utils/validation.js";
import {
  formatCategory,
  mapToPublicCondition,
} from "../../lib/utils/mappings.js";

export function UnifiedItemForm({ item, onSuccess, itemType = "asset" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [currentStaff, setCurrentStaff] = useState(null);

  // Form data - unified structure for both assets and consumables
  const [formData, setFormData] = useState({
    // Common fields
    name: "",
    description: "",
    category: "",
    subcategory: "",
    manufacturer: "",
    model: "",
    departmentId: "",
    custodianStaffId: "",
    locationName: "",
    roomOrArea: "",
    purchaseDate: "",
    purchaseCost: "",
    isPublic: false,
    publicSummary: "",
    publicLocationLabel: "",

    // Asset-specific fields
    assetTag: "",
    serialNumber: "",
    availableStatus: ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY,
    currentCondition: ENUMS.CURRENT_CONDITION.NEW,
    warrantyExpiryDate: "",
    lastMaintenanceDate: "",
    nextMaintenanceDue: "",
    publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW,

    // Consumable-specific fields
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: ENUMS.CONSUMABLE_UNIT.PIECE,
    status: ENUMS.CONSUMABLE_STATUS.IN_STOCK,
    expiryDate: "",
    supplier: "",
    reorderPoint: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        // Common fields
        name: item.name || "",
        description: item.description || "",
        category: item.category || "",
        subcategory: item.subcategory || "",
        manufacturer: item.manufacturer || "",
        model: item.model || "",
        departmentId: item.departmentId || "",
        custodianStaffId: item.custodianStaffId || "",
        locationName: item.locationName || "",
        roomOrArea: item.roomOrArea || "",
        purchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
        purchaseCost: item.purchaseCost || "",
        isPublic: item.isPublic || false,
        publicSummary: item.publicSummary || "",
        publicLocationLabel: item.publicLocationLabel || "",

        // Asset-specific fields
        assetTag: item.assetTag || "",
        serialNumber: item.serialNumber || "",
        availableStatus:
          item.availableStatus || ENUMS.AVAILABLE_STATUS.AWAITING_DEPLOY,
        currentCondition: item.currentCondition || ENUMS.CURRENT_CONDITION.NEW,
        warrantyExpiryDate: item.warrantyExpiryDate
          ? item.warrantyExpiryDate.split("T")[0]
          : "",
        lastMaintenanceDate: item.lastMaintenanceDate
          ? item.lastMaintenanceDate.split("T")[0]
          : "",
        nextMaintenanceDue: item.nextMaintenanceDue
          ? item.nextMaintenanceDue.split("T")[0]
          : "",
        publicConditionLabel:
          item.publicConditionLabel ||
          mapToPublicCondition(item.currentCondition),

        // Consumable-specific fields
        currentStock: item.currentStock || 0,
        minStock: item.minStock || 0,
        maxStock: item.maxStock || 0,
        unit: item.unit || ENUMS.CONSUMABLE_UNIT.PIECE,
        status: item.status || ENUMS.CONSUMABLE_STATUS.IN_STOCK,
        expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
        supplier: item.supplier || "",
        reorderPoint: item.reorderPoint || 0,
      });
    }
  }, [item]);

  const loadInitialData = async () => {
    try {
      const [deptResult, staffResult, currentUser] = await Promise.all([
        departmentsService.list(),
        staffService.list(),
        getCurrentStaff(),
      ]);

      setDepartments(deptResult.documents);
      setStaff(staffResult.documents);
      setCurrentStaff(currentUser);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setError("Failed to load form data");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields based on item type
      if (itemType === "asset") {
        if (!formData.assetTag) {
          throw new Error("Asset tag is required");
        }
        if (!formData.name) {
          throw new Error("Asset name is required");
        }
      } else {
        if (!formData.name) {
          throw new Error("Consumable name is required");
        }
        if (formData.currentStock < 0) {
          throw new Error("Current stock cannot be negative");
        }
      }

      // Prepare data for submission
      const submitData = {
        ...formData,
        itemType:
          itemType === "asset"
            ? ENUMS.ITEM_TYPE.ASSET
            : ENUMS.ITEM_TYPE.CONSUMABLE,
      };

      // Remove empty strings and convert numbers
      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
        if (
          [
            "currentStock",
            "minStock",
            "maxStock",
            "purchaseCost",
            "reorderPoint",
          ].includes(key)
        ) {
          submitData[key] = Number(submitData[key]) || 0;
        }
      });

      // Explicitly ensure orgId is included - try multiple sources in order of reliability
      const { getCurrentOrgId, getCurrentOrgIdAsync } = await import("../../lib/utils/org.js");
      let currentOrgId = 
        currentStaff?.orgId ||           // First: staff record (most reliable)
        theme?.appwriteOrgId;            // Second: theme from useOrgTheme (available immediately)
      
      // Third: Try API endpoint (works in production - server-side reads env vars at runtime)
      if (!currentOrgId || currentOrgId.trim() === "") {
        const apiOrgId = await getCurrentOrgIdAsync();
        if (apiOrgId) {
          currentOrgId = apiOrgId;
        }
      }
      
      // Fourth: Fallback to sync function (may not work in production if env vars weren't in build)
      if (!currentOrgId || currentOrgId.trim() === "") {
        currentOrgId = getCurrentOrgId();
      }
      
      if (!currentOrgId || currentOrgId.trim() === "") {
        throw new Error("Unable to determine organization. Please refresh the page and try again.");
      }
      submitData.orgId = currentOrgId.trim();

      if (item) {
        // Update existing item
        if (itemType === "asset") {
          await assetsService.update(item.$id, submitData, currentStaff?.$id);
        } else {
          await assetsService.update(item.$id, submitData, currentStaff?.$id);
        }
      } else {
        // Create new item
        if (itemType === "asset") {
          await assetsService.create(submitData, currentStaff?.$id);
        } else {
          await assetsService.create(submitData, currentStaff?.$id);
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(
          itemType === "asset" ? "/admin/assets" : "/admin/consumables"
        );
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryOptions = () => {
    if (itemType === "asset") {
      return Object.entries(ENUMS.CATEGORY).map(([key, value]) => ({
        value,
        label: formatCategory(value),
      }));
    } else {
      return Object.entries(ENUMS.CONSUMABLE_CATEGORY).map(([key, value]) => ({
        value,
        label: value
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {item ? "Edit" : "Add New"}{" "}
            {itemType === "asset" ? "Asset" : "Consumable"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="details">
                  {itemType === "asset" ? "Asset Details" : "Stock Details"}
                </TabsTrigger>
                <TabsTrigger value="public">Public Visibility</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      {itemType === "asset" ? "Asset" : "Consumable"} Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder={`Enter ${itemType} name`}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoryOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        handleInputChange("manufacturer", e.target.value)
                      }
                      placeholder="Enter manufacturer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) =>
                        handleInputChange("model", e.target.value)
                      }
                      placeholder="Enter model"
                    />
                  </div>

                  <div>
                    <Label htmlFor="departmentId">Department</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) =>
                        handleInputChange("departmentId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.$id} value={dept.$id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="custodianStaffId">Custodian</Label>
                    <Select
                      value={formData.custodianStaffId}
                      onValueChange={(value) =>
                        handleInputChange("custodianStaffId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select custodian" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((person) => (
                          <SelectItem key={person.$id} value={person.$id}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="locationName">Location</Label>
                    <Input
                      id="locationName"
                      value={formData.locationName}
                      onChange={(e) =>
                        handleInputChange("locationName", e.target.value)
                      }
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <Label htmlFor="roomOrArea">Room/Area</Label>
                    <Input
                      id="roomOrArea"
                      value={formData.roomOrArea}
                      onChange={(e) =>
                        handleInputChange("roomOrArea", e.target.value)
                      }
                      placeholder="Enter room or area"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {itemType === "asset" ? (
                  // Asset-specific fields
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="assetTag">Asset Tag *</Label>
                        <Input
                          id="assetTag"
                          value={formData.assetTag}
                          onChange={(e) =>
                            handleInputChange("assetTag", e.target.value)
                          }
                          placeholder="e.g. NREP-MECS-LAPTOP-001 or RETC-LAPTOP-001"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="serialNumber">Serial Number</Label>
                        <Input
                          id="serialNumber"
                          value={formData.serialNumber}
                          onChange={(e) =>
                            handleInputChange("serialNumber", e.target.value)
                          }
                          placeholder="Enter serial number"
                        />
                      </div>

                      <div>
                        <Label htmlFor="availableStatus">Status</Label>
                        <Select
                          value={formData.availableStatus}
                          onValueChange={(value) =>
                            handleInputChange("availableStatus", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ENUMS.AVAILABLE_STATUS).map(
                              ([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {value
                                    .replace(/_/g, " ")
                                    .toLowerCase()
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="currentCondition">Condition</Label>
                        <Select
                          value={formData.currentCondition}
                          onValueChange={(value) =>
                            handleInputChange("currentCondition", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ENUMS.CURRENT_CONDITION).map(
                              ([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {value
                                    .replace(/_/g, " ")
                                    .toLowerCase()
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchaseDate">Purchase Date</Label>
                        <Input
                          id="purchaseDate"
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) =>
                            handleInputChange("purchaseDate", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="purchaseCost">Purchase Cost</Label>
                        <Input
                          id="purchaseCost"
                          type="number"
                          step="0.01"
                          value={formData.purchaseCost}
                          onChange={(e) =>
                            handleInputChange("purchaseCost", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label htmlFor="warrantyExpiryDate">
                          Warranty Expiry
                        </Label>
                        <Input
                          id="warrantyExpiryDate"
                          type="date"
                          value={formData.warrantyExpiryDate}
                          onChange={(e) =>
                            handleInputChange(
                              "warrantyExpiryDate",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="lastMaintenanceDate">
                          Last Maintenance
                        </Label>
                        <Input
                          id="lastMaintenanceDate"
                          type="date"
                          value={formData.lastMaintenanceDate}
                          onChange={(e) =>
                            handleInputChange(
                              "lastMaintenanceDate",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  // Consumable-specific fields
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="currentStock">Current Stock *</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          min="0"
                          value={formData.currentStock}
                          onChange={(e) =>
                            handleInputChange("currentStock", e.target.value)
                          }
                          placeholder="0"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="minStock">Minimum Stock</Label>
                        <Input
                          id="minStock"
                          type="number"
                          min="0"
                          value={formData.minStock}
                          onChange={(e) =>
                            handleInputChange("minStock", e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maxStock">Maximum Stock</Label>
                        <Input
                          id="maxStock"
                          type="number"
                          min="0"
                          value={formData.maxStock}
                          onChange={(e) =>
                            handleInputChange("maxStock", e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) =>
                            handleInputChange("unit", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ENUMS.CONSUMABLE_UNIT).map(
                              ([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {value.replace(/_/g, " ").toLowerCase()}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={formData.supplier}
                          onChange={(e) =>
                            handleInputChange("supplier", e.target.value)
                          }
                          placeholder="Enter supplier name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="reorderPoint">Reorder Point</Label>
                        <Input
                          id="reorderPoint"
                          type="number"
                          min="0"
                          value={formData.reorderPoint}
                          onChange={(e) =>
                            handleInputChange("reorderPoint", e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) =>
                            handleInputChange("expiryDate", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="purchaseCost">Unit Cost</Label>
                        <Input
                          id="purchaseCost"
                          type="number"
                          step="0.01"
                          value={formData.purchaseCost}
                          onChange={(e) =>
                            handleInputChange("purchaseCost", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="public" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      handleInputChange("isPublic", checked)
                    }
                  />
                  <Label htmlFor="isPublic">
                    Make this {itemType} visible in guest portal
                  </Label>
                </div>

                {formData.isPublic && (
                  <>
                    <div>
                      <Label htmlFor="publicSummary">Public Summary</Label>
                      <Textarea
                        id="publicSummary"
                        value={formData.publicSummary}
                        onChange={(e) =>
                          handleInputChange("publicSummary", e.target.value)
                        }
                        placeholder="Brief description for public viewing"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="publicLocationLabel">
                          Public Location
                        </Label>
                        <Input
                          id="publicLocationLabel"
                          value={formData.publicLocationLabel}
                          onChange={(e) =>
                            handleInputChange(
                              "publicLocationLabel",
                              e.target.value
                            )
                          }
                          placeholder="Location visible to public"
                        />
                      </div>

                      {itemType === "asset" && (
                        <div>
                          <Label htmlFor="publicConditionLabel">
                            Public Condition
                          </Label>
                          <Select
                            value={formData.publicConditionLabel}
                            onValueChange={(value) =>
                              handleInputChange("publicConditionLabel", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ENUMS.PUBLIC_CONDITION_LABEL).map(
                                ([key, value]) => (
                                  <SelectItem key={key} value={value}>
                                    {value
                                      .replace(/_/g, " ")
                                      .toLowerCase()
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : item ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
