"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { formatInDhakaTimezone } from "@/lib/utils";
import type { RelatedLeaveAmendment } from "@/lib/api/leave";
import { FileEdit, Calendar, User } from "lucide-react";

type RelatedAmendmentsTimelineProps = {
  amendments: RelatedLeaveAmendment[];
};

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return formatInDhakaTimezone(dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RelatedAmendmentsTimeline({ amendments }: RelatedAmendmentsTimelineProps) {
  if (!amendments.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileEdit className="size-5" />
          Related amendment requests
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Amendment or cancellation requests for this leave, in order of request.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {amendments.map((a) => {
            const creatorName = a.createdBy?.employee
              ? `${a.createdBy.employee.firstName} ${a.createdBy.employee.lastName}`
              : a.createdBy?.name ?? a.createdBy?.email ?? "—";
            return (
              <li
                key={a.id}
                className="relative flex gap-4 rounded-lg border bg-muted/30 p-4 pl-6 before:absolute before:left-2 before:top-6 before:size-2 before:rounded-full before:bg-primary/50"
              >
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={a.changeType === "CANCEL" ? "destructive" : "secondary"}>
                      {a.changeType === "CANCEL" ? "Cancel leave" : "Amend dates"}
                    </Badge>
                    <LeaveStatusBadge status={a.status} />
                  </div>
                  {a.reason && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.reason}</p>
                  )}
                  {a.changeType === "AMEND" && (a.newStartDate || a.newEndDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>
                        New dates: {formatDate(a.newStartDate)} – {formatDate(a.newEndDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="size-3.5" />
                    <span>Requested by {creatorName}</span>
                    <span>·</span>
                    <span>{formatInDhakaTimezone(a.createdAt, { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
