"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Download,
  Upload,
  X,
  Package,
  AlertTriangle,
  Settings,
  DollarSign,
  MapPin,
  FileText
} from "lucide-react"
import { assetsService } from "../../../lib/appwrite/provider.js"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { ENUMS } from "../../../lib/appwrite/config.js"
import { formatCategory, getStatusBadgeColor, getConditionBadgeColor } from "../../../lib/utils/mappings.js"

export default function AdminAssetManagement() {
  const [staff, setStaff] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCondition, setFilterCondition] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // New asset form state - matching Appwrite collection attributes
  const [newAsset, setNewAsset] = useState({
    assetTag: "",
    serialNumber: "",
    name: "",
    category: ENUMS.CATEGORY.IT_EQUIPMENT,
    subcategory: "",
    model: "",
    manufacturer: "",
    departmentId: "",
    custodianStaffId: "",
    availableStatus: ENUMS.AVAILABLE_STATUS.AVAILABLE,
    currentCondition: ENUMS.CURRENT_CONDITION.NEW,
    locationName: "",
    roomOrArea: "",
    purchaseDate: "",
    warrantyExpiryDate: "",
    lastMaintenanceDate: "",
    nextMaintenanceDue: "",
    lastInventoryCheck: "",
    retirementDate: "",
    disposalDate: "",
    attachmentFileIds: [],
    isPublic: false,
    publicSummary: "",
    publicImages: "",
    publicLocationLabel: "",
    publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW
  })

  useEffect(() => {
    checkPermissionsAndLoadData()
  }, [])

  const checkPermissionsAndLoadData = async () => {
    try {
      const currentStaff = await getCurrentStaff()
      if (!currentStaff || !permissions.canManageAssets(currentStaff)) {
        window.location.href = "/unauthorized"
        return
      }
      setStaff(currentStaff)
      await loadAssets()
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssets = async () => {
    try {
      const result = await assetsService.list()
      setAssets(result.documents)
    } catch (error) {
      console.error("Failed to load assets:", error)
    }
  }

  const handleCreateAsset = async () => {
    try {
      // Generate asset tag if not provided
      const assetTag = newAsset.assetTag || `RETC-${Date.now()}`
      
      // Prepare asset data matching Appwrite collection schema
      const assetData = {
        assetTag,
        serialNumber: newAsset.serialNumber || "",
        name: newAsset.name,
        category: newAsset.category,
        subcategory: newAsset.subcategory || "",
        model: newAsset.model || "",
        manufacturer: newAsset.manufacturer || "",
        departmentId: newAsset.departmentId || "",
        custodianStaffId: newAsset.custodianStaffId || "",
        availableStatus: newAsset.availableStatus,
        currentCondition: newAsset.currentCondition,
        locationName: newAsset.locationName || "",
        roomOrArea: newAsset.roomOrArea || "",
        purchaseDate: newAsset.purchaseDate || null,
        warrantyExpiryDate: newAsset.warrantyExpiryDate || null,
        lastMaintenanceDate: newAsset.lastMaintenanceDate || null,
        nextMaintenanceDue: newAsset.nextMaintenanceDue || null,
        lastInventoryCheck: newAsset.lastInventoryCheck || null,
        retirementDate: newAsset.retirementDate || null,
        disposalDate: newAsset.disposalDate || null,
        attachmentFileIds: newAsset.attachmentFileIds || [],
        isPublic: newAsset.isPublic || false,
        publicSummary: newAsset.publicSummary || "",
        publicImages: newAsset.publicImages || "",
        publicLocationLabel: newAsset.publicLocationLabel || "",
        publicConditionLabel: newAsset.publicConditionLabel || ENUMS.PUBLIC_CONDITION_LABEL.NEW
      }

      await assetsService.create(assetData, staff.$id)
      
      // Reset form and refresh assets
      setNewAsset({
        assetTag: "",
        serialNumber: "",
        name: "",
        category: ENUMS.CATEGORY.IT_EQUIPMENT,
        subcategory: "",
        model: "",
        manufacturer: "",
        departmentId: "",
        custodianStaffId: "",
        availableStatus: ENUMS.AVAILABLE_STATUS.AVAILABLE,
        currentCondition: ENUMS.CURRENT_CONDITION.NEW,
        locationName: "",
        roomOrArea: "",
        purchaseDate: "",
        warrantyExpiryDate: "",
        lastMaintenanceDate: "",
        nextMaintenanceDue: "",
        lastInventoryCheck: "",
        retirementDate: "",
        disposalDate: "",
        attachmentFileIds: [],
        isPublic: false,
        publicSummary: "",
        publicImages: "",
        publicLocationLabel: "",
        publicConditionLabel: ENUMS.PUBLIC_CONDITION_LABEL.NEW
      })
      
      setShowAddDialog(false)
      await loadAssets()
    } catch (error) {
      console.error("Failed to create asset:", error)
      alert("Failed to create asset. Please try again.")
    }
  }

  const handleDeleteAsset = async (assetId) => {
    if (!confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      return
    }

    try {
      await assetsService.delete(assetId)
      await loadAssets()
    } catch (error) {
      console.error("Failed to delete asset:", error)
      alert("Failed to delete asset. Please try again.")
    }
  }

  // Filter assets based on search and filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === "all" || asset.category === filterCategory
    const matchesStatus = filterStatus === "all" || asset.availableStatus === filterStatus
    const matchesCondition = filterCondition === "all" || asset.currentCondition === filterCondition

    return matchesSearch && matchesCategory && matchesStatus && matchesCondition
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600">Manage system assets, inventory, and equipment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 bg-white border-b pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-semibold">Add New Asset</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">Create a new asset record in the system with detailed information</DialogDescription>
                  </div>
                  <DialogClose asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </DialogClose>
                </div>
              </DialogHeader>
              
              <div className="space-y-8 pb-4">
                {/* Basic Information */}
                <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="assetTag" className="text-sm font-medium text-gray-700">Asset Tag</Label>
                      <Input
                        id="assetTag"
                        value={newAsset.assetTag}
                        onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                        placeholder="Auto-generated if empty"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Asset Name *</Label>
                      <Input
                        id="name"
                        value={newAsset.name}
                        onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                        placeholder="e.g., Dell Laptop XPS 13"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                      <Select value={newAsset.category} onValueChange={(value) => setNewAsset({ ...newAsset, category: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ENUMS.CATEGORY).map((category) => (
                            <SelectItem key={category} value={category}>
                              {formatCategory(category)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">Subcategory</Label>
                      <Input
                        id="subcategory"
                        value={newAsset.subcategory}
                        onChange={(e) => setNewAsset({ ...newAsset, subcategory: e.target.value })}
                        placeholder="e.g., Laptop, Desktop, Server"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        value={newAsset.serialNumber}
                        onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                        placeholder="e.g., ABC123456"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="bg-blue-50 p-6 rounded-lg space-y-6">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Technical Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="model" className="text-sm font-medium text-gray-700">Model</Label>
                      <Input
                        id="model"
                        value={newAsset.model}
                        onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                        placeholder="e.g., XPS-13-9310"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="manufacturer" className="text-sm font-medium text-gray-700">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={newAsset.manufacturer}
                        onChange={(e) => setNewAsset({ ...newAsset, manufacturer: e.target.value })}
                        placeholder="e.g., Dell Technologies"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase & Warranty Information */}
                <div className="bg-green-50 p-6 rounded-lg space-y-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Purchase & Warranty Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="purchaseDate" className="text-sm font-medium text-gray-700">Purchase Date</Label>
                      <Input
                        id="purchaseDate"
                        type="datetime-local"
                        value={newAsset.purchaseDate}
                        onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="warrantyExpiryDate" className="text-sm font-medium text-gray-700">Warranty Expiry Date</Label>
                      <Input
                        id="warrantyExpiryDate"
                        type="datetime-local"
                        value={newAsset.warrantyExpiryDate}
                        onChange={(e) => setNewAsset({ ...newAsset, warrantyExpiryDate: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Location */}
                <div className="bg-purple-50 p-6 rounded-lg space-y-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Status & Location</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="currentCondition" className="text-sm font-medium text-gray-700">Current Condition</Label>
                      <Select value={newAsset.currentCondition} onValueChange={(value) => setNewAsset({ ...newAsset, currentCondition: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ENUMS.CURRENT_CONDITION).map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="availableStatus" className="text-sm font-medium text-gray-700">Available Status</Label>
                      <Select value={newAsset.availableStatus} onValueChange={(value) => setNewAsset({ ...newAsset, availableStatus: value })}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="locationName" className="text-sm font-medium text-gray-700">Location Name</Label>
                      <Input
                        id="locationName"
                        value={newAsset.locationName}
                        onChange={(e) => setNewAsset({ ...newAsset, locationName: e.target.value })}
                        placeholder="e.g., Building A"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="roomOrArea" className="text-sm font-medium text-gray-700">Room/Area</Label>
                      <Input
                        id="roomOrArea"
                        value={newAsset.roomOrArea}
                        onChange={(e) => setNewAsset({ ...newAsset, roomOrArea: e.target.value })}
                        placeholder="e.g., Room 101"
                        className="h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="publicLocationLabel" className="text-sm font-medium text-gray-700">Public Location Label</Label>
                    <Input
                      id="publicLocationLabel"
                      value={newAsset.publicLocationLabel}
                      onChange={(e) => setNewAsset({ ...newAsset, publicLocationLabel: e.target.value })}
                      placeholder="e.g., Main Lab (visible to guests)"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Public Information */}
                <div className="bg-orange-50 p-6 rounded-lg space-y-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Public Information</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={newAsset.isPublic}
                        onChange={(e) => setNewAsset({ ...newAsset, isPublic: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isPublic" className="text-sm font-medium text-gray-700">Make this asset visible in guest portal</Label>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="publicSummary" className="text-sm font-medium text-gray-700">Public Summary</Label>
                      <Textarea
                        id="publicSummary"
                        value={newAsset.publicSummary}
                        onChange={(e) => setNewAsset({ ...newAsset, publicSummary: e.target.value })}
                        placeholder="Brief description visible to guests and public viewers"
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="publicImages" className="text-sm font-medium text-gray-700">Public Images</Label>
                        <Input
                          id="publicImages"
                          value={newAsset.publicImages}
                          onChange={(e) => setNewAsset({ ...newAsset, publicImages: e.target.value })}
                          placeholder="Image URLs or file IDs"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="publicConditionLabel" className="text-sm font-medium text-gray-700">Public Condition Label</Label>
                        <Select value={newAsset.publicConditionLabel} onValueChange={(value) => setNewAsset({ ...newAsset, publicConditionLabel: value })}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ENUMS.PUBLIC_CONDITION_LABEL).map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-6">
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm text-gray-500">
                    Fields marked with * are required
                  </p>
                  <div className="flex items-center space-x-3">
                    <DialogClose asChild>
                      <Button variant="outline" className="px-6">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      onClick={handleCreateAsset} 
                      disabled={!newAsset.name || !newAsset.category}
                      className="px-6 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Asset
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assets.filter(a => a.availableStatus === ENUMS.AVAILABLE_STATUS.AVAILABLE).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assets.filter(a => a.availableStatus === ENUMS.AVAILABLE_STATUS.IN_USE).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assets.filter(a => a.availableStatus === ENUMS.AVAILABLE_STATUS.MAINTENANCE).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(ENUMS.CATEGORY).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ENUMS.AVAILABLE_STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={filterCondition} onValueChange={setFilterCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {Object.values(ENUMS.CURRENT_CONDITION).map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets ({filteredAssets.length})</CardTitle>
          <CardDescription>Manage and track all system assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.$id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          {asset.serialNumber && (
                            <p className="text-sm text-gray-500">S/N: {asset.serialNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatCategory(asset.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(asset.availableStatus)}>
                          {asset.availableStatus.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getConditionBadgeColor(asset.currentCondition)}>
                          {asset.currentCondition.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.locationName || asset.roomOrArea || 'Not specified'}</TableCell>
                      <TableCell>
                        <span className="text-gray-500">-</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/assets/${asset.$id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/assets/${asset.$id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAsset(asset.$id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No assets found</p>
                        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}