interface HeaderProps {
  eventCount: number;
  isLoading: boolean;
}

export default function Header({ eventCount, isLoading }: HeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-rule)",
        background: "var(--color-paper)",
        padding: "0 16px",
      }}
    >
      {/* Top rule */}
      <div style={{ borderTop: "4px solid var(--color-ink)", marginBottom: 4 }} />

      {/* Meta line */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          color: "var(--color-ink-faint)",
          paddingBottom: 4,
          borderBottom: "1px solid var(--color-rule)",
          marginBottom: 6,
        }}
      >
        <span>{today}</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isLoading ? (
            <span className="loading-dots"><span /><span /><span /></span>
          ) : (
            <span>{eventCount} events</span>
          )}
        </span>
      </div>

      {/* Masthead */}
      <div style={{ textAlign: "center", paddingBottom: 8 }}>
        <h1
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
            fontSize: "clamp(22px, 3vw, 40px)",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            margin: 0,
            color: "var(--color-ink)",
            lineHeight: 1,
          }}
        >
          The Conflict Monitor
        </h1>
        <p
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            color: "var(--color-ink-faint)",
            margin: "4px 0 0",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Iran · Israel · United States — Real-time conflict tracking
        </p>
      </div>

      {/* Bottom double rule */}
      <div style={{ borderTop: "3px double var(--color-rule)" }} />
    </header>
  );
}
