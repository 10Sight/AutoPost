import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import AcceptInvite from './pages/AcceptInvite';
import NotFound from './pages/NotFound';
import RootRedirect from './routes/RootRedirect';
import AuditLogs from "./pages/AuditLogs";
import BulkUpload from "./pages/BulkUpload";
import OrganizationSettings from "./pages/OrganizationSettings";
import PolicyRules from "./pages/PolicyRules";
import AccountInsights from "./pages/AccountInsights";
import ProfileSettings from "./pages/ProfileSettings";
import AccountStatus from "./pages/AccountStatus";
import PostEngagement from "./pages/PostEngagement";
import MediaEditorPage from "./pages/MediaEditorPage";
import Pricing from "./pages/Pricing";
import BillingSettings from "./pages/BillingSettings";

// Superadmin Pages
import SuperadminLayout from './components/layout/SuperadminLayout';
import SuperadminRoute from './routes/SuperadminRoute';
import OrgRegistry from './pages/superadmin/OrgRegistry';
import PlatformHealth from './pages/superadmin/PlatformHealth';
import GrowthMetrics from './pages/superadmin/GrowthMetrics';
import BrandThemeProvider from './components/layout/BrandThemeProvider';

const App = () => {
  return (
    <Router>
      <BrandThemeProvider>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Auth Routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          
          <Route path="/invite/:token" element={<AuthLayout />}>
            <Route index element={<AcceptInvite />} />
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
                <Route path="analytics/account/:accountId" element={<AccountInsights />} />
                <Route path="audit-logs" element={<AuditLogs />} /> {/* Added AuditLogs route */}
                <Route path="settings" element={<Settings />} /> {/* Added Settings route as per instruction */}
                <Route path="org-settings" element={<OrganizationSettings />} />
                <Route path="team" element={<TeamSettings />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="account-status" element={<AccountStatus />} />
                <Route path="policy-rules" element={<PolicyRules />} />
                <Route path="create" element={<CreatePost />} />
                <Route path="engagement/:postId" element={<PostEngagement />} />
                <Route path="billing" element={<BillingSettings />} />
                <Route path="pricing" element={<Pricing />} />
              </Route>
              
              {/* Immersive Pages (No Sidebar) */}
              <Route path="/media/editor/:mediaId" element={<MediaEditorPage />} />
            </Route>

            {/* Superadmin Panel Routes */}
            <Route element={<PersistLogin />}>
              <Route element={<SuperadminRoute />}>
                <Route path="/admin-panel" element={<SuperadminLayout />}>
                  <Route index element={<Navigate to="organizations" replace />} />
                  <Route path="organizations" element={<OrgRegistry />} />
                  <Route path="health" element={<PlatformHealth />} />
                  <Route path="analytics" element={<GrowthMetrics />} />
                  <Route path="branding" element={<OrganizationSettings />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrandThemeProvider>
    </Router>
  );
};

export default App;
