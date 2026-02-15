import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "./components/ui/sonner";

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import PersistLogin from './components/layout/PersistLogin';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import MediaLibrary from './pages/MediaLibrary';
import ScheduledPosts from './pages/ScheduledPosts';
import Analytics from './pages/Analytics';
import TeamSettings from './pages/TeamSettings';
import CreatePost from './pages/CreatePost';
import NotFound from './pages/NotFound';
import RootRedirect from './routes/RootRedirect';
import AuditLogs from "./pages/AuditLogs";
import BulkUpload from "./pages/BulkUpload";
import OrganizationSettings from "./pages/OrganizationSettings";
import PolicyRules from "./pages/PolicyRules";

const App = () => {
  return (
    <Router>
      <Toaster />
      <Routes>
        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<PersistLogin />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="accounts" element={<Settings />} />
              <Route path="media" element={<MediaLibrary />} />
              <Route path="scheduler" element={<ScheduledPosts />} />
              <Route path="scheduler/bulk" element={<BulkUpload />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="audit-logs" element={<AuditLogs />} /> {/* Added AuditLogs route */}
              <Route path="settings" element={<Settings />} /> {/* Added Settings route as per instruction */}
              <Route path="org-settings" element={<OrganizationSettings />} />
              <Route path="team" element={<TeamSettings />} />
              <Route path="policy-rules" element={<PolicyRules />} />
              <Route path="create" element={<CreatePost />} />
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
