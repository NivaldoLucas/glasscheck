import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Star, X, ChevronLeft, ChevronRight, Wine, ImagePlus, Check, Pencil, Trash2 } from "lucide-react";
import DrinkCard, { avg } from "./DrinkCard";
import StarRating from "./StarRating";
import { api, ApiError } from "../lib/api";
import { COLORS, FONT_MONO, FONT_SERIF, GRADIENTS } from "../theme";

export function buildCatalog(checkins) {
  const byDrink = new Map();
  for (const c of checkins) {
    const key = c.drink;
    if (!byDrink.has(key)) byDrink.set(key, { id: key, name: c.drink_detail?.name, entries: [] });
    byDrink.get(key).entries.push({
      id: c.id,
      establishment: c.establishment_detail?.name || "",
      rating: c.rating || 0,
      comment: c.comment || "",
      photo: c.photo_display_url || null,
      isCover: !!c.is_cover,
      date: new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    });
  }
  for (const drink of byDrink.values()) {
    drink.cover = drink.entries.find((e) => e.isCover)?.photo ?? drink.entries.find((e) => e.photo)?.photo ?? null;
  }
  return Array.from(byDrink.values());
}

async function resolveEstablishment(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const data = await api.get(`/establishments/?search=${encodeURIComponent(trimmed)}`);
  const exact = (data.results || []).find((r) => r.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact.id;
  const created = await api.post("/establishments/", { name: trimmed });
  return created.id;
}

function EditForm({ entry, onCancel, onSaved }) {
  const [rating, setRating] = useState(entry.rating);
  const [comment, setComment] = useState(entry.comment);
  const [establishment, setEstablishment] = useState(entry.establishment);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const establishmentId = await resolveEstablishment(establishment);
      const formData = new FormData();
      formData.append("rating", rating || 0);
      formData.append("comment", comment || "");
      formData.append("establishment", establishmentId ?? "");
      if (photoFile) formData.append("photo", photoFile);
      const updated = await api.patch(`/checkins/${entry.id}/`, formData, { isFormData: true });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <label className="text-xs uppercase tracking-wide flex items-center gap-1" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
          <MapPin size={12} /> estabelecimento
        </label>
        <input
          value={establishment}
          onChange={(e) => setEstablishment(e.target.value)}
          placeholder="sem local"
          className="w-full mt-1 bg-transparent outline-none pb-1 text-sm"
          style={{ borderBottom: `1px solid ${COLORS.line}`, color: COLORS.cream }}
        />
      </div>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentário"
        rows={2}
        className="w-full bg-transparent outline-none resize-none text-sm pb-1"
        style={{ borderBottom: `1px solid ${COLORS.line}`, color: COLORS.cream }}
      />
      <label className="flex items-center gap-1.5 text-xs w-fit cursor-pointer" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
        <ImagePlus size={13} /> {photoFile ? photoFile.name : "trocar foto"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
      </label>

      {error && (
        <p className="text-xs" style={{ color: COLORS.rust, fontFamily: FONT_MONO }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2 rounded-lg text-xs disabled:opacity-60"
          style={{ border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: FONT_MONO }}
        >
          cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex-1 py-2 rounded-lg text-xs disabled:opacity-60"
          style={{ background: COLORS.amber, color: COLORS.ink, fontFamily: FONT_MONO }}
        >
          {saving ? "salvando..." : "salvar"}
        </button>
      </div>
    </div>
  );
}

function Carousel({ drink, editable, onCoverChosen, onEntryUpdated, onEntryDeleted }) {
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("view"); // view | editing | confirm-delete

  useEffect(() => {
    setIndex(0);
    setMode("view");
  }, [drink.id]);

  const entries = drink.entries;
  const entry = entries[Math.min(index, entries.length - 1)];

  useEffect(() => {
    setMode("view");
  }, [entry?.id]);

  async function chooseCover() {
    setSaving(true);
    try {
      await api.post(`/checkins/${entry.id}/set_cover/`);
      onCoverChosen(drink.id, entry.id);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await api.del(`/checkins/${entry.id}/`);
      onEntryDeleted(drink.id, entry.id);
      if (index > 0) setIndex((i) => i - 1);
      setMode("view");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden" style={{ height: 260, background: COLORS.surface2 }}>
        {entry.photo ? (
          <img src={entry.photo} alt={drink.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wine size={32} color={COLORS.sage} strokeWidth={1.2} />
          </div>
        )}

        {entries.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + entries.length) % entries.length)}
              aria-label="Foto anterior"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
              style={{ background: "rgba(18,32,27,0.7)" }}
            >
              <ChevronLeft size={16} color={COLORS.cream} />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % entries.length)}
              aria-label="Próxima foto"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full"
              style={{ background: "rgba(18,32,27,0.7)" }}
            >
              <ChevronRight size={16} color={COLORS.cream} />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {entries.map((e, i) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para foto ${i + 1}`}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: i === index ? COLORS.amber : "rgba(244,238,224,0.4)" }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {mode === "editing" ? (
        <EditForm
          entry={entry}
          onCancel={() => setMode("view")}
          onSaved={(updated) => {
            onEntryUpdated(drink.id, updated);
            setMode("view");
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin size={13} color={COLORS.sage} className="shrink-0" />
              <span className="truncate" style={{ color: COLORS.cream, fontSize: 13 }}>
                {entry.establishment || "sem local"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {entry.rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star size={11} fill={COLORS.amber} color={COLORS.amber} />
                  <span style={{ color: COLORS.cream, fontSize: 11, fontFamily: FONT_MONO }}>{entry.rating}</span>
                </span>
              )}
              <span style={{ color: COLORS.sage, fontSize: 10, fontFamily: FONT_MONO }}>{entry.date}</span>
            </div>
          </div>

          {entry.comment && (
            <p className="mt-2 text-sm" style={{ color: COLORS.cream }}>
              {entry.comment}
            </p>
          )}

          {editable && entry.photo && (
            <button
              type="button"
              onClick={chooseCover}
              disabled={saving || entry.isCover}
              className="w-full mt-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ border: `1px dashed ${COLORS.line}`, color: entry.isCover ? COLORS.amber : COLORS.sage, fontFamily: FONT_MONO }}
            >
              {entry.isCover ? (
                <>
                  <Check size={13} /> capa do catálogo
                </>
              ) : (
                <>
                  <ImagePlus size={13} /> {saving ? "salvando..." : "definir como capa"}
                </>
              )}
            </button>
          )}

          {editable && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setMode("editing")}
                className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
                style={{ border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: FONT_MONO }}
              >
                <Pencil size={13} /> editar
              </button>
              {mode === "confirm-delete" ? (
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{ background: COLORS.rust, color: COLORS.cream, fontFamily: FONT_MONO }}
                >
                  <Trash2 size={13} /> {saving ? "excluindo..." : "confirmar exclusão"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("confirm-delete")}
                  className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
                  style={{ border: `1px solid ${COLORS.rust}`, color: COLORS.rust, fontFamily: FONT_MONO }}
                >
                  <Trash2 size={13} /> excluir
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DrinkCatalog({ checkins, editable = false }) {
  const [localCheckins, setLocalCheckins] = useState(checkins);
  const [sort, setSort] = useState("recent");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setLocalCheckins(checkins);
  }, [checkins]);

  const catalog = useMemo(() => buildCatalog(localCheckins), [localCheckins]);
  const openDrink = catalog.find((d) => d.id === openId) || null;

  const filtered = useMemo(() => {
    let list = catalog.filter((d) => d.name?.toLowerCase().includes(query.toLowerCase()));
    if (sort === "top") list = [...list].sort((a, b) => avg(b.entries) - avg(a.entries));
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [catalog, query, sort]);

  function handleCoverChosen(drinkId, checkinId) {
    setLocalCheckins((prev) => prev.map((c) => (c.drink === drinkId ? { ...c, is_cover: c.id === checkinId } : c)));
  }

  function handleEntryUpdated(drinkId, updatedCheckin) {
    setLocalCheckins((prev) => prev.map((c) => (c.id === updatedCheckin.id ? updatedCheckin : c)));
  }

  function handleEntryDeleted(drinkId, checkinId) {
    setLocalCheckins((prev) => {
      const next = prev.filter((c) => c.id !== checkinId);
      const drinkHasEntriesLeft = next.some((c) => c.drink === drinkId);
      if (!drinkHasEntriesLeft) setOpenId(null);
      return next;
    });
  }

  return (
    <div>
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
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, color: COLORS.cream, fontFamily: FONT_MONO }}
        >
          <option value="recent">recentes</option>
          <option value="top">melhor avaliados</option>
          <option value="az">a-z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-10 text-sm" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
          nenhum drink encontrado
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((drink, i) => (
            <DrinkCard key={drink.id} drink={drink} gradient={GRADIENTS[i % GRADIENTS.length]} onOpen={() => setOpenId(drink.id)} />
          ))}
        </div>
      )}

      {openDrink && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0 z-50" style={{ background: "rgba(18,32,27,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 20 }}>{openDrink.name}</h2>
                <p style={{ color: COLORS.sage, fontSize: 11, fontFamily: FONT_MONO }}>
                  {openDrink.entries.length} {openDrink.entries.length > 1 ? "registros" : "registro"}
                </p>
              </div>
              <button type="button" onClick={() => setOpenId(null)} aria-label="Fechar">
                <X size={18} color={COLORS.sage} />
              </button>
            </div>
            <Carousel
              drink={openDrink}
              editable={editable}
              onCoverChosen={handleCoverChosen}
              onEntryUpdated={handleEntryUpdated}
              onEntryDeleted={handleEntryDeleted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
