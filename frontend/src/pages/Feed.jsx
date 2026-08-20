import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import CheckInCard from "../components/CheckInCard";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

export default function Feed() {
  const [checkins, setCheckins] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadFirstPage() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/checkins/");
      setCheckins(data.results);
      setNextUrl(data.next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível carregar o feed");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      const data = await api.get(nextUrl);
      setCheckins((prev) => [...prev, ...data.results]);
      setNextUrl(data.next);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
  }, []);

  return (
    <div className="w-full flex justify-center px-4 pt-10">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.2em] mb-1 text-center" style={{ color: COLORS.amber, fontFamily: FONT_MONO }}>
          glasscheck
        </p>
        <h1 className="text-center mb-8" style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 26 }}>
          Feed
        </h1>

        {loading && (
          <p className="text-center text-sm" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
            carregando...
          </p>
        )}

        {error && (
          <p className="text-center text-sm" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
            {error}
          </p>
        )}

        {!loading && !error && checkins.length === 0 && (
          <p className="text-center text-sm" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
            nenhum registro por aqui ainda
          </p>
        )}

        <div className="space-y-3">
          {checkins.map((checkin) => (
            <CheckInCard key={checkin.id} checkin={checkin} showUser />
          ))}
        </div>

        {nextUrl && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full mt-4 py-2.5 rounded-lg text-xs disabled:opacity-60"
            style={{ border: `1px dashed ${COLORS.line}`, color: COLORS.sage, fontFamily: FONT_MONO }}
          >
            {loadingMore ? "carregando..." : "carregar mais"}
          </button>
        )}
      </div>
    </div>
  );
}
