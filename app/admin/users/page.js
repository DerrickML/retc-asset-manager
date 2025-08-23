"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { DataTable } from "../../../components/ui/data-table"
import { EmptyUsers } from "../../../components/ui/empty-state"
import { PageLoading } from "../../../components/ui/loading"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Checkbox } from "../../../components/ui/checkbox"
import { Plus, Search, Edit, Trash2, UserCheck, UserX, User, Mail, Shield, Building, Phone, Hash, AlertCircle, X, Loader2, CheckCircle, Copy } from "lucide-react"
import { staffService, departmentsService } from "../../../lib/appwrite/provider.js"
import { register } from "../../../lib/utils/auth.js"
import { getCurrentStaff, permissions } from "../../../lib/utils/auth.js"
import { ENUMS } from "../../../lib/appwrite/config.js"

// Available user roles that match the collection array values
const USER_ROLES = ["STAFF", "SYSTEM_ADMIN", "ASSET_ADMIN"]

// Helper function to format role for display
const formatRole = (role) => {
  const roleMap = {
    STAFF: "Staff",
    SYSTEM_ADMIN: "System Administrator", 
    ASSET_ADMIN: "Asset Administrator"
  }
  return roleMap[role] || role
}

// Helper function to get role badge color
const getRoleBadgeColor = (roles) => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return "bg-gray-100 text-gray-800"
  
  if (roles.includes("SYSTEM_ADMIN")) return "bg-red-100 text-red-800"
  if (roles.includes("ASSET_ADMIN")) return "bg-blue-100 text-blue-800"
  return "bg-green-100 text-green-800"
}

export default function UserManagement() {
  const [currentStaff, setCurrentStaff] = useState(null)
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [creationStep, setCreationStep] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Initialize new user with correct field names
  const [newUser, setNewUser] = useState({
    userId: "",
    name: "",
    email: "",
    otherEmail: "",
    phoneNumber: "",
    phoneNumber2: "",
    departmentId: "",
    roles: ["STAFF"], // Array of roles, default to STAFF
    active: true
  })

  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      // Get current staff for permission checking
      const staff = await getCurrentStaff()
      if (!staff || !permissions.canManageUsers(staff)) {
        window.location.href = "/unauthorized"
        return
      }
      setCurrentStaff(staff)
      
      // Load users and departments
      await Promise.all([
        loadUsers(),
        loadDepartments()
      ])
    } catch (error) {
      console.error("Error initializing data:", error)
      setError("Failed to load data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await staffService.list()
      setUsers(response.documents || [])
    } catch (error) {
      console.error("Error loading users:", error)
      throw error
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await departmentsService.list()
      setDepartments(response.documents || [])
    } catch (error) {
      console.error("Error loading departments:", error)
      throw error
    }
  }

  const validateUserData = (userData) => {
    const errors = []
    
    if (!userData.name || userData.name.trim().length === 0) {
      errors.push("Name is required")
    }
    
    if (!userData.email || userData.email.trim().length === 0) {
      errors.push("Email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push("Please enter a valid email address")
    }
    
    if (userData.otherEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.otherEmail)) {
      errors.push("Please enter a valid secondary email address")
    }
    
    if (!Array.isArray(userData.roles) || userData.roles.length === 0) {
      errors.push("At least one role must be selected")
    }
    
    return errors
  }

  const resetNewUser = () => {
    setNewUser({
      userId: "",
      name: "",
      email: "",
      otherEmail: "",
      phoneNumber: "",
      phoneNumber2: "",
      departmentId: "",
      roles: ["STAFF"],
      active: true
    })
  }

  const createUser = async () => {
    setSubmitting(true)
    setError("")
    setCreationStep("Validating user data...")
    
    try {
      // Validate input data
      const validationErrors = validateUserData(newUser)
      if (validationErrors.length > 0) {
        setError(validationErrors.join(", "))
        return
      }

      // Check if email already exists
      setCreationStep("Checking email availability...")
      const existingUsers = await staffService.list()
      const emailExists = existingUsers.documents.some(user => 
        user.email?.toLowerCase() === newUser.email.toLowerCase()
      )
      
      if (emailExists) {
        setError("A user with this email already exists")
        return
      }

      // Generate a temporary password for the new user
      setCreationStep("Generating secure credentials...")
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`
      
      // Create the user account in Appwrite Auth
      setCreationStep("Creating user account...")
      const authUser = await register(newUser.email, tempPassword, newUser.name)
      if (!authUser) {
        setError("Failed to create user account")
        return
      }

      // Generate userId if not provided
      const generatedUserId = newUser.userId?.trim() || `USR${Date.now().toString().slice(-6)}`
      
      // Prepare staff data with correct field names matching the collection
      const staffData = {
        userId: generatedUserId,
        name: newUser.name.trim(),
        email: newUser.email.toLowerCase().trim(),
        otherEmail: newUser.otherEmail ? newUser.otherEmail.toLowerCase().trim() : null,
        phoneNumber: newUser.phoneNumber?.trim() || null,
        phoneNumber2: newUser.phoneNumber2?.trim() || null,
        departmentId: newUser.departmentId || null,
        roles: newUser.roles, // Array of role strings
        active: true
      }

      // Create the staff document in the database
      setCreationStep("Setting up user profile...")
      await staffService.create(staffData)

      // Send welcome email with temporary password
      setCreationStep("Sending welcome email...")
      try {
        const departmentName = newUser.departmentId ? 
          departments.find(d => d.$id === newUser.departmentId)?.name : null

        const welcomeEmailData = {
          userName: newUser.name.trim(),
          userEmail: newUser.email.toLowerCase().trim(),
          userId: generatedUserId,
          roles: newUser.roles,
          department: departmentName,
          temporaryPassword: tempPassword
        }

        const emailResponse = await fetch('/api/notifications/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'USER_WELCOME',
            recipient: newUser.email.toLowerCase().trim(),
            data: welcomeEmailData
          })
        })

        if (!emailResponse.ok) {
          console.warn('Welcome email failed to send:', await emailResponse.text())
          // Don't fail user creation if email fails
        } else {
          console.log('Welcome email sent successfully')
        }
      } catch (emailError) {
        console.warn('Welcome email error:', emailError)
        // Don't fail user creation if email fails
      }

      setCreationStep("Finalizing setup...")
      await loadUsers()
      
      // Show success state
      setShowSuccess({
        userId: generatedUserId,
        email: newUser.email,
        name: newUser.name,
        tempPassword
      })
      
      // Reset form after short delay to show success
      setTimeout(() => {
        setIsCreateDialogOpen(false)
        resetNewUser()
        setShowSuccess(false)
      }, 4000)
      
    } catch (error) {
      console.error("Error creating user:", error)
      setError(error.message || "Failed to create user. Please try again.")
    } finally {
      setSubmitting(false)
      setCreationStep("")
    }
  }

  const updateUser = async (userId, updates) => {
    try {
      await staffService.update(userId, updates)
      await loadUsers()
      setEditingUser(null)
    } catch (error) {
      console.error("Error updating user:", error)
      setError("Failed to update user")
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      await updateUser(user.$id, { active: !user.active })
    } catch (error) {
      console.error("Error toggling user status:", error)
    }
  }

  const deleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await staffService.delete(user.$id)
      await loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      setError("Failed to delete user")
    }
  }

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "Unassigned"
    const dept = departments.find((d) => d.$id === departmentId)
    return dept ? dept.name : "Unknown Department"
  }

  const handleRoleToggle = (role, checked) => {
    setNewUser(prev => {
      const newRoles = checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
      
      // Ensure at least one role is always selected
      return {
        ...prev,
        roles: newRoles.length > 0 ? newRoles : ["STAFF"]
      }
    })
  }

  // Filter users based on search term and selected role
  const filteredUsers = users.filter((user) => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Role filter
    const matchesRole = selectedRole === "all" || 
      (user.roles && Array.isArray(user.roles) && user.roles.includes(selectedRole))
    
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-white border-b pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold">Create New User</DialogTitle>
                  <DialogDescription className="text-gray-600 mt-1">Add a new user to the system with appropriate role and permissions</DialogDescription>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>
            {/* Progress Indicator */}
            {submitting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Creating User Account</p>
                    <p className="text-xs text-blue-700">{creationStep}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: creationStep.includes('Validating') ? '10%' : 
                               creationStep.includes('Checking') ? '25%' : 
                               creationStep.includes('Generating') ? '40%' : 
                               creationStep.includes('Creating') ? '60%' : 
                               creationStep.includes('Setting') ? '75%' : 
                               creationStep.includes('Sending') ? '90%' : 
                               creationStep.includes('Finalizing') ? '100%' : '10%'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !submitting && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-900">Error Creating User</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setError("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Success State */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">User Created Successfully!</h3>
                    <p className="text-sm text-green-700">Account has been set up and welcome email sent.</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">User ID:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{showSuccess.userId}</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => navigator.clipboard.writeText(showSuccess.userId)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{showSuccess.email}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => navigator.clipboard.writeText(showSuccess.email)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Temporary Password:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-yellow-100 px-2 py-1 rounded font-mono">{showSuccess.tempPassword}</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => navigator.clipboard.writeText(showSuccess.tempPassword)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      📧 Welcome email sent to {showSuccess.name}
                      <br />
                      ⚠️ User should change password after first login
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`space-y-8 pb-4 transition-opacity duration-200 ${submitting ? 'opacity-60' : 'opacity-100'}`}>
              {/* Basic Information */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-6 relative">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="e.g., John Doe"
                      className="h-11"
                      disabled={submitting}
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Primary Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="e.g., john.doe@company.com"
                      className="h-11"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="otherEmail" className="text-sm font-medium text-gray-700">Other Email</Label>
                    <Input
                      id="otherEmail"
                      type="email"
                      value={newUser.otherEmail}
                      onChange={(e) => setNewUser({ ...newUser, otherEmail: e.target.value })}
                      placeholder="e.g., john.personal@gmail.com"
                      className="h-11"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Primary Phone</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={newUser.phoneNumber}
                      onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                      placeholder="e.g., +1 (555) 123-4567"
                      className="h-11"
                      disabled={submitting}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="phoneNumber2" className="text-sm font-medium text-gray-700">Secondary Phone</Label>
                  <div className="max-w-md">
                    <Input
                      id="phoneNumber2"
                      type="tel"
                      value={newUser.phoneNumber2}
                      onChange={(e) => setNewUser({ ...newUser, phoneNumber2: e.target.value })}
                      placeholder="e.g., +1 (555) 987-6543"
                      className="h-11"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Role & Permissions */}
              <div className="bg-blue-50 p-6 rounded-lg space-y-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Role & Permissions</h3>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">User Roles *</Label>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Select one or more roles for this user:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(USER_ROLES).map(([key, value]) => (
                        <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-blue-25 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newUser.roles.includes(value)}
                            onChange={(e) => handleRoleToggle(value, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={submitting}
                          />
                          <span className="text-sm font-medium text-gray-700">{value}</span>
                        </label>
                      ))}
                    </div>
                    {newUser.roles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-sm text-gray-600">Selected roles:</span>
                        {newUser.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="bg-green-50 p-6 rounded-lg space-y-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="departmentId" className="text-sm font-medium text-gray-700">Department</Label>
                    <Select
                      value={newUser.departmentId}
                      onValueChange={(value) => setNewUser({ ...newUser, departmentId: value })}
                      disabled={submitting}
                    >
                      <SelectTrigger className="h-11">
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
                  <div className="space-y-3">
                    <Label htmlFor="userId" className="text-sm font-medium text-gray-700">User ID</Label>
                    <Input
                      id="userId"
                      value={newUser.userId}
                      onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                      placeholder="e.g., USR001 (auto-generated if empty)"
                      className="h-11"
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500">Leave empty to auto-generate</p>
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
                    <Button 
                      variant="outline" 
                      className="px-6"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button 
                    onClick={createUser} 
                    disabled={!newUser.name || !newUser.email || newUser.roles.length === 0 || submitting}
                    className="px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(USER_ROLES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.$id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} className={getRoleBadgeColor(role)}>
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">No Role</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getDepartmentName(user.departmentId)}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "secondary"}>{user.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleUserStatus(user.$id, user.active)}>
                        {user.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteUser(user.$id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
