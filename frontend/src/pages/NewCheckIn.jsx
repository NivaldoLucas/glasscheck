import { useRef, useState } from "react";
import { Camera, Star, MapPin, Plus, Check } from "lucide-react";
import { api, ApiError } from "../lib/api";
import StarRating from "../components/StarRating";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

function PhotoWell({ previewUrl, onFile, error }) {
  const inputRef = useRef(null);

  return (
    <div>
      <div
        className="relative rounded-2xl flex flex-col items-center justify-center overflow-hidden"
        style={{ height: 220, background: COLORS.surface2, border: `1.5px dashed ${error ? COLORS.rust : COLORS.line}` }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Foto do drink" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Camera size={26} color={COLORS.sage} strokeWidth={1.5} />
            <span className="text-xs text-center px-6" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              adicione uma foto do drink
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm mt-3"
        style={{ border: `1px solid ${COLORS.line}`, color: COLORS.cream }}
      >
        <Camera size={15} /> {previewUrl ? "Trocar foto" : "Enviar foto"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      {error && (
        <p className="text-xs mt-2" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
          foto obrigatória
        </p>
      )}
    </div>
  );
}

export default function NewCheckIn() {
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [drinkName, setDrinkName] = useState("");
  const [establishment, setEstablishment] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dedupe, setDedupe] = useState(null);
  const [toast, setToast] = useState(null);
  const [savedEntries, setSavedEntries] = useState([]);

  function askDedupe(kind, typedName, candidateName) {
    return new Promise((resolve) => setDedupe({ kind, typedName, candidateName, resolve }));
  }

  async function resolveCatalogItem(kind, name) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const data = await api.get(`/${kind}/?search=${encodeURIComponent(trimmed)}`);
    const results = data.results || [];
    const exact = results.find((r) => r.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (exact) return exact.id;

    if (results.length > 0) {
      const useExisting = await askDedupe(kind, trimmed, results[0].name);
      if (useExisting) return results[0].id;
    }

    const created = await api.post(`/${kind}/`, { name: trimmed });
    return created.id;
  }

  function resetForNewLocation() {
    setPhotoFile(null);
    setPreviewUrl(null);
    setEstablishment("");
    setRating(0);
    setComment("");
    setErrors({});
  }

  function resetAll() {
    resetForNewLocation();
    setDrinkName("");
    setSavedEntries([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const newErrors = {};
    if (!photoFile) newErrors.photo = true;
    if (!drinkName.trim()) newErrors.name = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setBusy(true);
    try {
      const drinkId = await resolveCatalogItem("drinks", drinkName);
      const establishmentId = establishment.trim() ? await resolveCatalogItem("establishments", establishment) : null;

      const formData = new FormData();
      formData.append("drink", drinkId);
      if (establishmentId) formData.append("establishment", establishmentId);
      formData.append("photo", photoFile);
      if (rating) formData.append("rating", rating);
      if (comment.trim()) formData.append("comment", comment.trim());

      const created = await api.post("/checkins/", formData, { isFormData: true });
      setSavedEntries((prev) => [
        { id: created.id, establishment: established_name(created), rating: created.rating },
        ...prev,
      ]);
      setToast("Registro salvo");
      setTimeout(() => setToast(null), 2200);
      resetForNewLocation();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o registro");
    } finally {
      setBusy(false);
    }
  }

  function established_name(created) {
    return created.establishment_detail?.name || "";
  }

  return (
    <div className="w-full flex justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.2em] mb-1 text-center" style={{ color: COLORS.amber, fontFamily: FONT_MONO }}>
          glasscheck · novo registro
        </p>
        <h1
          className="text-center mb-8"
          style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 28 }}
        >
          Que drink você tomou?
        </h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-5"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}
        >
          <PhotoWell
            previewUrl={previewUrl}
            error={errors.photo}
            onFile={(file) => {
              setPhotoFile(file);
              setPreviewUrl(URL.createObjectURL(file));
              setErrors((e) => ({ ...e, photo: false }));
            }}
          />

          <div className="mt-5">
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
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
                fontFamily: FONT_SERIF,
                fontSize: 20,
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
                nome do drink é obrigatório
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="text-xs uppercase tracking-wide flex items-center gap-1" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
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
            <label className="text-xs uppercase tracking-wide block mb-2" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              nota (opcional)
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="mt-5">
            <label className="text-xs uppercase tracking-wide" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
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

          {error && (
            <p className="text-xs mt-4" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-6 py-3 rounded-lg text-sm uppercase tracking-wide disabled:opacity-60"
            style={{ background: COLORS.amber, color: COLORS.ink, fontFamily: FONT_MONO, fontWeight: 500 }}
          >
            {busy ? "salvando..." : "Salvar registro"}
          </button>
        </form>

        {savedEntries.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
              registros salvos nesta sessão para "{drinkName}"
            </p>
            <div className="space-y-2">
              {savedEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
                  <p className="text-xs" style={{ color: COLORS.sage }}>{entry.establishment || "sem local"}</p>
                  <div className="flex items-center gap-1">
                    <Star size={13} fill={COLORS.amber} color={COLORS.amber} />
                    <span className="text-xs" style={{ color: COLORS.cream, fontFamily: FONT_MONO }}>{entry.rating || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="w-full mt-3 py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
              style={{ border: `1px dashed ${COLORS.line}`, color: COLORS.sage, fontFamily: FONT_MONO }}
            >
              <Plus size={13} /> registrar outro drink
            </button>
          </div>
        )}
      </div>

      {dedupe && (
        <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: "rgba(18,32,27,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: COLORS.amber, fontFamily: FONT_MONO }}>
              já existe no catálogo
            </p>
            <p className="mt-2" style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 18 }}>
              Já existe "{dedupe.candidateName}" no catálogo global — é esse?
            </p>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  dedupe.resolve(false);
                  setDedupe(null);
                }}
                className="flex-1 py-2 rounded-lg text-xs"
                style={{ border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: FONT_MONO }}
              >
                Não, é outro
              </button>
              <button
                type="button"
                onClick={() => {
                  dedupe.resolve(true);
                  setDedupe(null);
                }}
                className="flex-1 py-2 rounded-lg text-xs"
                style={{ background: COLORS.amber, color: COLORS.ink, fontFamily: FONT_MONO }}
              >
                Sim, é esse
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-2 z-50"
          style={{ background: COLORS.amber, color: COLORS.ink }}
        >
          <Check size={14} />
          <span className="text-xs" style={{ fontFamily: FONT_MONO }}>
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
