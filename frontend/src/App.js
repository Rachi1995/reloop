import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PortalLayout } from "@/components/PortalLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Kiosk from "@/pages/Kiosk";

import StudentDashboard from "@/pages/student/StudentDashboard";
import MyContainer from "@/pages/student/MyContainer";
import WalletPage from "@/pages/student/WalletPage";
import StudentTransactions from "@/pages/student/StudentTransactions";
import ReturnHistory from "@/pages/student/ReturnHistory";
import Profile from "@/pages/student/Profile";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import IssueContainer from "@/pages/admin/IssueContainer";
import ReturnContainer from "@/pages/admin/ReturnContainer";
import Containers from "@/pages/admin/Containers";
import Students from "@/pages/admin/Students";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import Cleaning from "@/pages/admin/Cleaning";
import Alerts from "@/pages/admin/Alerts";
import Analytics from "@/pages/admin/Analytics";
import SettingsPage from "@/pages/admin/SettingsPage";

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleHome() {
  const { user } = useAuth();
  return user?.role === "student" ? <StudentDashboard /> : <AdminDashboard />;
}

function AppRoutes() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/kiosk" element={<Kiosk />} />

      <Route
        path="/app/*"
        element={
          <Protected>
            <PortalLayout>
              <Routes>
                <Route index element={<RoleHome />} />
                {isStudent ? (
                  <>
                    <Route path="container" element={<MyContainer />} />
                    <Route path="wallet" element={<WalletPage />} />
                    <Route path="transactions" element={<StudentTransactions />} />
                    <Route path="returns" element={<ReturnHistory />} />
                    <Route path="profile" element={<Profile />} />
                  </>
                ) : (
                  <>
                    <Route path="issue" element={<IssueContainer />} />
                    <Route path="return" element={<ReturnContainer />} />
                    <Route path="containers" element={<Containers />} />
                    <Route path="students" element={<Students />} />
                    <Route path="all-transactions" element={<AdminTransactions />} />
                    <Route path="cleaning" element={<Cleaning />} />
                    <Route path="alerts" element={<Alerts />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </PortalLayout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
