import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Friends from "./pages/Friends";
import NewCheckIn from "./pages/NewCheckIn";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/novo-registro" element={<NewCheckIn />} />
              <Route path="/amigos" element={<Friends />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/u/:username" element={<PublicProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
