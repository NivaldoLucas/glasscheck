import { useState } from "react";
import { UserPlus, Check, Clock } from "lucide-react";
import { api } from "../lib/api";
import { COLORS, FONT_MONO } from "../theme";

const baseStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontFamily: FONT_MONO,
};

export default function FriendButton({ userId, status, friendshipId, onChange }) {
  const [busy, setBusy] = useState(false);

  async function sendRequest() {
    setBusy(true);
    try {
      await api.post("/friendships/", { to_user: userId });
      onChange?.();
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    setBusy(true);
    try {
      await api.post(`/friendships/${friendshipId}/accept/`);
      onChange?.();
    } finally {
      setBusy(false);
    }
  }

  if (status === "self" || status === null || status === undefined) return null;

  if (status === "accepted") {
    return (
      <span style={{ ...baseStyle, border: `1px solid ${COLORS.line}`, color: COLORS.sage }}>
        <Check size={12} /> amigos
      </span>
    );
  }

  if (status === "pending_sent") {
    return (
      <span style={{ ...baseStyle, border: `1px solid ${COLORS.line}`, color: COLORS.sage }}>
        <Clock size={12} /> solicitação enviada
      </span>
    );
  }

  if (status === "pending_received") {
    return (
      <button
        type="button"
        onClick={accept}
        disabled={busy}
        style={{ ...baseStyle, background: COLORS.amber, color: COLORS.ink, border: "none" }}
      >
        <Check size={12} /> {busy ? "aceitando..." : "aceitar solicitação"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={sendRequest}
      disabled={busy}
      style={{ ...baseStyle, border: `1px solid ${COLORS.amber}`, color: COLORS.amber }}
    >
      <UserPlus size={12} /> {busy ? "enviando..." : "adicionar amigo"}
    </button>
  );
}
