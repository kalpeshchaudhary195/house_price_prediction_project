export default function ComparisonBarChart({ data = [], valueKey = "value", labelKey = "name", formatValue = (v) => v, barColor = "var(--primary)" }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 0.001);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", margin: "16px 0" }}>
      {data.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.max(4, Math.min(100, (val / maxVal) * 100));
        const isBest = item.isBest;

        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "500" }}>
              <span style={{ color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                {item[labelKey]}
                {isBest && (
                  <span style={{ background: "rgba(22, 163, 74, 0.15)", color: "var(--success)", fontSize: "11px", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                    Best
                  </span>
                )}
              </span>
              <span style={{ fontWeight: "700", color: isBest ? "var(--success)" : "var(--text)" }}>
                {formatValue(val)}
              </span>
            </div>
            <div
              style={{
                height: "10px",
                width: "100%",
                background: "rgba(15, 23, 42, 0.08)",
                borderRadius: "999px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: isBest ? "var(--success)" : barColor,
                  borderRadius: "999px",
                  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

