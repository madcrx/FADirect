# FA Direct Web Portal

Funeral Arrangement CRM System - Web Portal for Administrators and Arrangers

## Features

- **Dashboard**: Overview of arrangements, statistics, and recent activity
- **Arrangement Management**: Full CRUD operations for funeral arrangements
- **User Management**: Manage arrangers, mourners, and admin users
- **Invoicing**: Create and manage invoices (Coming Soon)
- **Government Integration**: Connect with BDM, Coroner's Court (Coming Soon)
- **Document Management**: Upload and organize funeral documents
- **Photo Gallery**: View and manage photos from arrangements

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **State Management**: React Hooks
- **API Client**: Axios
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js >= 18
- Backend API running on port 3000

### Installation

```bash
cd web-portal
npm install
```

### Development

```bash
npm run dev
```

Portal will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Backend Connection

The portal connects to the backend API at `http://localhost:3000/api`. 

API endpoints are proxied through Vite during development.

## Default Login

Development mode uses code: **123456**

Use your arranger or admin phone number to login.

## Project Structure

```
web-portal/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions and theme
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## Features Roadmap

### Phase 1: Core CRM (Current)
- ✅ Authentication
- ✅ Dashboard with stats
- ✅ Arrangement management
- ⏳ User management
- ⏳ Settings

### Phase 2: Business Operations
- ⏳ Price lists
- ⏳ Invoicing system
- ⏳ Payment tracking
- ⏳ Document templates

### Phase 3: Integrations
- ⏳ Government APIs (BDM, Coroner)
- ⏳ Accounting software
- ⏳ Email/SMS notifications

### Phase 4: Advanced Features
- ⏳ Workflow automation
- ⏳ Reporting & analytics
- ⏳ Calendar & scheduling
- ⏳ Mobile responsive improvements
