import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import LandingPage from './pages/LandingPage';
import SplashScreen from './pages/SplashScreen';
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
import { PlanValidationPage } from './pages/PlanValidationPage';
import { AgentDebatePage } from './pages/AgentDebatePage';
import { UxFlowPage } from './pages/UxFlowPage';
import { PageTransition } from './components/PageTransition';
import DemoMode from './components/DemoMode';

// Show splash once per session, then land on /landing
const RootRoute: React.FC = () => {
  const seen = sessionStorage.getItem('acorn_splash_seen');
  if (seen) return <Navigate to="/landing" replace />;
  sessionStorage.setItem('acorn_splash_seen', '1');
  return <SplashScreen />;
};

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
    <LazyMotion features={domAnimation}>
    <ThemeProvider>
      <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PageTransition>
        <Routes>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/" element={<RootRoute />} />
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
          path="/analytics"
          element={
            <PrivateRoute>
              <AnalyticsDashboardPage />
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
        <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
        <Route
          path="/projects/:id/validate"
          element={
            <PrivateRoute>
              <PlanValidationPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/debate"
          element={
            <PrivateRoute>
              <AgentDebatePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/ux-flow"
          element={
            <PrivateRoute>
              <UxFlowPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
        </PageTransition>
        <DemoMode />
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
    </LazyMotion>
  );
}

export default App;
