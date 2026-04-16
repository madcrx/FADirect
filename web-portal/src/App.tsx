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
            <Route path="users" element={<UsersPage />} />
            <Route path="price-lists" element={<PriceListsPage />} />
            <Route path="invoicing" element={<InvoicingPage />} />
            <Route path="government-forms" element={<GovernmentFormsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
