import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
  className?: string;
};

/**
 * Generic table skeleton: renders a header row and a configurable
 * number of placeholder rows with `columns` cells each.
 */
export function TableSkeleton({
  columns = 4,
  rows = 5,
  className,
}: TableSkeletonProps) {
  const colArray = Array.from({ length: columns });
  const rowArray = Array.from({ length: rows });

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Header skeleton */}
      <div
        className="grid gap-4 border-b bg-muted/50 px-4 py-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {colArray.map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-24" />
        ))}
      </div>

      {/* Row skeletons */}
      <div className="divide-y">
        {rowArray.map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-4 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {colArray.map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

