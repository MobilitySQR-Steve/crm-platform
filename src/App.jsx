import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/shell/AppShell';
import RequireAuth from './auth/RequireAuth';
import Login from './pages/auth/Login';

// TaxSQR
import TaxDashboard    from './pages/taxsqr/TaxDashboard';
import ClientList      from './pages/taxsqr/ClientList';
import ClientProfile   from './pages/taxsqr/ClientProfile';
import TaxKanban       from './pages/taxsqr/TaxKanban';

// MobilitySQR
import MobilityDashboard from './pages/mobility/MobilityDashboard';
import AccountList       from './pages/mobility/AccountList';
import AccountDetail     from './pages/mobility/AccountDetail';
import AccountForm       from './pages/mobility/AccountForm';
import PipelineKanban    from './pages/mobility/PipelineKanban';

// Shared
import Placeholder from './pages/shared/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/mobility/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<AppShell />}>
        {/* ── TaxSQR (public for now — design-partner focus is MobilitySQR) ── */}
        <Route path="/taxsqr/dashboard"   element={<TaxDashboard />} />
        <Route path="/taxsqr/clients"     element={<ClientList />} />
        <Route path="/taxsqr/clients/:id" element={<ClientProfile />} />
        <Route path="/taxsqr/cases"       element={<Navigate to="/taxsqr/cases/kanban" replace />} />
        <Route path="/taxsqr/cases/kanban" element={<TaxKanban />} />
        <Route path="/taxsqr/cases/list"   element={<Placeholder title="Tax Cases — List View" />} />
        <Route path="/taxsqr/documents"    element={<Placeholder title="Documents" />} />
        <Route path="/taxsqr/tasks"        element={<Placeholder title="My Tasks" />} />
        <Route path="/taxsqr/reports"      element={<Placeholder title="Reports" />} />

        {/* ── MobilitySQR (auth required) ─────────────────────────────────── */}
        <Route element={<RequireAuth />}>
          <Route path="/mobility/dashboard"         element={<MobilityDashboard />} />
          <Route path="/mobility/accounts"          element={<AccountList />} />
          <Route path="/mobility/accounts/new"      element={<AccountForm />} />
          <Route path="/mobility/accounts/:id"      element={<AccountDetail />} />
          <Route path="/mobility/accounts/:id/edit" element={<AccountForm />} />
          <Route path="/mobility/contacts"          element={<Placeholder title="Contacts" />} />
          <Route path="/mobility/pipeline"          element={<Navigate to="/mobility/pipeline/kanban" replace />} />
          <Route path="/mobility/pipeline/kanban"   element={<PipelineKanban />} />
          <Route path="/mobility/pipeline/list"     element={<Placeholder title="Pipeline — List View" />} />
          <Route path="/mobility/workflows"         element={<Placeholder title="Workflows" />} />
          <Route path="/mobility/tasks"             element={<Placeholder title="My Tasks" />} />
          <Route path="/mobility/reports"           element={<Placeholder title="Reports" />} />
        </Route>
      </Route>
    </Routes>
  );
}
