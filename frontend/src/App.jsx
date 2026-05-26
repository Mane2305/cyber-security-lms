import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ModuleViewer from './pages/ModuleViewer';
import QuizPage from './pages/QuizPage';
import BadgesPage from './pages/BadgesPage';
import CertificatePage from './pages/CertificatePage';
import SettingsPage from './pages/SettingsPage';

function LayoutRoute({ allowedRoles, title, children }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout title={title}>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard/employee"
        element={
          <LayoutRoute allowedRoles={['employee']} title="Dashboard">
            <EmployeeDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/employee/modules"
        element={
          <LayoutRoute allowedRoles={['employee']} title="Modules">
            <EmployeeDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/module/:module_id"
        element={
          <LayoutRoute allowedRoles={['employee']} title="Module">
            <ModuleViewer />
          </LayoutRoute>
        }
      />
      <Route
        path="/quiz/:module_id"
        element={
          <LayoutRoute allowedRoles={['employee']} title="Quiz">
            <QuizPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/badges"
        element={
          <LayoutRoute allowedRoles={['employee']} title="Badges">
            <BadgesPage />
          </LayoutRoute>
        }
      />
      <Route
        path="/certificate"
        element={
          <LayoutRoute allowedRoles={['employee']} title="Certificate">
            <CertificatePage />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/employee/settings"
        element={
          <LayoutRoute allowedRoles={['employee']} title="Settings">
            <SettingsPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/dashboard/manager"
        element={
          <LayoutRoute allowedRoles={['manager']} title="Dashboard">
            <ManagerDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/manager/team"
        element={
          <LayoutRoute allowedRoles={['manager']} title="Team">
            <ManagerDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/manager/reports"
        element={
          <LayoutRoute allowedRoles={['manager']} title="Reports">
            <ManagerDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/manager/settings"
        element={
          <LayoutRoute allowedRoles={['manager']} title="Settings">
            <SettingsPage />
          </LayoutRoute>
        }
      />

      <Route
        path="/dashboard/admin"
        element={
          <LayoutRoute allowedRoles={['admin']} title="Dashboard">
            <AdminDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/admin/users"
        element={
          <LayoutRoute allowedRoles={['admin']} title="Users">
            <AdminDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/admin/reports"
        element={
          <LayoutRoute allowedRoles={['admin']} title="Reports">
            <AdminDashboard />
          </LayoutRoute>
        }
      />
      <Route
        path="/dashboard/admin/settings"
        element={
          <LayoutRoute allowedRoles={['admin']} title="Settings">
            <AdminDashboard />
          </LayoutRoute>
        }
      />
    </Routes>
  );
}

export default App;
