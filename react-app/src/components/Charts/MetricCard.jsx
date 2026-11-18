export default function MetricCard({ title, value, subtitle, icon, highlight = false, badge }) {
  return (
    <div className={`card ${highlight ? "card-highlight" : ""}`} style={{ position: "relative", overflow: "hidden" }}>
      {badge && (
        <span
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(37, 99, 235, 0.12)",
            color: "var(--primary)",
            padding: "3px 8px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          {badge}
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        {icon && <span style={{ fontSize: "24px" }}>{icon}</span>}
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: "28px", fontWeight: "700", color: highlight ? "var(--primary)" : "var(--text)", margin: "4px 0" }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
