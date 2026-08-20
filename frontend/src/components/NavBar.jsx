import { NavLink } from "react-router-dom";
import { Wine, Plus, Users, User } from "lucide-react";
import { COLORS, FONT_MONO } from "../theme";

const items = [
  { to: "/feed", label: "feed", icon: Wine },
  { to: "/novo-registro", label: "novo", icon: Plus },
  { to: "/amigos", label: "amigos", icon: Users },
  { to: "/perfil", label: "perfil", icon: User },
];

export default function NavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-center border-t z-40"
      style={{ background: COLORS.surface, borderColor: COLORS.line }}
    >
      <div className="w-full max-w-md flex">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-1 py-3"
            style={({ isActive }) => ({ color: isActive ? COLORS.amber : COLORS.sage })}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 10 }}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
