"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusLabel, getStatusVariant, getStatusDescription } from "@/lib/types/leave";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2 } from "lucide-react";

interface LeaveStatusBadgeProps {
  status: string;
  showTooltip?: boolean;
  compact?: boolean;
}

export function LeaveStatusBadge({ status, showTooltip = true, compact = false }: LeaveStatusBadgeProps) {
  const isProcessing = status === "PROCESSING";

  // Compact mode - just show icon badge
  if (compact && isProcessing) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 px-2">
            <CheckCircle2 className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Approved by Line Manager, awaiting HR approval</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (compact) {
    return <Badge variant={getStatusVariant(status)}>{getStatusLabel(status).charAt(0)}</Badge>;
  }

  const badge = (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant(status)}>
        {getStatusLabel(status)}
      </Badge>
      {isProcessing && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle2 className="h-3 w-3" />
              Manager Approved
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Approved by Line Manager, awaiting HR approval</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
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
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(status)}>
              {getStatusLabel(status)}
            </Badge>
            {isProcessing && (
              <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <CheckCircle2 className="h-3 w-3" />
                Manager Approved
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
