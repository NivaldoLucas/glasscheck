import { Link } from "react-router-dom";
import { MapPin, Wine } from "lucide-react";
import StarRating from "./StarRating";
import { useAuth } from "../lib/auth";
import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function CheckInCard({ checkin, showUser = false }) {
  const { profile } = useAuth();
  const photo = checkin.photo_display_url;
  const isMe = checkin.username === profile?.username;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
      {photo ? (
        <img src={photo} alt={checkin.drink_detail?.name} className="w-full object-cover" style={{ maxHeight: 260 }} />
      ) : (
        <div className="w-full flex items-center justify-center" style={{ height: 160, background: COLORS.surface2 }}>
          <Wine size={28} color={COLORS.sage} strokeWidth={1.2} />
        </div>
      )}

      <div className="p-4">
        {showUser && (
          <Link
            to={isMe ? "/perfil" : `/u/${checkin.username}`}
            className="block text-xs mb-1 w-fit"
            style={{ color: COLORS.amber, fontFamily: FONT_MONO }}
          >
            @{checkin.username || checkin.user}
          </Link>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 style={{ color: COLORS.cream, fontFamily: FONT_SERIF, fontSize: 18 }}>{checkin.drink_detail?.name}</h3>
          <span style={{ color: COLORS.sage, fontFamily: FONT_MONO, fontSize: 10, whiteSpace: "nowrap" }}>
            {formatDate(checkin.created_at)}
          </span>
        </div>

        {checkin.establishment_detail && (
          <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: COLORS.sage }}>
            <MapPin size={12} /> {checkin.establishment_detail.name}
          </p>
        )}

        {checkin.rating > 0 && (
          <div className="mt-2">
            <StarRating value={checkin.rating} readOnly size={14} />
          </div>
        )}

        {checkin.comment && (
          <p className="mt-2 text-sm" style={{ color: COLORS.cream }}>
            {checkin.comment}
          </p>
        )}
      </div>
    </div>
  );
}
