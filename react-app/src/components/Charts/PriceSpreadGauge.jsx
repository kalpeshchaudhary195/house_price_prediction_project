export default function PriceSpreadGauge({ low, price, high, confidence }) {
  if (!price) return null;

  const minVal = low ? low * 0.9 : price * 0.7;
  const maxVal = high ? high * 1.1 : price * 1.3;
  const range = maxVal - minVal || 1;

  const lowPct = low ? Math.max(5, Math.min(90, ((low - minVal) / range) * 100)) : 20;
  const pricePct = Math.max(10, Math.min(90, ((price - minVal) / range) * 100));
  const highPct = high ? Math.max(15, Math.min(95, ((high - minVal) / range) * 100)) : 80;

  const confColors = {
    High: "var(--success)",
    Medium: "var(--primary)",
    Moderate: "var(--accent)",
    Low: "var(--danger)",
  };

  const badgeColor = confColors[confidence] || "var(--primary)";

  return (
    <div className="card" style={{ padding: "24px", margin: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Ensemble Price Range & Confidence</h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            Estimated 10th to 90th percentile confidence spread across model trees.
          </p>
        </div>
        <span
          style={{
            background: `${badgeColor}18`,
            color: badgeColor,
            border: `1px solid ${badgeColor}40`,
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          ● {confidence} Confidence
        </span>
      </div>

      <div style={{ position: "relative", height: "40px", margin: "30px 10px 15px" }}>
        {/* Track bar */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: 0,
            right: 0,
            height: "10px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #93c5fd 0%, #3b82f6 50%, #1d4ed8 100%)",
            opacity: 0.85,
          }}
        />

        {/* Low indicator */}
        {low && (
          <div
            style={{
              position: "absolute",
              left: `${lowPct}%`,
              top: 0,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>Min (10%)</span>
            <div style={{ width: "3px", height: "18px", background: "var(--text-muted)", margin: "2px 0" }} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text)" }}>${Math.round(low).toLocaleString()}</span>
          </div>
        )}

        {/* Point estimate marker */}
        <div
          style={{
            position: "absolute",
            left: `${pricePct}%`,
            top: "-8px",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary)" }}>Estimated Price</span>
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "var(--primary)",
              border: "3px solid #fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              margin: "2px 0",
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--primary)" }}>
            ${Math.round(price).toLocaleString()}
          </span>
        </div>

        {/* High indicator */}
        {high && (
          <div
            style={{
              position: "absolute",
              left: `${highPct}%`,
              top: 0,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>Max (90%)</span>
            <div style={{ width: "3px", height: "18px", background: "var(--text-muted)", margin: "2px 0" }} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text)" }}>${Math.round(high).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
