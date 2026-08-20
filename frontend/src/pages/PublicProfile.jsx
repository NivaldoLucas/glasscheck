import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Globe } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api, ApiError } from "../lib/api";
import { computeStats } from "../lib/stats";
import StatsRow from "../components/StatsRow";
import DrinkCatalog from "../components/DrinkCatalog";
import FriendButton from "../components/FriendButton";
import Avatar from "../components/Avatar";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

export default function PublicProfile() {
  const { username } = useParams();
  const { profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const [target, setTarget] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (myProfile?.username === username) {
      navigate("/perfil", { replace: true });
    }
  }, [myProfile, username, navigate]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const found = await api.get(`/profiles/?search=${encodeURIComponent(username)}`);
      const match = (found.results || []).find((p) => p.username.toLowerCase() === username.toLowerCase());
      if (!match) {
        setError("Usuário não encontrado");
        setTarget(null);
        return;
      }
      setTarget(match);

      const canSeeCatalog = !match.is_private || ["self", "accepted"].includes(match.friendship_status);
      if (canSeeCatalog) {
        const data = await api.get(`/checkins/?user=${match.user}`);
        setCheckins(data.results);
      } else {
        setCheckins([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar o perfil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (loading) {
    return (
      <p className="text-center py-20 text-sm" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
        carregando...
      </p>
    );
  }

  if (error || !target) {
    return (
      <p className="text-center py-20 text-sm" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
        {error || "Usuário não encontrado"}
      </p>
    );
  }

  const stats = computeStats(checkins);
  const locked = target.is_private && !["self", "accepted"].includes(target.friendship_status);

  return (
    <div className="w-full flex justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-3">
          <Avatar username={target.username} url={target.avatar_display_url} />
          <div className="flex-1 min-w-0">
            <h1 className="truncate" style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 20 }}>{target.username}</h1>
            <p className="truncate" style={{ color: COLORS.sage, fontSize: 12, fontFamily: FONT_MONO }}>@{target.username}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-6">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0" style={{ border: `1px solid ${COLORS.line}` }}>
            {target.is_private ? <Lock size={10} color={COLORS.sage} /> : <Globe size={10} color={COLORS.sage} />}
            <span style={{ color: COLORS.sage, fontSize: 10, fontFamily: FONT_MONO }}>
              {target.is_private ? "privado" : "público"}
            </span>
          </span>
          <FriendButton
            userId={target.user}
            status={target.friendship_status}
            friendshipId={target.friendship_id}
            onChange={load}
          />
        </div>

        {locked ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
            <Lock size={22} color={COLORS.sage} className="mx-auto mb-2" />
            <p style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 16 }}>Este perfil é privado</p>
            <p className="mt-1 text-xs" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              adicione @{target.username} como amigo para ver o catálogo
            </p>
          </div>
        ) : (
          <>
            <StatsRow {...stats} />
            <DrinkCatalog checkins={checkins} />
          </>
        )}
      </div>
    </div>
  );
}
