import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(username, email, password);
      navigate("/feed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a conta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: COLORS.ink }}>
      <div className="w-full max-w-sm">
        <p
          className="text-xs uppercase tracking-[0.2em] mb-1 text-center"
          style={{ color: COLORS.amber, fontFamily: FONT_MONO }}
        >
          glasscheck
        </p>
        <h1
          className="text-center mb-8"
          style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 28 }}
        >
          Crie sua conta
        </h1>

        <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
          <div>
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              usuário
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full mt-1 bg-transparent outline-none pb-2"
              style={{ borderBottom: `1.5px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 18 }}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 bg-transparent outline-none pb-2 text-sm"
              style={{ borderBottom: `1px solid ${COLORS.line}`, color: COLORS.cream }}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              senha (mín. 8 caracteres)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full mt-1 bg-transparent outline-none pb-2 text-sm"
              style={{ borderBottom: `1px solid ${COLORS.line}`, color: COLORS.cream }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg text-sm uppercase tracking-wide disabled:opacity-60"
            style={{ background: COLORS.amber, color: COLORS.ink, fontFamily: FONT_MONO, fontWeight: 500 }}
          >
            {busy ? "criando..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center mt-4 text-xs" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
          já tem conta?{" "}
          <Link to="/login" style={{ color: COLORS.amber }}>
            entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
