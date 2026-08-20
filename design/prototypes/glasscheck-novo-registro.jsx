import { useState, useRef } from "react";
import { Camera, Star, MapPin, Plus, Check, X, Search, Wine } from "lucide-react";

const KNOWN_DRINKS = ["Caipirinha", "Mojito", "Negroni", "Old Fashioned", "Margarita", "Daiquiri"];

const COLORS = {
  ink: "#12201B",
  surface: "#1B2A23",
  surface2: "#233329",
  amber: "#E3A23B",
  amberDeep: "#B87F28",
  rust: "#C1502B",
  cream: "#F4EEE0",
  sage: "#8FA697",
  line: "rgba(244,238,224,0.14)",
};

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n === value ? 0 : n)}
          className="p-0.5"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            size={22}
            strokeWidth={1.5}
            color={COLORS.amber}
            fill={(hover || value) >= n ? COLORS.amber : "transparent"}
          />
        </button>
      ))}
      <span className="ml-2 text-xs tracking-wide" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value > 0 ? `${value}/5` : "sem nota"}
      </span>
    </div>
  );
}

function PhotoWell({ photo, status, onFile, onAutoSearch, onConfirmSuggestion, onRejectSuggestion, error }) {
  const inputRef = useRef(null);

  return (
    <div>
      <div
        className="relative rounded-2xl flex flex-col items-center justify-center overflow-hidden"
        style={{
          height: 220,
          background: COLORS.surface2,
          border: `1.5px dashed ${error ? COLORS.rust : COLORS.line}`,
        }}
      >
        {status === "uploaded" || status === "confirmed" ? (
          <img src={photo} alt="Foto do drink" className="w-full h-full object-cover" />
        ) : status === "searching" ? (
          <div className="flex flex-col items-center gap-2">
            <Search size={26} color={COLORS.sage} className="animate-pulse" />
            <span className="text-xs" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
              buscando no google imagens...
            </span>
          </div>
        ) : status === "suggested" ? (
          <div className="w-full h-full relative">
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${COLORS.amberDeep}, ${COLORS.rust})` }}
            >
              <Wine size={48} color={COLORS.cream} strokeWidth={1.2} />
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between"
              style={{ background: "rgba(18,32,27,0.88)" }}
            >
              <span className="text-xs" style={{ color: COLORS.cream, fontFamily: "'IBM Plex Mono', monospace" }}>
                foto sugerida (simulação)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRejectSuggestion}
                  className="p-1 rounded-full"
                  style={{ background: COLORS.surface2 }}
                  aria-label="Rejeitar foto sugerida"
                >
                  <X size={14} color={COLORS.cream} />
                </button>
                <button
                  type="button"
                  onClick={onConfirmSuggestion}
                  className="p-1 rounded-full"
                  style={{ background: COLORS.amber }}
                  aria-label="Confirmar foto sugerida"
                >
                  <Check size={14} color={COLORS.ink} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Camera size={26} color={COLORS.sage} strokeWidth={1.5} />
            <span className="text-xs text-center px-6" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
              adicione uma foto ou busque automaticamente
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm"
          style={{ border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: "'Public Sans', sans-serif" }}
        >
          <Camera size={15} /> Enviar foto
        </button>
        <button
          type="button"
          onClick={onAutoSearch}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm"
          style={{ border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: "'Public Sans', sans-serif" }}
        >
          <Search size={15} /> Buscar foto
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(URL.createObjectURL(file));
          }}
        />
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: COLORS.rust, fontFamily: "'IBM Plex Mono', monospace" }}>
          foto obrigatória — envie uma ou busque automaticamente
        </p>
      )}
    </div>
  );
}

export default function GlassCheckNewEntry() {
  const [photoStatus, setPhotoStatus] = useState("none");
  const [photo, setPhoto] = useState(null);
  const [drinkName, setDrinkName] = useState("");
  const [establishment, setEstablishment] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [entries, setEntries] = useState([]);
  const [errors, setErrors] = useState({});
  const [dedupeMatch, setDedupeMatch] = useState(null);
  const [toast, setToast] = useState(null);

  function resetForNewLocation() {
    setPhotoStatus("none");
    setPhoto(null);
    setEstablishment("");
    setRating(0);
    setComment("");
    setErrors({});
  }

  function resetAll() {
    resetForNewLocation();
    setDrinkName("");
  }

  function handleAutoSearch() {
    setPhotoStatus("searching");
    setTimeout(() => setPhotoStatus("suggested"), 1000);
  }

  function saveEntry(skipDedupe) {
    const newErrors = {};
    if (photoStatus === "none") newErrors.photo = true;
    if (!drinkName.trim()) newErrors.name = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    const match = KNOWN_DRINKS.find((d) => d.toLowerCase() === drinkName.trim().toLowerCase());
    if (match && !skipDedupe) {
      setDedupeMatch(match);
      return;
    }

    setEntries((prev) => [
      ...prev,
      {
        id: Date.now(),
        drinkName: drinkName.trim(),
        establishment: establishment.trim(),
        rating,
        photoStatus,
      },
    ]);
    setDedupeMatch(null);
    setToast("Registro salvo");
    setTimeout(() => setToast(null), 2200);
    resetForNewLocation();
  }

  return (
    <div
      className="min-h-screen w-full flex justify-center py-12 px-4"
      style={{ background: COLORS.ink, fontFamily: "'Public Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="w-full max-w-md">
        <p
          className="text-xs uppercase tracking-[0.2em] mb-1 text-center"
          style={{ color: COLORS.amber, fontFamily: "'IBM Plex Mono', monospace" }}
        >
          glasscheck · novo registro
        </p>
        <h1
          className="text-center mb-8"
          style={{ color: COLORS.cream, fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, fontSize: 28 }}
        >
          Que drink você tomou?
        </h1>

        <div className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
          <PhotoWell
            photo={photo}
            status={photoStatus}
            error={errors.photo}
            onFile={(url) => {
              setPhoto(url);
              setPhotoStatus("uploaded");
              setErrors((e) => ({ ...e, photo: false }));
            }}
            onAutoSearch={handleAutoSearch}
            onConfirmSuggestion={() => {
              setPhotoStatus("confirmed");
              setPhoto(null);
              setErrors((e) => ({ ...e, photo: false }));
            }}
            onRejectSuggestion={() => setPhotoStatus("none")}
          />

          <div className="mt-5">
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
              nome do drink
            </label>
            <input
              value={drinkName}
              onChange={(e) => {
                setDrinkName(e.target.value);
                setErrors((er) => ({ ...er, name: false }));
              }}
              placeholder="Ex: Caipirinha"
              className="w-full mt-1 bg-transparent outline-none pb-2"
              style={{
                borderBottom: `1.5px solid ${errors.name ? COLORS.rust : COLORS.line}`,
                color: COLORS.cream,
                fontFamily: "'Fraunces', serif",
                fontSize: 20,
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: COLORS.rust, fontFamily: "'IBM Plex Mono', monospace" }}>
                nome do drink é obrigatório
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="text-xs uppercase tracking-wide flex items-center gap-1" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
              <MapPin size={12} /> estabelecimento (opcional)
            </label>
            <input
              value={establishment}
              onChange={(e) => setEstablishment(e.target.value)}
              placeholder="Ex: Bar do Zé"
              className="w-full mt-1 bg-transparent outline-none pb-2 text-sm"
              style={{ borderBottom: `1px solid ${COLORS.line}`, color: COLORS.cream }}
            />
          </div>

          <div className="mt-5">
            <label className="text-xs uppercase tracking-wide block mb-2" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
              nota (opcional)
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="mt-5">
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
              comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Como foi a experiência?"
              rows={2}
              className="w-full mt-1 bg-transparent outline-none resize-none text-sm pb-2"
              style={{ borderBottom: `1px solid ${COLORS.line}`, color: COLORS.cream }}
            />
          </div>

          <button
            type="button"
            onClick={() => saveEntry(false)}
            className="w-full mt-6 py-3 rounded-lg text-sm uppercase tracking-wide"
            style={{ background: COLORS.amber, color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}
          >
            Salvar registro
          </button>
        </div>

        {entries.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
              {drinkName ? `outros locais para "${entries[0]?.drinkName}"` : "registros salvos nesta sessão"}
            </p>
            <div className="space-y-2">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}
                >
                  <div>
                    <p className="text-sm" style={{ color: COLORS.cream, fontFamily: "'Fraunces', serif" }}>
                      {e.drinkName}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.sage }}>
                      {e.establishment || "sem local"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={13} fill={COLORS.amber} color={COLORS.amber} />
                    <span className="text-xs" style={{ color: COLORS.cream, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {e.rating || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={resetForNewLocation}
              className="w-full mt-3 py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
              style={{ border: `1px dashed ${COLORS.line}`, color: COLORS.sage, fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <Plus size={13} /> registrar este drink em outro local
            </button>
          </div>
        )}
      </div>

      {dedupeMatch && (
        <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: "rgba(18,32,27,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: COLORS.amber, fontFamily: "'IBM Plex Mono', monospace" }}>
              já existe no catálogo
            </p>
            <p className="mt-2" style={{ color: COLORS.cream, fontFamily: "'Fraunces', serif", fontSize: 18 }}>
              Já existe "{dedupeMatch}" no catálogo global — é esse?
            </p>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setDrinkName(dedupeMatch + " (outro)");
                  setDedupeMatch(null);
                }}
                className="flex-1 py-2 rounded-lg text-xs"
                style={{ border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Não, é outro
              </button>
              <button
                type="button"
                onClick={() => saveEntry(true)}
                className="flex-1 py-2 rounded-lg text-xs"
                style={{ background: COLORS.amber, color: COLORS.ink, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Sim, é esse
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-2"
          style={{ background: COLORS.amber, color: COLORS.ink }}
        >
          <Check size={14} />
          <span className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
