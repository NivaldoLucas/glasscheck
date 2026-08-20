import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { COLORS, FONT_MONO } from "../theme";

export default function ProtectedRoute() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.ink }}>
        <span style={{ color: COLORS.sage, fontFamily: FONT_MONO, fontSize: 12 }}>carregando...</span>
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  return <Outlet />;
}
