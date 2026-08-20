import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import FriendButton from "../components/FriendButton";
import Avatar from "../components/Avatar";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

function ProfileRow({ username, avatarUrl, userId, status, friendshipId, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
      <Link to={`/u/${username}`} className="flex items-center gap-3 min-w-0">
        <Avatar username={username} url={avatarUrl} size="sm" />
        <span className="truncate" style={{ color: COLORS.cream, fontSize: 14 }}>
          @{username}
        </span>
      </Link>
      <FriendButton userId={userId} status={status} friendshipId={friendshipId} onChange={onChange} />
    </div>
  );
}

export default function Friends() {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendships, setFriendships] = useState([]);
  const [loadingFriendships, setLoadingFriendships] = useState(true);

  async function search(q) {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.get(`/profiles/?search=${encodeURIComponent(q.trim())}`);
      setResults((data.results || []).filter((p) => p.username !== profile?.username));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function loadFriendships() {
    setLoadingFriendships(true);
    try {
      const data = await api.get("/friendships/");
      setFriendships(data.results || []);
    } catch {
      // silencioso — seção opcional da tela
    } finally {
      setLoadingFriendships(false);
    }
  }

  useEffect(() => {
    loadFriendships();
  }, []);

  const pendingReceived = friendships.filter((f) => f.status === "pending" && f.to_user === profile?.user);
  const accepted = friendships
    .filter((f) => f.status === "accepted")
    .map((f) => (f.from_user === profile?.user
      ? { userId: f.to_user, username: f.to_username, avatarUrl: f.to_avatar_url }
      : { userId: f.from_user, username: f.from_username, avatarUrl: f.from_avatar_url }));

  return (
    <div className="w-full flex justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.2em] mb-1 text-center" style={{ color: COLORS.amber, fontFamily: FONT_MONO }}>
          glasscheck
        </p>
        <h1 className="text-center mb-8" style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 26 }}>
          Amigos
        </h1>

        <div className="flex items-center gap-2 px-3 rounded-lg mb-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
          <Search size={14} color={COLORS.sage} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            placeholder="Buscar por usuário"
            className="flex-1 bg-transparent outline-none py-2 text-sm"
            style={{ color: COLORS.cream }}
          />
        </div>

        {query.trim() ? (
          <div className="space-y-2">
            {searching && (
              <p className="text-center text-xs py-4" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
                buscando...
              </p>
            )}
            {!searching && results.length === 0 && (
              <p className="text-center text-xs py-4" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
                ninguém encontrado
              </p>
            )}
            {results.map((p) => (
              <ProfileRow
                key={p.id}
                username={p.username}
                avatarUrl={p.avatar_display_url}
                userId={p.user}
                status={p.friendship_status}
                friendshipId={p.friendship_id}
                onChange={() => { search(query); loadFriendships(); }}
              />
            ))}
          </div>
        ) : (
          <>
            {pendingReceived.length > 0 && (
              <div className="mb-8">
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
                  solicitações recebidas
                </p>
                <div className="space-y-2">
                  {pendingReceived.map((f) => (
                    <ProfileRow
                      key={f.id}
                      username={f.from_username}
                      avatarUrl={f.from_avatar_url}
                      userId={f.from_user}
                      status="pending_received"
                      friendshipId={f.id}
                      onChange={loadFriendships}
                    />
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              meus amigos
            </p>
            {loadingFriendships && (
              <p className="text-center text-xs py-4" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
                carregando...
              </p>
            )}
            {!loadingFriendships && accepted.length === 0 && (
              <p className="text-center text-xs py-4" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
                você ainda não tem amigos — busque um usuário acima
              </p>
            )}
            <div className="space-y-2">
              {accepted.map((f) => (
                <ProfileRow
                  key={f.userId}
                  username={f.username}
                  avatarUrl={f.avatarUrl}
                  userId={f.userId}
                  status="accepted"
                  onChange={loadFriendships}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
