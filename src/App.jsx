// src/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Auth/Login";
// NOTE: These are likely unused now, can be cleaned up later if you wish

import AdminUserManagement from "./pages/Admin/AdminUserManagement";
import { useAuthStore } from "./store/useAuthStore";
import AppLayout from "./components/layout/AppLayout";

import LoadingSpinner from "./components/ui/LoadingSpinner";
import WelcomeMessage from "./pages/Admin/WelcomeMessage";
import Units from "./pages/Admin/Units";

// Assuming these paths are correct
import SettingsGeneral from "./components/Settings/SettingsGeneral";
import SettingsPropertyData from "./components/Settings/SettingsPropertyData";
import SettingsUserManagement from "./components/Settings/SettingsUserManagement";
import Properties from "./pages/Admin/Properties";

function App() {
  const { session, loading, isAdmin } = useAuthStore();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!session ? <LoginPage /> : <Navigate to="/" />}
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            session ? (
              <AppLayout>
                <Routes>
                  <Route path="/" element={<WelcomeMessage />} />
                  <Route path="/units" element={<Units />} />
                  <Route path="/properties" element={<Properties />} />

                  {/* === FIX: THE ROUTES NOW HAVE THE CORRECT FULL PATH === */}
                  {isAdmin && (
                    <>
                      <Route
                        path="/settings/general"
                        element={<SettingsGeneral />}
                      />
                      <Route
                        path="/settings/property-data"
                        element={<SettingsPropertyData />}
                      />
                      <Route
                        path="/settings/user-management"
                        element={<SettingsUserManagement />}
                      />
                    </>
                  )}
                  {/* This is the old route, now handled by /settings/user-management */}

                  {isAdmin && (
                    <Route path="/users" element={<AdminUserManagement />} />
                  )}
                  {/* FIX: Removed the incorrect index route that was here */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
