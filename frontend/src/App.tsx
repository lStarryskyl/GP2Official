import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { DiagramWorkspacePage } from './pages/DiagramWorkspacePage';
import { UmlDiagramEditorPage } from './pages/UmlDiagramEditorPage';
import { PhaseDetailPage } from './pages/PhaseDetailPage';
import { AcornDraftPage } from './pages/AcornDraftPage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
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
          path="/projects/:id"
          element={
            <PrivateRoute>
              <ProjectDetailPage />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
