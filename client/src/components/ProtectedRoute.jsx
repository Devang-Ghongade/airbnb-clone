
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <p style={{ textAlign: "center", padding: "40px" }}>
      Verifying your session...
    </p>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
