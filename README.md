# RETC Asset Management System

## Table of Contents
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Features](#features)
- [Setup & Configuration](#setup--configuration)
- [API Documentation](#api-documentation)
- [User Guides](#user-guides)
- [Database Schema](#database-schema)
- [Technical Specifications](#technical-specifications)
- [Troubleshooting](#troubleshooting)

## System Overview

The Renewable Energy Training Center (RETC) Asset Management System is a comprehensive web application designed to manage physical assets, equipment, and resources. The system provides role-based access control, asset lifecycle management, request workflows, and a public guest portal for asset browsing.

### Key Capabilities
- **Asset Lifecycle Management**: Track assets from acquisition to disposal
- **Request & Approval Workflows**: Staff can request assets with admin approval
- **Multi-Role Access Control**: System Admin, Asset Admin, Senior Manager, Staff, and Guest roles
- **Guest Portal**: Public catalog for browsing available assets
- **Audit Trail**: Complete activity tracking for all asset operations
- **File Management**: Support for asset images and documentation

## Architecture

### Technology Stack
- **Frontend**: Next.js 15.1.3 with React 19
- **Backend**: Appwrite (Backend-as-a-Service)
- **Database**: Appwrite Database with NoSQL collections
- **Authentication**: Appwrite Auth with role-based access
- **Storage**: Appwrite Storage for file attachments
- **UI Framework**: Tailwind CSS with Shadcn/ui components
- **Language**: JavaScript (ES6+)

### Project Structure
\`\`\`
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin-only pages
│   │   ├── requests/             # Request management
│   │   └── issue/[requestId]/    # Asset issuance
│   ├── assets/                   # Asset management
│   │   ├── [id]/                 # Asset details
│   │   └── new/                  # Create asset
│   ├── guest/                    # Public guest portal
│   │   └── assets/               # Public asset catalog
│   ├── requests/                 # Staff request pages
│   ├── login/                    # Authentication
│   ├── setup/                    # Initial system setup
│   └── api/                      # API routes
│       └── guest/                # Public API endpoints
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── assets/                   # Asset-related components
│   ├── requests/                 # Request components
│   ├── layout/                   # Layout components
│   └── ui/                       # Shadcn/ui components
├── lib/                          # Utility libraries
│   ├── appwrite/                 # Appwrite configuration
│   └── utils/                    # Helper functions
└── public/                       # Static assets
\`\`\`

## User Roles & Permissions

### System Administrator
- **Full system access**
- Manage all users and roles
- Configure system settings
- Access all assets and requests
- Generate reports and exports
- Manage departments and categories

### Asset Administrator
- **Asset management focus**
- Create, edit, and delete assets
- Manage asset lifecycle and conditions
- Approve/deny asset requests
- Issue and return assets
- View asset reports

### Senior Manager
- **Oversight and approval**
- View all assets and requests
- Approve high-value requests (configurable threshold)
- Generate departmental reports
- Manage staff within department

### Staff
- **Basic asset interaction**
- Browse available assets
- Submit asset requests
- View personal request history
- Return borrowed assets
- Update asset conditions when in custody

### Guest (Public)
- **Read-only access**
- Browse public asset catalog
- View asset details (limited information)
- Search and filter assets
- No authentication required

## Features

### Asset Management
- **Asset CRUD Operations**: Create, read, update, delete assets
- **Lifecycle Tracking**: Status progression from Available → Reserved → In Use → Returned
- **Condition Management**: Track physical condition (Excellent, Good, Fair, Poor, Damaged)
- **Public Visibility**: Control which assets appear in guest portal
- **File Attachments**: Support for images, manuals, and documentation
- **Categorization**: Organize by department, category, and subcategory
- **Search & Filtering**: Advanced search with multiple filter criteria

### Request Workflows
- **Request Submission**: Staff can request available assets
- **Approval Process**: Configurable approval thresholds by asset value
- **Asset Issuance**: Admin workflow for issuing approved requests
- **Return Processing**: Track asset returns and condition updates
- **Request History**: Complete audit trail of all requests

### Guest Portal
- **Public Catalog**: Browse assets marked as publicly visible
- **Asset Search**: Search by name, description, category
- **Detailed Views**: View asset specifications and images
- **Responsive Design**: Mobile-friendly interface
- **Call-to-Action**: Encourage visitors to sign in for requests

### Authentication & Security
- **Role-Based Access**: Granular permissions by user role
- **Session Management**: Secure authentication with Appwrite
- **Route Protection**: Authenticated routes with role validation
- **Setup Wizard**: First-run configuration for system admin

## Setup & Configuration

### Prerequisites
- Node.js 18+ and npm
- Appwrite instance (cloud or self-hosted)
- Modern web browser

### Environment Variables
Create a `.env.local` file with the following variables:

\`\`\`env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
\`\`\`

### Installation Steps

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd retc-asset-manager
   npm install
   \`\`\`

2. **Configure Appwrite**
   - Create new Appwrite project
   - Set up authentication with email/password
   - Configure user roles and permissions
   - Create database collections (see Database Schema)

3. **Run Setup Wizard**
   \`\`\`bash
   npm run dev
   \`\`\`
   Navigate to `/setup` to configure initial system admin

4. **Configure Collections**
   The system will automatically create required collections:
   - assets
   - requests
   - staff
   - departments
   - categories
   - activity_logs

### Appwrite Configuration

#### Authentication Settings
- Enable email/password authentication
- Configure session length (recommended: 30 days)
- Set up password requirements

#### Database Permissions
Configure collection-level permissions for each user role:
- **System Admin**: Full CRUD access to all collections
- **Asset Admin**: CRUD access to assets, requests, activity_logs
- **Senior Manager**: Read access to all, write access to requests
- **Staff**: Read access to assets, CRUD access to own requests
- **Guest**: Read access to public assets only

## API Documentation

### Guest API Endpoints

#### GET /api/guest/assets
Retrieve public assets with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12, max: 50)
- `search` (string): Search term for name/description
- `category` (string): Filter by category
- `department` (string): Filter by department
- `condition` (string): Filter by condition

**Response:**
\`\`\`json
{
  "assets": [
    {
      "id": "asset_id",
      "name": "Asset Name",
      "description": "Asset description",
      "category": "Category Name",
      "department": "Department Name",
      "condition": "Excellent",
      "status": "Available",
      "images": ["image_url"],
      "specifications": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "totalPages": 4
  }
}
\`\`\`

#### GET /api/guest/assets/[id]
Retrieve specific asset details for public viewing.

**Response:**
\`\`\`json
{
  "id": "asset_id",
  "name": "Asset Name",
  "description": "Detailed description",
  "category": "Category Name",
  "department": "Department Name",
  "condition": "Excellent",
  "status": "Available",
  "images": ["image_url"],
  "specifications": {...},
  "created_at": "2024-01-01T00:00:00.000Z"
}
\`\`\`

#### GET /api/guest/brand
Retrieve branding configuration for guest portal.

**Response:**
\`\`\`json
{
  "organization_name": "RETC",
  "tagline": "Renewable Energy Training Center",
  "primary_color": "#059669",
  "logo_url": "logo_url"
}
\`\`\`

## User Guides

### For System Administrators

#### Initial Setup
1. Access `/setup` after installation
2. Create system administrator account
3. Configure organization details
4. Set up departments and categories
5. Configure approval thresholds

#### User Management
1. Navigate to Admin → Users
2. Create user accounts with appropriate roles
3. Assign users to departments
4. Configure role-specific permissions

#### System Configuration
1. Access Admin → Settings
2. Configure approval thresholds
3. Set up email notifications
4. Customize branding for guest portal

### For Asset Administrators

#### Adding New Assets
1. Navigate to Assets → New Asset
2. Fill in required information:
   - Name and description
   - Category and department
   - Condition and status
   - Specifications
   - Upload images/documents
3. Set public visibility if appropriate
4. Save asset

#### Managing Requests
1. Access Admin → Requests
2. Review pending requests
3. Approve or deny with notes
4. Issue approved assets via Issue workflow
5. Process returns and update conditions

### For Staff Members

#### Requesting Assets
1. Browse Assets catalog
2. Click "Request" on desired asset
3. Fill out request form:
   - Purpose and duration
   - Expected return date
   - Additional notes
4. Submit for approval

#### Tracking Requests
1. Navigate to My Requests
2. View request status and history
3. Receive notifications for status changes
4. Process returns when ready

### For Guests (Public Users)

#### Browsing Assets
1. Visit guest portal at `/guest`
2. Browse featured assets or search catalog
3. Use filters to narrow results:
   - Category
   - Department
   - Condition
4. View detailed asset information
5. Sign in to request assets

## Database Schema

### Collections Overview

#### assets
Primary collection for all physical assets.

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Asset name
- `description` (text): Detailed description
- `category_id` (string): Reference to categories collection
- `department_id` (string): Reference to departments collection
- `status` (string): Current status (Available, Reserved, In Use, etc.)
- `condition` (string): Physical condition (Excellent, Good, Fair, Poor, Damaged)
- `acquisition_date` (datetime): When asset was acquired
- `acquisition_cost` (number): Purchase price
- `current_value` (number): Current estimated value
- `serial_number` (string): Manufacturer serial number
- `model_number` (string): Model identifier
- `specifications` (object): Technical specifications
- `images` (array): Array of image URLs
- `attachments` (array): Array of document URLs
- `public_visible` (boolean): Show in guest portal
- `location` (string): Current physical location
- `assigned_to` (string): Current user assignment
- `created_by` (string): User who created asset
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

#### requests
Asset request submissions and tracking.

**Fields:**
- `id` (string): Unique identifier
- `asset_id` (string): Reference to requested asset
- `requester_id` (string): Staff member making request
- `status` (string): Request status (Pending, Approved, Denied, Issued, Returned)
- `purpose` (text): Reason for request
- `expected_duration` (number): Expected usage duration in days
- `expected_return_date` (datetime): When asset should be returned
- `priority` (string): Request priority (Low, Medium, High, Urgent)
- `approval_notes` (text): Admin notes on approval/denial
- `approved_by` (string): Admin who approved request
- `approved_at` (datetime): Approval timestamp
- `issued_by` (string): Admin who issued asset
- `issued_at` (datetime): Issuance timestamp
- `returned_at` (datetime): Return timestamp
- `return_condition` (string): Condition when returned
- `return_notes` (text): Notes about return
- `created_at` (datetime): Request creation timestamp
- `updated_at` (datetime): Last update timestamp

#### staff
User accounts and profile information.

**Fields:**
- `id` (string): Unique identifier (matches Appwrite user ID)
- `email` (string): Email address
- `name` (string): Full name
- `role` (string): User role
- `department_id` (string): Reference to departments collection
- `phone` (string): Phone number
- `employee_id` (string): Employee identifier
- `active` (boolean): Account status
- `created_at` (datetime): Account creation timestamp
- `updated_at` (datetime): Last update timestamp

#### departments
Organizational departments.

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Department name
- `description` (text): Department description
- `manager_id` (string): Department manager user ID
- `budget_code` (string): Budget/cost center code
- `active` (boolean): Department status
- `created_at` (datetime): Creation timestamp

#### categories
Asset categorization system.

**Fields:**
- `id` (string): Unique identifier
- `name` (string): Category name
- `description` (text): Category description
- `parent_id` (string): Parent category (for subcategories)
- `active` (boolean): Category status
- `created_at` (datetime): Creation timestamp

#### activity_logs
Comprehensive audit trail.

**Fields:**
- `id` (string): Unique identifier
- `entity_type` (string): Type of entity (asset, request, user)
- `entity_id` (string): ID of affected entity
- `action` (string): Action performed
- `user_id` (string): User who performed action
- `details` (object): Additional action details
- `ip_address` (string): User's IP address
- `user_agent` (string): User's browser information
- `created_at` (datetime): Action timestamp

## Technical Specifications

### Performance Considerations
- **Pagination**: All list views implement server-side pagination
- **Image Optimization**: Next.js Image component for optimized loading
- **Lazy Loading**: Components load on demand
- **Caching**: Appwrite handles query caching automatically

### Security Features
- **Authentication**: Secure session management with Appwrite
- **Authorization**: Role-based access control on all routes
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Restricted file types and sizes
- **SQL Injection Prevention**: NoSQL database with parameterized queries

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Responsiveness
- Responsive design with Tailwind CSS
- Touch-friendly interface
- Optimized for tablets and smartphones
- Progressive Web App capabilities

## Troubleshooting

### Common Issues

#### Authentication Problems
**Issue**: Users cannot log in
**Solutions**:
1. Verify Appwrite endpoint and project ID
2. Check user account status in Appwrite console
3. Ensure proper role assignments
4. Clear browser cache and cookies

#### Asset Images Not Loading
**Issue**: Images don't display in asset catalog
**Solutions**:
1. Verify Appwrite storage permissions
2. Check file upload size limits
3. Ensure proper CORS configuration
4. Validate image file formats (JPG, PNG, WebP)

#### Request Workflow Issues
**Issue**: Requests stuck in pending status
**Solutions**:
1. Verify admin user permissions
2. Check approval threshold configurations
3. Ensure proper role assignments for approvers
4. Review activity logs for errors

#### Guest Portal Access
**Issue**: Public assets not visible
**Solutions**:
1. Verify asset `public_visible` flag is true
2. Check guest API permissions in Appwrite
3. Ensure assets have "Available" status
4. Validate collection-level permissions

### Performance Issues
**Issue**: Slow page loading
**Solutions**:
1. Optimize image sizes and formats
2. Implement proper pagination limits
3. Use Appwrite query indexes
4. Enable browser caching

### Database Issues
**Issue**: Collection permission errors
**Solutions**:
1. Review Appwrite collection permissions
2. Verify user role assignments
3. Check API key permissions
4. Validate database ID configuration

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor system performance and usage
- Review and archive old activity logs
- Update user roles and permissions
- Backup database regularly
- Update dependencies and security patches

### Monitoring
- Track user activity through activity logs
- Monitor asset utilization rates
- Review request approval patterns
- Analyze guest portal usage

### Scaling Considerations
- Appwrite handles automatic scaling
- Consider CDN for image delivery at scale
- Implement search indexing for large asset catalogs
- Monitor database query performance

---

## License
This project is proprietary software developed for the Renewable Energy Training Center (RETC).

For technical support or feature requests, contact the development team.
