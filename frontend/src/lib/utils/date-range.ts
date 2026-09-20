export type RangeId = "today" | "7d" | "30d" | "all";

export const RANGE_OPTIONS: { id: RangeId; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export function inRange(iso: string, range: RangeId): boolean {
  if (range === "all") return true;
  const time = new Date(iso).getTime();
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return time >= start;
  }
  const days = range === "7d" ? 7 : 30;
  return time >= now.getTime() - days * 24 * 60 * 60 * 1000;
}
