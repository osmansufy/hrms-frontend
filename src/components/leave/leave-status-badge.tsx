"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusLabel, getStatusVariant, getStatusDescription } from "@/lib/types/leave";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeaveStatusBadgeProps {
  status: string;
  showTooltip?: boolean;
}

export function LeaveStatusBadge({ status, showTooltip = true }: LeaveStatusBadgeProps) {
  const badge = (
    <Badge variant={getStatusVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  const description = getStatusDescription(status);
  if (!description) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
