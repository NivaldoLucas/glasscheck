import { Star, Wine, Layers } from "lucide-react";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

function avg(entries) {
  const rated = entries.filter((e) => e.rating > 0);
  if (!rated.length) return 0;
  return rated.reduce((s, e) => s + e.rating, 0) / rated.length;
}

export default function DrinkCard({ drink, gradient, onOpen }) {
  const [from, to] = gradient;
  const rating = avg(drink.entries);
  const cover = drink.cover;

  return (
    <button
      type="button"
      onClick={() => onOpen(drink)}
      className="relative rounded-xl overflow-hidden text-left"
      style={{ aspectRatio: "1 / 1.15" }}
    >
      {cover ? (
        <img src={cover} alt={drink.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}>
          <Wine size={26} color="rgba(244,238,224,0.55)" strokeWidth={1.2} />
        </div>
      )}

      {drink.entries.length > 1 && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: "rgba(18,32,27,0.75)" }}>
          <Layers size={10} color={COLORS.cream} />
          <span style={{ color: COLORS.cream, fontSize: 10, fontFamily: FONT_MONO }}>×{drink.entries.length}</span>
        </div>
      )}

      {rating > 0 && (
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: COLORS.amber }}>
          <Star size={10} fill={COLORS.ink} color={COLORS.ink} />
          <span style={{ color: COLORS.ink, fontSize: 10, fontFamily: FONT_MONO, fontWeight: 600 }}>{rating.toFixed(1)}</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-2 py-2" style={{ background: "linear-gradient(transparent, rgba(18,32,27,0.92))" }}>
        <p style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 13, lineHeight: 1.15 }}>{drink.name}</p>
      </div>
    </button>
  );
}

export { avg };
