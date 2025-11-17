"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Clock,
  Package,
  CheckCircle,
  X,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Layers,
  Circle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  assetsService,
  assetRequestsService,
  projectsService,
} from "../../lib/appwrite/provider.js";
import { assetImageService } from "../../lib/appwrite/image-service.js";
import { getCurrentStaff } from "../../lib/utils/auth.js";
import { ENUMS } from "../../lib/appwrite/config.js";
import { validateRequestDates } from "../../lib/utils/validation.js";
import { formatCategory } from "../../lib/utils/mappings.js";
import { Query } from "appwrite";
import { useOrgTheme } from "../providers/org-theme-provider";
import { getConsumableCategoriesForOrg } from "../../lib/constants/consumable-categories.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export function RequestForm({ itemType = ENUMS.ITEM_TYPE.ASSET }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState("");
  const [staff, setStaff] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name-asc");
  const [projectCatalog, setProjectCatalog] = useState([]);
  const { orgCode, theme } = useOrgTheme();
  const isConsumableRequest = useMemo(
    () => itemType === ENUMS.ITEM_TYPE.CONSUMABLE,
    [itemType]
  );
  const viewPathBase = isConsumableRequest ? "/consumables" : "/assets";
  const isNrepOrg = useMemo(() => orgCode?.toUpperCase() === "NREP", [orgCode]);
  const mutedBg = theme?.colors?.muted || "rgba(14, 99, 112, 0.08)";
  const highlightColor =
    theme?.colors?.highlight || "var(--org-highlight, #f7901e)";
  const projectLookup = useMemo(() => {
    const map = new Map();
    (projectCatalog || []).forEach((project) => {
      if (!project) return;
      const label =
        project.name ||
        project.title ||
        project.displayName ||
        project.code ||
        project.projectName ||
        project.projectCode ||
        "";
      if (project.$id && label) {
        map.set(project.$id, label);
      }
    });
    return map;
  }, [projectCatalog]);
  const itemLabel = isConsumableRequest ? "Consumable" : "Asset";
  const itemLabelPlural = isConsumableRequest ? "Consumables" : "Assets";
  const PrimaryIcon = isConsumableRequest ? ShoppingCart : Package;

  const [formData, setFormData] = useState({
    issueDate: "",
    expectedReturnDate: "",
  });

  useEffect(() => {
    setError("");
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConsumableRequest, isNrepOrg]);

  // Reset project filter for RETC (RETC doesn't use projects)
  useEffect(() => {
    if (!isNrepOrg && projectFilter !== "all") {
      setProjectFilter("all");
    }
  }, [isNrepOrg, projectFilter]);

  const normalizeItem = (doc) => {
    const inferredType =
      doc.itemType ||
      (isConsumableRequest
        ? ENUMS.ITEM_TYPE.CONSUMABLE
        : ENUMS.ITEM_TYPE.ASSET);
    const isConsumableItem = inferredType === ENUMS.ITEM_TYPE.CONSUMABLE;

    const rawProjectId = doc.projectId || doc.project?.$id || doc.projectIdRef || "";
    const resolvedProjectName =
      projectLookup.get(rawProjectId) ||
      doc.project?.name ||
      doc.project?.title ||
      doc.project?.code ||
      doc.projectName ||
      doc.projectLabel ||
      "";

    let primaryImage = "";
    if (doc.assetImage && doc.assetImage.trim() !== "") {
      primaryImage = doc.assetImage;
    } else {
      const urls = assetImageService.getAssetImageUrls(doc.publicImages);
      if (urls && urls.length > 0) {
        primaryImage = urls[0];
      }
    }

    return {
      id: doc.$id,
      itemType: inferredType,
      name: doc.name || "Unnamed Item",
      tag: doc.assetTag || doc.identifier || "",
      category: doc.category || "",
      location:
        doc.locationName ||
        doc.roomOrArea ||
        (isConsumableRequest
          ? isNrepOrg
            ? "NREP Store"
            : "RETC Store"
          : ""),
      status: isConsumableItem ? doc.status : doc.availableStatus,
      projectId: rawProjectId || "",
      projectName: resolvedProjectName || (rawProjectId ? "Unnamed Project" : "Unassigned"),
      currentStock: isConsumableItem ? doc.currentStock ?? null : null,
      unit: isConsumableItem ? doc.unit || "" : "",
      imageUrl: primaryImage,
      fallbackInitial: doc.name?.charAt(0)?.toUpperCase() || "?",
      raw: doc,
    };
  };

  const loadData = async () => {
    setLoadingItems(true);
    try {
      const itemQueries = [Query.orderAsc("name")];
      let itemsPromise;

      if (isConsumableRequest) {
        itemsPromise = assetsService.getConsumables(itemQueries);
      } else {
        const assetQueries = [
          ...itemQueries,
          Query.equal("availableStatus", ENUMS.AVAILABLE_STATUS.AVAILABLE),
        ];
        itemsPromise = assetsService.getAssets(assetQueries);
      }

      const projectQueries = [Query.orderAsc("name")];
      const projectsPromise = projectsService
        .list(projectQueries)
        .then((res) => res?.documents || [])
        .catch((err) => {
          console.error("Failed to load projects:", err);
          return [];
        });

      const [currentStaff, itemsResult, projectsResult] = await Promise.all([
        getCurrentStaff(),
        itemsPromise,
        projectsPromise,
      ]);

      setStaff(currentStaff);
      setProjectCatalog(projectsResult);

      const normalizedItems = (itemsResult.documents || [])
        .map(normalizeItem)
        .filter((item) => {
          if (!isConsumableRequest) return true;
          if (item.status === ENUMS.CONSUMABLE_STATUS.OUT_OF_STOCK) {
            return false;
          }
          if (item.currentStock !== null && item.currentStock <= 0) {
            return false;
          }
          return true;
        });

      setAvailableItems(normalizedItems);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 8);

      setFormData({
        issueDate: tomorrow.toISOString().split("T")[0],
        expectedReturnDate: nextWeek.toISOString().split("T")[0],
      });
    } catch (loadError) {
      console.error("Failed to load form data:", loadError);
      setError("Failed to load form data. Please refresh the page.");
    } finally {
      setLoadingItems(false);
    }
  };

  const categories = useMemo(() => {
    if (isConsumableRequest) {
      // For consumables, use organization-specific categories
      const orgCategories = getConsumableCategoriesForOrg(orgCode);
      return orgCategories ?? [];
    }

    // For assets, show all available categories from ENUMS
    return Object.values(ENUMS.CATEGORY).sort();
  }, [isConsumableRequest, orgCode]);

  const statuses = useMemo(() => {
    if (isConsumableRequest) {
      // For consumables, show all consumable statuses
      return Object.values(ENUMS.CONSUMABLE_STATUS).sort();
    }

    // For assets, show all available statuses
    return Object.values(ENUMS.AVAILABLE_STATUS).sort();
  }, [isConsumableRequest]);

  const projectOptions = useMemo(() => {
    const unique = new Map();
    (projectCatalog || []).forEach((project) => {
      if (!project) return;
      const label =
        project.name ||
        project.title ||
        project.displayName ||
        project.code ||
        project.projectName ||
        project.projectCode ||
        "";
      if (project.$id && label) {
        unique.set(project.$id, label);
      }
    });

    let options = Array.from(unique.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

    if (options.length === 0) {
      const fallback = new Map();
      availableItems.forEach((item) => {
        const id = item.projectId || item.project?.$id;
        const name =
          item.projectName ||
          item.project?.name ||
          item.project?.title ||
          item.project?.code ||
          "";
        if (id && name) {
          fallback.set(id, name);
        }
      });

      options = Array.from(fallback.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const hasUnassigned = availableItems.some(
      (item) => !item.projectId || item.projectId === ""
    );
    if (hasUnassigned) {
      options.unshift({ id: "unassigned", label: "Unassigned" });
    }

    return options;
  }, [projectCatalog, availableItems]);

  const filteredItems = useMemo(() => {
    const filtered = availableItems.filter((item) => {
      if (categoryFilter !== "all" && item.category) {
        if (item.category !== categoryFilter) {
          return false;
        }
      }

      if (statusFilter !== "all") {
        if (!item.status || item.status !== statusFilter) {
          return false;
        }
      }

      // Project filter only applies to NREP (RETC doesn't use projects)
      if (isNrepOrg && projectFilter !== "all") {
        if (projectFilter === "unassigned") {
          if (item.projectId && item.projectId !== "") {
            return false;
          }
        } else if (!item.projectId || item.projectId !== projectFilter) {
          return false;
        }
      }

      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(query) ||
          (item.tag && item.tag.toLowerCase().includes(query)) ||
          (item.location && item.location.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query));
        if (!matches) {
          return false;
        }
      }

      if (isConsumableRequest) {
        if (item.status === ENUMS.CONSUMABLE_STATUS.OUT_OF_STOCK) {
          return false;
        }
        if (item.currentStock !== null && item.currentStock <= 0) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "stock-asc":
          return (a.currentStock ?? 0) - (b.currentStock ?? 0);
        case "stock-desc":
          return (b.currentStock ?? 0) - (a.currentStock ?? 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [
    availableItems,
    categoryFilter,
    statusFilter,
    projectFilter,
    searchTerm,
    selectedItems,
    isConsumableRequest,
    sortOption,
    isNrepOrg,
  ]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemToggle = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((selected) => selected.id === item.id);
      if (exists) {
        return prev.filter((selected) => selected.id !== item.id);
      }

      return [
        ...prev,
        {
          ...item,
          quantity: isConsumableRequest ? 1 : undefined,
          note: "",
        },
      ];
    });
  };

  const handleQuantityChange = (itemId, delta) => {
    if (!isConsumableRequest) return;
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const max = item.currentStock ?? Number.POSITIVE_INFINITY;
        const next = Math.max(1, Math.min(max, (item.quantity || 1) + delta));
        return { ...item, quantity: next };
      })
    );
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleItemNoteChange = (itemId, value) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              note: value,
            }
          : item
      )
    );
  };

  const requestedItemIds = useMemo(() => {
    if (!isConsumableRequest) {
      return selectedItems.map((item) => item.id);
    }
    const expanded = [];
    selectedItems.forEach((item) => {
      const max = item.currentStock ?? Number.POSITIVE_INFINITY;
      const quantity = Math.max(1, Math.min(max, item.quantity || 1));
      for (let i = 0; i < quantity; i += 1) {
        expanded.push(item.id);
      }
    });
    return expanded;
  }, [selectedItems, isConsumableRequest]);

  const hasSelectedItems = selectedItems.length > 0;
  const hasDetails = formData.issueDate && formData.expectedReturnDate;
  const canSubmit = hasSelectedItems && hasDetails;

  const steps = useMemo(
    () => [
      {
        id: 1,
        title: `Add ${itemLabelPlural}`,
        description: `Collect the ${itemLabelPlural.toLowerCase()} you need`,
        status: hasSelectedItems ? "complete" : "current",
      },
      {
        id: 2,
        title: "Review & Submit",
        description: "Confirm purpose, timeline, and send the request",
        status: hasSelectedItems ? (canSubmit ? "complete" : "current") : "upcoming",
      },
    ],
    [hasSelectedItems, canSubmit, itemLabelPlural]
  );

  const getStepClasses = (status) => {
    switch (status) {
      case "complete":
        return "border-transparent bg-org-gradient text-white shadow-md";
      case "current":
        return "border-[var(--org-primary)]/40 bg-white text-gray-900 shadow-sm";
      default:
        return "border-dashed border-gray-300 bg-white text-gray-400";
    }
  };

  const renderStepIcon = (status) => {
    if (status === "complete") {
      return <CheckCircle2 className="w-5 h-5" />;
    }
    if (status === "current") {
      return (
        <div className="w-5 h-5 rounded-full border-2 border-[var(--org-primary)] flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[var(--org-primary)] animate-pulse" />
        </div>
      );
    }
    return <Circle className="w-5 h-5" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (selectedItems.length === 0) {
        throw new Error(`Please add at least one ${itemLabel.toLowerCase()} to your request.`);
      }

      if (isConsumableRequest) {
        const overLimit = selectedItems.find((item) => {
          if (item.currentStock === null) return false;
          return (item.quantity || 1) > item.currentStock;
        });
        if (overLimit) {
          throw new Error(
            `${overLimit.name} has only ${overLimit.currentStock} in stock. Adjust the quantity before submitting.`
          );
        }
      }

      validateRequestDates(formData.issueDate, formData.expectedReturnDate);

      const itemNotes = selectedItems
        .filter((item) => item.note && item.note.trim().length > 0)
        .map((item) => {
          const details = item.tag ? `${item.name} (${item.tag})` : item.name;
          return `${details}: ${item.note.trim()}`;
        });

      const requestData = {
        requesterStaffId: staff.$id,
        purpose: itemNotes.length
          ? itemNotes.map((line) => `- ${line}`).join("\n")
          : "Request submitted",
        issueDate: new Date(formData.issueDate).toISOString(),
        expectedReturnDate: new Date(formData.expectedReturnDate).toISOString(),
        requestedItems: requestedItemIds,
        status: ENUMS.REQUEST_STATUS.PENDING,
      };

      await assetRequestsService.create(requestData);
      router.push("/requests");
    } catch (submitError) {
      setError(submitError.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const itemCount = selectedItems.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`rounded-2xl border px-5 py-4 flex items-start gap-3 transition-all duration-200 ${getStepClasses(
              step.status
            )}`}
          >
            <div className="mt-0.5">{renderStepIcon(step.status)}</div>
            <div className="space-y-1">
              <p
                className={`text-sm font-semibold ${
                  step.status === "complete"
                    ? "text-white"
                    : step.status === "current"
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                Step {step.id}
              </p>
              <h3
                className={`text-lg font-semibold ${
                  step.status === "complete" ? "text-white" : "text-gray-900"
                }`}
              >
                {step.title}
              </h3>
              <p
                className={`text-sm ${
                  step.status === "complete"
                    ? "text-white/90"
                    : step.status === "current"
                    ? "text-gray-600"
                    : "text-gray-400"
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-[var(--org-muted)]/60 border-b border-[var(--org-primary)]/20">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--org-primary)]" />
            Request Details
          </CardTitle>
          <CardDescription className="text-gray-600">
            Provide details for when and why you need these {itemLabelPlural.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="issueDate"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-primary-600" />
                Issue Date *
              </Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => updateField("issueDate", e.target.value)}
                required
                disabled={loading}
                className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="expectedReturnDate"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-primary-600" />
                Expected Return Date *
              </Label>
              <Input
                id="expectedReturnDate"
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => updateField("expectedReturnDate", e.target.value)}
                required
                disabled={loading}
                className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--org-primary)]" />
              Selected {itemLabelPlural}
          </CardTitle>
            <CardDescription className="text-gray-600">
              Keep adding {itemLabelPlural.toLowerCase()} until your request is complete.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 bg-org-gradient text-white shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add {itemLabel}
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {itemCount === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center space-y-3 bg-gray-50">
              <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <PrimaryIcon className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-gray-700 font-medium">
                No {itemLabelPlural.toLowerCase()} selected yet.
              </p>
              <p className="text-gray-500 text-sm">
                Use the button above to browse and add {itemLabelPlural.toLowerCase()} to this request.
              </p>
              <Button
                type="button"
                      variant="outline"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-2 border-[var(--org-primary)] text-[var(--org-primary)] hover:bg-[var(--org-primary)]/10"
              >
                <Plus className="w-4 h-4" />
                Browse {itemLabelPlural}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                >
                  <div className="w-full sm:w-24 sm:h-24 h-40 rounded-lg overflow-hidden"
                    style={{
                      background: item.imageUrl && !isConsumableRequest
                        ? `linear-gradient(135deg, ${mutedBg}, #ffffff)`
                        : `linear-gradient(135deg, ${mutedBg}, rgba(255,255,255,0.95))`,
                    }}
                  >
                    {item.imageUrl && !isConsumableRequest ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-2xl font-semibold text-primary-600">
                          {item.fallbackInitial}
                                          </span>
                                        </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          {item.tag && (
                            <Badge className="bg-gray-100 text-gray-700 border border-gray-200">
                              Tag: {item.tag}
                            </Badge>
                          )}
                          {item.category && (
                            <Badge className="bg-primary-50 text-primary-700 border border-primary-200">
                              {formatCategory(item.category)}
                            </Badge>
                          )}
                          {item.location && (
                            <Badge className="bg-gray-50 text-gray-600 border border-gray-200">
                              {item.location}
                            </Badge>
                          )}
                                      </div>
                                    </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Remove {item.name}</span>
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-gradient-to-r from-primary-50 to-primary-100 text-primary-800 border border-primary-200">
                        {item.status 
                          ? (isConsumableRequest 
                              ? formatCategory(item.status) 
                              : item.status.replace(/_/g, " "))
                          : (isConsumableRequest 
                              ? "In Stock" 
                              : "Available")}
                      </Badge>
                      {isConsumableRequest && item.currentStock !== null && (
                        <Badge className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200">
                          In stock: {item.currentStock}
                        </Badge>
                      )}
                                  </div>

                    {isConsumableRequest && item.currentStock !== null && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          Quantity
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-base font-semibold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            disabled={
                              item.currentStock !== null &&
                              item.quantity >= item.currentStock
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          {item.unit && (
                            <span className="text-sm text-gray-500">
                              {item.unit.toLowerCase()}
                              {item.quantity !== 1 ? "s" : ""}
                                        </span>
                          )}
                                    </div>
                                  </div>
                                )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Purpose for this {itemLabel.toLowerCase()}
                      </Label>
                      <Textarea
                        value={item.note || ""}
                        onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                        placeholder={`Why do you need ${item.name}?`}
                        rows={3}
                        className="border-gray-300 focus:border-[var(--org-primary)] focus:ring-[var(--org-primary)]/20 transition-all duration-200"
                      />
                              </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || requestedItemIds.length === 0 || !hasDetails}
          className="bg-org-gradient hover:from-[var(--org-primary-dark)] hover:to-[var(--org-primary)] text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Request
            </>
          )}
        </Button>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-none w-full md:w-[70rem] lg:w-[76rem] xl:w-[80rem] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Select {itemLabelPlural}</DialogTitle>
            <DialogDescription>
              Browse available {itemLabelPlural.toLowerCase()} and add them to your request cart.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="sticky top-0 z-30 -mx-1 md:-mx-2 lg:-mx-3">
              <div className="rounded-3xl border border-[var(--org-primary)]/10 bg-white/90 backdrop-blur-sm shadow-lg p-5">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">
                      Search
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Search ${itemLabelPlural.toLowerCase()} by name, tag, or location...`}
                        className="pl-9 h-11 rounded-full border-gray-200 focus:border-[var(--org-primary)] focus:ring-[var(--org-primary)]/20"
                      />
                    </div>
                  </div>

                  {/* Project filter only for NREP (RETC doesn't use projects) */}
                  {isNrepOrg && projectOptions.length > 0 && (
                    <div className="w-full sm:w-[200px]">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">
                        Project
                      </Label>
                      <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="h-11 rounded-full border-gray-200 focus:border-[var(--org-primary)] focus:ring-[var(--org-primary)]/20 px-4 text-sm font-medium text-gray-600">
                          <span className="truncate text-left flex-1">
                            {projectFilter === "all"
                              ? "All Projects"
                              : projectOptions.find((project) => project.id === projectFilter)?.label ||
                                "All Projects"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Projects</SelectItem>
                          {projectOptions.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Status filter - always show all available statuses */}
                  <div className="w-full sm:w-[200px]">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">
                      Status
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 rounded-full border-gray-200 focus:border-[var(--org-primary)] focus:ring-[var(--org-primary)]/20 px-4 text-sm font-medium text-gray-600">
                        <span className="truncate text-left flex-1">
                          {statusFilter === "all"
                            ? "All Statuses"
                            : statusFilter.replace(/_/g, " ")}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category filter - always show all available categories */}
                  <div className="w-full sm:w-[200px]">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">
                      Category
                    </Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-11 rounded-full border-gray-200 focus:border-[var(--org-primary)] focus:ring-[var(--org-primary)]/20 px-4 text-sm font-medium text-gray-600">
                        <span className="truncate text-left flex-1">
                          {categoryFilter === "all"
                            ? "All Categories"
                            : formatCategory(categoryFilter)}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {formatCategory(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto sm:ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setCategoryFilter("all");
                        setStatusFilter("all");
                        setProjectFilter("all");
                        setSortOption("name-asc");
                      }}
                      className="h-11 rounded-full border-gray-200 text-gray-600 hover:bg-gray-100 px-6 w-full sm:w-auto"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto pr-1">
              {loadingItems ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  Loading {itemLabelPlural.toLowerCase()}...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 text-gray-500">
                  <PrimaryIcon className="w-10 h-10 text-[var(--org-primary)]/60" />
                  <p className="text-sm">
                    No {itemLabelPlural.toLowerCase()} match your current filters.
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-6"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
                >
                  {filteredItems.map((item) => {
                    const isSelected = selectedItems.some(
                      (selected) => selected.id === item.id
                    );
                    return (
                      <div
                        key={item.id}
                        className={`group relative flex h-full flex-col justify-between rounded-3xl border bg-white/95 p-5 transition-all duration-300 shadow-[0_18px_35px_-22px_rgba(14,40,50,0.55)] hover:-translate-y-1 hover:shadow-[0_26px_45px_-25px_rgba(14,40,50,0.6)] ${
                          isSelected
                            ? "border-[var(--org-primary)]/60 ring-1 ring-[var(--org-primary)]/20"
                            : "border-gray-200/80 hover:border-[var(--org-primary)]/35"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_8px_20px_-12px_rgba(15,45,55,0.4)]"
                            style={{
                              background: item.imageUrl
                                ? `linear-gradient(150deg, ${mutedBg}, #ffffff)`
                                : `linear-gradient(150deg, ${mutedBg}, rgba(255,255,255,0.95))`,
                            }}
                          >
                            {item.imageUrl && !isConsumableRequest ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-semibold text-[var(--org-primary)]">
                                {item.fallbackInitial}
                              </span>
                            )}
                            <div className="absolute inset-0 rounded-2xl border border-white/50" />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <h4 className="text-base font-semibold text-gray-900 leading-tight">
                                  {item.name}
                                </h4>
                                {item.tag && (
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                    {item.tag}
                                  </p>
                                )}
                              </div>
                              <Badge className="rounded-full bg-[var(--org-primary)]/12 text-[var(--org-primary)] border border-[var(--org-primary)]/20 px-3 py-1">
                                {item.status 
                                  ? (isConsumableRequest 
                                      ? formatCategory(item.status) 
                                      : item.status.replace(/_/g, " "))
                                  : (isConsumableRequest 
                                      ? "In Stock" 
                                      : "Available")}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-600">
                              {item.category && (
                                <Badge
                                  className="rounded-full border px-3 py-1 shadow-sm"
                                  style={{
                                    background: `linear-gradient(135deg, ${highlightColor}22, ${highlightColor}14)`,
                                    color: highlightColor,
                                    borderColor: `${highlightColor}40`,
                                  }}
                                >
                                  {formatCategory(item.category)}
                                </Badge>
                              )}
                              {item.location && (
                                <Badge className="rounded-full bg-white text-gray-600 border border-gray-200 px-3 py-1">
                                  {item.location}
                                </Badge>
                              )}
                              {isConsumableRequest && item.currentStock !== null && (
                                <Badge className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
                                  In stock: {item.currentStock}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <span
                            className="text-xs font-medium uppercase tracking-wide"
                            style={{ color: highlightColor }}
                          >
                            {itemLabel}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              asChild
                              type="button"
                              variant="outline"
                              className="flex items-center gap-2 rounded-full border-gray-200 text-gray-600 hover:bg-gray-100"
                            >
                              <Link href={`${viewPathBase}/${item.id}`}>
                                <Eye className="w-4 h-4" />
                                View
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant={isSelected ? "secondary" : "default"}
                              onClick={() => handleItemToggle(item)}
                              className={
                                isSelected
                                  ? "bg-white text-[var(--org-primary)] border border-[var(--org-primary)]/40 hover:bg-[var(--org-primary)]/10"
                                  : "bg-org-gradient text-white shadow-lg hover:shadow-xl"
                              }
                            >
                              {isSelected ? "Remove" : "Add"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen(false)}
                className="rounded-full px-6"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
