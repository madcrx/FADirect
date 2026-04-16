# FA Direct Web Portal - Complete Guide

## Overview
The FA Direct Web Portal is a comprehensive funeral arrangement management system with Phase 1-4 fully implemented.

## Features Implemented

### Phase 1: Core Management
✅ **Dashboard**
- Quick statistics overview
- Recent arrangements
- System status

✅ **Arrangements Management**
- Full CRUD operations
- Search and filter
- Status tracking (draft, active, completed, cancelled)
- Detailed arrangement forms with:
  - Deceased information
  - Funeral details (burial, cremation, traditional, memorial, etc.)
  - Service date and location
  - Family contact (mourner phone/name lookup)
  - Notes

✅ **User Management**
- Admin-only user CRUD
- Role-based access (admin, arranger, mourner)
- Phone number authentication

### Phase 2: Financial Management
✅ **Price Lists**
- 10 predefined categories (Casket & Coffin, Cremation Services, etc.)
- Create, edit, duplicate, delete price items
- Active/inactive toggle
- Category filtering

✅ **Invoicing System**
- Create invoices linked to arrangements
- Line item management (add, edit, remove)
- Add items from price list or manually
- Automatic total calculation (via database triggers)
- Payment recording with:
  - Multiple payment methods
  - Reference numbers
  - Payment amounts
- Status tracking: draft, sent, partial, paid, overdue, cancelled
- Automatic status updates based on payments

### Phase 3: Government Integration
✅ **Government Forms**
- BDM (Birth, Death and Marriages) death registration
- Coroner report submission
- Death certificate applications
- Status tracking: draft, submitted, in_progress, completed, rejected
- Reference number tracking
- Submission and completion date tracking
- Notes and form data storage

### Phase 4: Workflow & Analytics
✅ **Workflow Tracking**
- 9-step default workflow:
  1. Initial Contact & Consultation
  2. Complete Paperwork & Documentation
  3. Service Planning & Arrangements
  4. Government Submissions (BDM/Coroner)
  5. Deceased Preparation
  6. Service Execution
  7. Final Documentation & Certificates
  8. Invoicing & Payment
  9. Follow-up & Closure
- Visual progress bar
- Step-by-step completion with notes
- Completion timestamps

✅ **Document Checklist**
- 14 default required/optional documents:
  - Medical Certificate of Cause of Death (required)
  - Proof of Identity (required)
  - Marriage Certificate
  - Birth Certificate
  - Will or Testament
  - Insurance Policies
  - And more...
- Custom document support
- Progress tracking for required documents
- Visual warnings for missing required documents

✅ **Reports & Analytics**
- Financial reports:
  - Total revenue
  - Outstanding amount
  - Overdue invoices
  - Revenue by month (last 6 months)
- Arrangement statistics:
  - Active arrangements
  - Completed arrangements
  - Arrangements by funeral type
- Government submission tracking

## Database Schema

### Migrations Created:
1. `001_initial_schema.sql` - Users, arrangements, messages, documents, photos
2. `002_add_workflow_features.sql` - Workflow steps, funeral types
3. `003_add_soft_delete.sql` - Soft delete support (deleted_at columns)
4. `004_add_price_lists_invoices.sql` - Price lists, invoices, line items, payments
5. `005_add_government_forms.sql` - Government submissions, documents

### Key Features:
- Automatic invoice total calculation (trigger)
- Automatic paid amount calculation (trigger)
- Automatic status updates based on payments
- Soft delete support across all tables
- Phone number validation (E.164 format)

## API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code and login
- `GET /api/auth/me` - Get current user

### Arrangements
- `GET /api/arrangements` - List all arrangements
- `GET /api/arrangements/:id` - Get arrangement details
- `POST /api/arrangements` - Create arrangement
- `PUT /api/arrangements/:id` - Update arrangement
- `DELETE /api/arrangements/:id` - Soft delete arrangement
- `PUT /api/arrangements/:id/workflow/:stepId` - Update workflow step
- `POST /api/arrangements/:id/workflow` - Create workflow step

### Price Lists
- `GET /api/price-lists` - List all price items
- `POST /api/price-lists` - Create price item
- `PUT /api/price-lists/:id` - Update price item
- `DELETE /api/price-lists/:id` - Soft delete price item

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get invoice with line items and payments
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Soft delete invoice
- `POST /api/invoices/:id/line-items` - Add line item
- `PUT /api/invoices/:id/line-items/:lineItemId` - Update line item
- `DELETE /api/invoices/:id/line-items/:lineItemId` - Delete line item
- `POST /api/invoices/:id/payments` - Record payment
- `GET /api/invoices/:id/payments` - List payments

### Government Forms
- `GET /api/government-forms` - List all submissions
- `GET /api/government-forms/:id` - Get submission details
- `POST /api/government-forms` - Create submission
- `PUT /api/government-forms/:id` - Update submission
- `DELETE /api/government-forms/:id` - Soft delete submission

### Users (Admin only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Getting Started

### 1. Pull Latest Changes
```bash
cd C:\fad
git pull origin claude/funeral-app-communication-YC4Ka
```

### 2. Install Dependencies
```bash
# Backend
cd C:\fad\backend
npm install

# Frontend
cd C:\fad\web-portal
npm install
```

### 3. Run Database Migrations
```bash
cd C:\fad\backend
node src/migrations/run-migrations.js
```

### 4. Start Backend Server
```bash
cd C:\fad\backend
node server.js
```

### 5. Start Frontend (New Terminal)
```bash
cd C:\fad\web-portal
npm run dev
```

### 6. Access Portal
Open browser to: `http://localhost:5173`

Login with phone number (will auto-format to +61 format):
- Enter: `0406907849` or `+610406907849`
- Code: `123456` (development mode)

## Navigation

The portal includes the following sections:

1. **Dashboard** - Overview and quick stats
2. **Arrangements** - Manage funeral arrangements
3. **Users** - User management (admin only)
4. **Price Lists** - Service pricing management
5. **Invoicing** - Invoice and payment management
6. **Government Forms** - BDM and Coroner submissions
7. **Reports** - Analytics and reporting
8. **Settings** - (Coming soon)

## Arrangement Detail Page

Each arrangement has 5 tabs:

1. **Workflow** - Visual step-by-step progress tracking
2. **Checklist** - Document collection tracker
3. **Messages** - Communication history
4. **Documents** - Uploaded documents
5. **Photos** - Photo gallery

## Key Features to Try

### Create a New Arrangement
1. Go to Arrangements → New Arrangement
2. Fill in deceased details
3. Select funeral type
4. Enter mourner phone number (auto-creates/finds mourner)
5. Save

### Create an Invoice
1. Go to Invoicing → New Invoice
2. Select arrangement
3. Add line items from price list or manually
4. Set due date
5. Save (total calculated automatically)

### Record a Payment
1. Open an invoice
2. Click "Record Payment"
3. Enter amount, payment method, reference
4. Save (status updates automatically)

### Track Workflow
1. Open an arrangement
2. Go to Workflow tab
3. Click checkboxes to mark steps complete
4. Add notes for each step

### Document Checklist
1. Open an arrangement
2. Go to Checklist tab
3. Check off collected documents
4. Add custom documents as needed

## Technical Details

### Phone Number Formatting
- Accepts: `0406907849` or `+610406907849`
- Stored as: `+610406907849` (E.164 format)
- Auto-formats on both frontend and backend

### Currency
- All amounts in AUD
- Formatted as: $X,XXX.XX

### Dates
- Service dates, due dates, submission dates
- Formatted as: dd MMM yyyy or dd/MM/yyyy HH:mm

### Status Colors
- Draft: Grey
- Active/Submitted/In Progress: Blue/Orange
- Completed/Paid: Green
- Cancelled/Rejected/Overdue: Red

## Next Steps

### Optional Enhancements
- PDF generation for invoices
- Email/SMS notifications
- Document upload to arrangement detail page
- Xero/MYOB accounting integration
- Advanced reporting with charts
- Bulk operations
- Export to CSV/Excel

## Support

For issues or questions:
- Check browser console for errors
- Check backend terminal for server errors
- Verify database is running
- Ensure migrations have been run

## Summary

All 4 phases are complete:
- ✅ Phase 1: Core management (Dashboard, Arrangements, Users)
- ✅ Phase 2: Financial management (Price Lists, Invoicing, Payments)
- ✅ Phase 3: Government integration (BDM, Coroner, Death Certificates)
- ✅ Phase 4: Workflow automation (Tracking, Analytics, Document Checklist)

The portal is production-ready for managing funeral arrangements end-to-end.
