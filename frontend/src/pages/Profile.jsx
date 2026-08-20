import { useEffect, useRef, useState } from "react";
import { Lock, Globe, LogOut, Camera } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api, ApiError } from "../lib/api";
import { computeStats } from "../lib/stats";
import StatsRow from "../components/StatsRow";
import DrinkCatalog from "../components/DrinkCatalog";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

export default function Profile() {
  const { profile, logout, updateProfile } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api.get(`/checkins/?user=${profile.user}`);
        if (!cancelled) setCheckins(data.results);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Não foi possível carregar seu catálogo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  async function togglePrivacy() {
    setSavingPrivacy(true);
    try {
      await updateProfile({ is_private: !profile.is_private });
    } finally {
      setSavingPrivacy(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setSavingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await updateProfile(formData, { isFormData: true });
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Não foi possível trocar a foto");
    } finally {
      setSavingAvatar(false);
      e.target.value = "";
    }
  }

  if (!profile) return null;
  const stats = computeStats(checkins);

  return (
    <div className="w-full flex justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={savingAvatar}
            aria-label="Trocar foto de perfil"
            className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden group disabled:opacity-60"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}` }}
          >
            {profile.avatar_display_url ? (
              <img src={profile.avatar_display_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span style={{ color: COLORS.amber, fontFamily: FONT_SERIF, fontSize: 22 }}>
                {profile.username.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(18,32,27,0.6)" }}
            >
              <Camera size={16} color={COLORS.cream} />
            </span>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="flex-1 min-w-0">
            <h1 className="truncate" style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 20 }}>{profile.username}</h1>
            <p className="truncate" style={{ color: COLORS.sage, fontSize: 12, fontFamily: FONT_MONO }}>@{profile.username}</p>
          </div>
          <button type="button" onClick={logout} aria-label="Sair" className="shrink-0">
            <LogOut size={18} color={COLORS.sage} />
          </button>
        </div>
        {avatarError && (
          <p className="text-xs mb-2" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
            {avatarError}
          </p>
        )}
        {savingAvatar && (
          <p className="text-xs mb-2" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
            enviando foto...
          </p>
        )}

        <button
          type="button"
          onClick={togglePrivacy}
          disabled={savingPrivacy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full disabled:opacity-60 mb-6 w-fit"
          style={{ border: `1px solid ${COLORS.line}` }}
          aria-label="Alternar privacidade do perfil"
        >
          {profile.is_private ? <Lock size={10} color={COLORS.sage} /> : <Globe size={10} color={COLORS.sage} />}
          <span style={{ color: COLORS.sage, fontSize: 10, fontFamily: FONT_MONO }}>
            {profile.is_private ? "privado" : "público"}
          </span>
        </button>

        <StatsRow {...stats} />

        {loading && (
          <p className="text-center py-10 text-sm" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
            carregando...
          </p>
        )}
        {error && (
          <p className="text-center py-10 text-sm" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
            {error}
          </p>
        )}
        {!loading && !error && <DrinkCatalog checkins={checkins} editable />}
      </div>
    </div>
  );
}
