import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import AppLayout from "./components/layout/AppLayout";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Lazy load all major pages
const LoginPage = lazy(() => import("./pages/Auth/Login"));
const WelcomeMessage = lazy(() => import("./pages/Admin/WelcomeMessage"));
const Units = lazy(() => import("./pages/Admin/Units"));
const Properties = lazy(() => import("./pages/Admin/Properties"));
const AdminUserManagement = lazy(() =>
  import("./pages/Admin/AdminUserManagement")
);
const SettingsGeneral = lazy(() =>
  import("./components/Settings/SettingsGeneral")
);
const SettingsPropertyData = lazy(() =>
  import("./components/Settings/SettingsPropertyData")
);
const SettingsUserManagement = lazy(() =>
  import("./components/Settings/SettingsUserManagement")
);

function App() {
  const { session, loading, isAdmin } = useAuthStore();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route
            path="/login"
            element={!session ? <LoginPage /> : <Navigate to="/" />}
          />

          <Route
            path="/*"
            element={
              session ? (
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<WelcomeMessage />} />
                    <Route path="/units" element={<Units />} />
                    <Route path="/properties" element={<Properties />} />

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
                        <Route
                          path="/users"
                          element={<AdminUserManagement />}
                        />
                      </>
                    )}

                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </AppLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
