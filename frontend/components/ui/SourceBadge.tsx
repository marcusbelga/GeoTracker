import { SOURCE_DISPLAY } from "@/lib/constants";

interface SourceBadgeProps {
  slug: string;
}

export default function SourceBadge({ slug }: SourceBadgeProps) {
  return (
    <span className="source-badge">
      {SOURCE_DISPLAY[slug] ?? slug.toUpperCase()}
    </span>
  );
}
