import { TableSkeleton } from "@/components/ui/PageSkeletons";

/** Shown instantly while the next dashboard page is being prepared. */
export default function Loading() {
  return <TableSkeleton />;
}
