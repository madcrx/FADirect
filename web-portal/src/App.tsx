import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './utils/theme';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ArrangementsPage from './pages/ArrangementsPage';
import ArrangementDetailPage from './pages/ArrangementDetailPage';
import ArrangementFormPage from './pages/ArrangementFormPage';
import UsersPage from './pages/UsersPage';
import PriceListsPage from './pages/PriceListsPage';
import InvoicingPage from './pages/InvoicingPage';
import GovernmentFormsPage from './pages/GovernmentFormsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import SearchPage from './pages/SearchPage';
import ExportPage from './pages/ExportPage';
import TrashPage from './pages/TrashPage';
import BackupsPage from './pages/BackupsPage';
import CallLogsPage from './pages/CallLogsPage';
import FileManagerPage from './pages/FileManagerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BookingsPage from './pages/BookingsPage';
import StaffPage from './pages/StaffPage';
import VehiclesPage from './pages/VehiclesPage';
import EquipmentPage from './pages/EquipmentPage';
import MournersPage from './pages/MournersPage';
import RevenuePage from './pages/RevenuePage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import PreArrangementFormPage from './pages/PreArrangementFormPage';
import FirstCallReportPage from './pages/FirstCallReportPage';
import PendingRegistrationsPage from './pages/PendingRegistrationsPage';
import PoliciesPage from './pages/PoliciesPage';
import OnboardingPage from './pages/OnboardingPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="arrangements" element={<ArrangementsPage />} />
            <Route path="arrangements/new" element={<ArrangementFormPage />} />
            <Route path="arrangements/:id" element={<ArrangementDetailPage />} />
            <Route path="arrangements/:id/edit" element={<ArrangementFormPage />} />
            <Route path="arrangements/:id/pre-arrangement-form" element={<PreArrangementFormPage />} />
            <Route path="first-call-report" element={<FirstCallReportPage />} />
            <Route path="users" element={<Navigate to="/staff" replace />} />
            <Route path="price-lists" element={<PriceListsPage />} />
            <Route path="invoicing" element={<InvoicingPage />} />
            <Route path="government-forms" element={<GovernmentFormsPage />} />
            <Route path="policies" element={<PoliciesPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="mourners" element={<MournersPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="leave-management" element={<LeaveManagementPage />} />
            <Route path="registrations" element={<PendingRegistrationsPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="backups" element={<BackupsPage />} />
            <Route path="call-logs" element={<CallLogsPage />} />
            <Route path="files" element={<FileManagerPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
