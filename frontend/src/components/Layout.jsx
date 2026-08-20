import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import { COLORS } from "../theme";

export default function Layout() {
  return (
    <div className="min-h-screen w-full" style={{ background: COLORS.ink }}>
      <div className="pb-20">
        <Outlet />
      </div>
      <NavBar />
    </div>
  );
}
