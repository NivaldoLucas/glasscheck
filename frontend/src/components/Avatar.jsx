import { COLORS, FONT_SERIF } from "../theme";

const SIZES = {
  sm: { box: "w-9 h-9", font: 13 },
  md: { box: "w-16 h-16", font: 22 },
};

export default function Avatar({ username, url, size = "md" }) {
  const { box, font } = SIZES[size];
  return (
    <div
      className={`${box} rounded-full flex items-center justify-center shrink-0 overflow-hidden`}
      style={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}` }}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ color: COLORS.amber, fontFamily: FONT_SERIF, fontSize: font }}>
          {username.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
