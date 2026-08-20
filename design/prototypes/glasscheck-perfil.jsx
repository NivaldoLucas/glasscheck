import { useState, useMemo } from "react";
import { Star, MapPin, Lock, Globe, Search, Wine, X, Layers } from "lucide-react";

const COLORS = {
  ink: "#12201B",
  surface: "#1B2A23",
  surface2: "#233329",
  amber: "#E3A23B",
  cream: "#F4EEE0",
  sage: "#8FA697",
  line: "rgba(244,238,224,0.14)",
};

const GRADIENTS = [
  ["#B87F28", "#C1502B"],
  ["#2F5D46", "#1B2A23"],
  ["#7A3B5E", "#3C2140"],
  ["#3E6B5C", "#1B2A23"],
  ["#A5451F", "#5A2410"],
  ["#4B6B3A", "#233329"],
];

const CATALOG = [
  { id: 1, name: "Caipirinha", entries: [
    { establishment: "Bar do Zé", rating: 5, date: "12 ago" },
    { establishment: "Casa Aurora", rating: 4, date: "3 jul" },
  ]},
  { id: 2, name: "Negroni", entries: [{ establishment: "Copo Sujo", rating: 4, date: "10 ago" }] },
  { id: 3, name: "Mojito", entries: [
    { establishment: "Beco 45", rating: 3, date: "1 ago" },
    { establishment: "Praia Bar", rating: 5, date: "20 jun" },
    { establishment: "Casa Aurora", rating: 4, date: "2 mai" },
  ]},
  { id: 4, name: "Old Fashioned", entries: [{ establishment: "Copo Sujo", rating: 5, date: "28 jul" }] },
  { id: 5, name: "Daiquiri", entries: [{ establishment: "", rating: 0, date: "15 jul" }] },
  { id: 6, name: "Margarita", entries: [{ establishment: "Beco 45", rating: 4, date: "22 jun" }] },
];

function avg(entries) {
  const rated = entries.filter((e) => e.rating > 0);
  if (!rated.length) return 0;
  return rated.reduce((s, e) => s + e.rating, 0) / rated.length;
}

function Card({ drink, gradient, onOpen }) {
  const [from, to] = gradient;
  const rating = avg(drink.entries);
  return (
    <button
      type="button"
      onClick={() => onOpen(drink)}
      className="relative rounded-xl overflow-hidden text-left"
      style={{ aspectRatio: "1 / 1.15" }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
      >
        <Wine size={26} color="rgba(244,238,224,0.55)" strokeWidth={1.2} />
      </div>

      {drink.entries.length > 1 && (
        <div
          className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(18,32,27,0.75)" }}
        >
          <Layers size={10} color={COLORS.cream} />
          <span style={{ color: COLORS.cream, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
            ×{drink.entries.length}
          </span>
        </div>
      )}

      {rating > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
          style={{ background: COLORS.amber }}
        >
          <Star size={10} fill={COLORS.ink} color={COLORS.ink} />
          <span style={{ color: COLORS.ink, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
            {rating.toFixed(1)}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-2 py-2" style={{ background: "linear-gradient(transparent, rgba(18,32,27,0.92))" }}>
        <p style={{ color: COLORS.cream, fontFamily: "'Fraunces', serif", fontSize: 13, lineHeight: 1.15 }}>
          {drink.name}
        </p>
      </div>
    </button>
  );
}

export default function GlassCheckProfile() {
  const [privacy, setPrivacy] = useState("public");
  const [sort, setSort] = useState("recent");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  const totalEntries = CATALOG.reduce((s, d) => s + d.entries.length, 0);
  const establishments = new Set(
    CATALOG.flatMap((d) => d.entries.map((e) => e.establishment).filter(Boolean))
  ).size;
  const overallAvg =
    CATALOG.reduce((s, d) => s + avg(d.entries) * d.entries.length, 0) / totalEntries;

  const filtered = useMemo(() => {
    let list = CATALOG.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === "top") list = [...list].sort((a, b) => avg(b.entries) - avg(a.entries));
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [query, sort]);

  return (
    <div className="min-h-screen w-full flex justify-center py-10 px-4" style={{ background: COLORS.ink, fontFamily: "'Public Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
            style={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}` }}
          >
            <span style={{ color: COLORS.amber, fontFamily: "'Fraunces', serif", fontSize: 22 }}>AC</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 style={{ color: COLORS.cream, fontFamily: "'Fraunces', serif", fontSize: 20 }}>Ana Costa</h1>
              <button
                type="button"
                onClick={() => setPrivacy(privacy === "public" ? "private" : "public")}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ border: `1px solid ${COLORS.line}` }}
                aria-label="Alternar privacidade do perfil"
              >
                {privacy === "public" ? <Globe size={10} color={COLORS.sage} /> : <Lock size={10} color={COLORS.sage} />}
                <span style={{ color: COLORS.sage, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {privacy === "public" ? "público" : "privado"}
                </span>
              </button>
            </div>
            <p style={{ color: COLORS.sage, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>@anacosta</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: "drinks", value: totalEntries },
            { label: "locais", value: establishments },
            { label: "nota média", value: overallAvg.toFixed(1) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl py-3 text-center" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
              <p style={{ color: COLORS.amber, fontFamily: "'Fraunces', serif", fontSize: 20 }}>{s.value}</p>
              <p style={{ color: COLORS.sage, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 rounded-lg" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
            <Search size={14} color={COLORS.sage} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no catálogo"
              className="flex-1 bg-transparent outline-none py-2 text-sm"
              style={{ color: COLORS.cream }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg px-2 text-xs outline-none"
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <option value="recent">recentes</option>
            <option value="top">melhor avaliados</option>
            <option value="az">a-z</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
            nenhum drink encontrado
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((drink, i) => (
              <Card key={drink.id} drink={drink} gradient={GRADIENTS[i % GRADIENTS.length]} onOpen={setOpen} />
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" style={{ background: "rgba(18,32,27,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
            <div className="flex items-start justify-between">
              <h2 style={{ color: COLORS.cream, fontFamily: "'Fraunces', serif", fontSize: 20 }}>{open.name}</h2>
              <button type="button" onClick={() => setOpen(null)} aria-label="Fechar">
                <X size={18} color={COLORS.sage} />
              </button>
            </div>
            <p className="mb-4" style={{ color: COLORS.sage, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
              {open.entries.length} {open.entries.length > 1 ? "registros" : "registro"}
            </p>
            <div className="space-y-2">
              {open.entries.map((e, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: COLORS.surface2 }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={13} color={COLORS.sage} className="shrink-0" />
                    <span className="truncate" style={{ color: COLORS.cream, fontSize: 13 }}>
                      {e.establishment || "sem local"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star size={11} fill={COLORS.amber} color={COLORS.amber} />
                        <span style={{ color: COLORS.cream, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{e.rating}</span>
                      </span>
                    )}
                    <span style={{ color: COLORS.sage, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{e.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
