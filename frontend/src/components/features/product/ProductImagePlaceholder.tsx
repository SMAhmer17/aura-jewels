import { Gem } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const GRADIENTS = [
  "from-[#f2ecdd] to-[#ddcda0]",
  "from-[#efe6d3] to-[#d9cba0]",
  "from-[#f5f0e6] to-[#e2d3ab]",
  "from-[#eee5d1] to-[#c9b98c]",
];

function hashToIndex(id: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % mod;
}

export function ProductImagePlaceholder({ id, className }: { id: string; className?: string }) {
  const gradient = GRADIENTS[hashToIndex(id, GRADIENTS.length)];

  return (
    <div
      className={cn("flex items-center justify-center bg-gradient-to-br", gradient, className)}
    >
      <Gem className="text-ink/25" size={36} strokeWidth={1} />
    </div>
  );
}
