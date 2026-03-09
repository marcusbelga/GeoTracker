interface VerificationBadgeProps {
  isVerified: boolean;
  sourceCount: number;
}

export default function VerificationBadge({ isVerified, sourceCount }: VerificationBadgeProps) {
  return (
    <span className={`badge-verified ${isVerified ? "" : "badge-unverified"}`}>
      {isVerified ? "✓" : "·"} {sourceCount} {sourceCount === 1 ? "source" : "sources"}
    </span>
  );
}
