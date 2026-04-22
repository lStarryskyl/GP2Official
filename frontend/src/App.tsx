import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { DiagramWorkspacePage } from './pages/DiagramWorkspacePage';
import { UmlDiagramEditorPage } from './pages/UmlDiagramEditorPage';
import { PhaseDetailPage } from './pages/PhaseDetailPage';
import { AcornDraftPage } from './pages/AcornDraftPage';
import { ProjectSummaryPage } from './pages/ProjectSummaryPage';
import { GuidedWorkspaceBuilder } from './pages/GuidedWorkspaceBuilder';
import ProfilePage from './pages/ProfilePage';
import ProjectGovernancePage from './pages/ProjectGovernancePage';
import DevelopmentUpdatesPage from './pages/DevelopmentUpdatesPage';
import { PersonasPage } from './pages/PersonasPage';
import { SRSAuditPage } from './pages/SRSAuditPage';
import ExportCenterPage from './pages/ExportCenterPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import { BillingPageRoute } from './pages/BillingPageRoute';
import DocsPage from './pages/DocsPage';
import SDLCGuidePage from './pages/SDLCGuidePage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    checkAuth().finally(() => setIsChecking(false));
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <ProjectsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute>
              <NewProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new/wizard"
          element={
            <PrivateRoute>
              <GuidedWorkspaceBuilder />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/governance"
          element={
            <PrivateRoute>
              <ProjectGovernancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/updates"
          element={
            <PrivateRoute>
              <DevelopmentUpdatesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <PrivateRoute>
              <ProjectDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/summary"
          element={
            <PrivateRoute>
              <ProjectSummaryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/diagram-studio"
          element={
            <PrivateRoute>
              <DiagramWorkspacePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/draft/:section"
          element={
            <PrivateRoute>
              <AcornDraftPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/phases/:phaseId"
          element={
            <PrivateRoute>
              <PhaseDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/uml/:type/edit"
          element={
            <PrivateRoute>
              <UmlDiagramEditorPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/personas"
          element={
            <PrivateRoute>
              <PersonasPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/srs-audit"
          element={
            <PrivateRoute>
              <SRSAuditPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/export"
          element={
            <PrivateRoute>
              <ExportCenterPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/analytics"
          element={
            <PrivateRoute>
              <AnalyticsDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <PrivateRoute>
              <BillingPageRoute />
            </PrivateRoute>
          }
        />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/sdlc-guide" element={<SDLCGuidePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
