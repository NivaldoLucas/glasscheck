import { COLORS, FONT_MONO, FONT_SERIF } from "../theme";

export default function StatsRow({ totalEntries, establishments, overallAvg }) {
  const stats = [
    { label: "drinks", value: totalEntries },
    { label: "locais", value: establishments },
    { label: "nota média", value: overallAvg ? overallAvg.toFixed(1) : "—" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl py-3 text-center" style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}>
          <p style={{ color: COLORS.amber, fontFamily: FONT_SERIF, fontSize: 20 }}>{s.value}</p>
          <p style={{ color: COLORS.sage, fontSize: 10, fontFamily: FONT_MONO }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}
