import { useState } from "react";
import { Star } from "lucide-react";
import { COLORS, FONT_MONO } from "../theme";

export default function StarRating({ value, onChange, readOnly = false, size = 22 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange(n === value ? 0 : n)}
          className="p-0.5"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            strokeWidth={1.5}
            color={COLORS.amber}
            fill={(hover || value) >= n ? COLORS.amber : "transparent"}
          />
        </button>
      ))}
      {!readOnly && (
        <span className="ml-2 text-xs tracking-wide" style={{ color: COLORS.sage, fontFamily: FONT_MONO }}>
          {value > 0 ? `${value}/5` : "sem nota"}
        </span>
      )}
    </div>
  );
}
