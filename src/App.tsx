import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DevicesPage from './pages/DevicesPage';
import PoliciesPage from './pages/PoliciesPage';
import LogsPage from './pages/LogsPage';

function Protected({ children }: { children: React.ReactNode }) {
  return api.isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Protected><AppLayout /></Protected>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
