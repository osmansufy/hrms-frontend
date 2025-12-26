"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CalendarDays, Loader2, NotebookPen, Send, Info, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";

import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApplyLeave, useLeaveTypes, useMyLeaves, useUserBalances, useLeavePolicy } from "@/lib/queries/leave";
import { LeavePieChart } from "./leave-pie-chart";
import { useBalanceDetails } from "@/lib/queries/leave-balance";
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";

const schema = z.object({
  leaveTypeId: z.string().min(1, "Choose a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Add a short reason"),
});

type FormValues = z.infer<typeof schema>;

function formatRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startLabel = startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = endDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export default function LeavePage() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");

  const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();
  const { data: leaves, isLoading: leavesLoading } = useMyLeaves(userId);

  // Pie chart data for monthly leaves
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLeaves = (leaves || []).filter(l => {
    const start = new Date(l.startDate);
    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
  });
  const leaveTypeMap: Record<string, { name: string; value: number; color: string }> = {};
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#fa8072"];
  let colorIdx = 0;
  for (const leave of monthlyLeaves) {
    const type = leave.leaveType?.name || "Other";
    if (!leaveTypeMap[type]) {
      leaveTypeMap[type] = { name: type, value: 0, color: colors[colorIdx % colors.length] };
      colorIdx++;
    }
    leaveTypeMap[type].value += 1;
  }
  const pieData = Object.values(leaveTypeMap);
  const { data: balances, isLoading: balancesLoading } = useUserBalances();
  const { data: leavePolicy } = useLeavePolicy(selectedLeaveTypeId);
  const applyMutation = useApplyLeave(userId);
  console.log({ leavePolicy });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const watchedValues = form.watch();
  const selectedBalance = useMemo(() => {
    return balances?.find(b => b.leaveTypeId === watchedValues.leaveTypeId);
  }, [balances, watchedValues.leaveTypeId]);
  console.log({ selectedBalance });
  // Calculate requested days
  const requestedDays = useMemo(() => {
    if (!watchedValues.startDate || !watchedValues.endDate) return 0;
    const start = new Date(watchedValues.startDate);
    const end = new Date(watchedValues.endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [watchedValues.startDate, watchedValues.endDate]);

  // Check notice period requirement
  const noticeCheck = useMemo(() => {
    if (!watchedValues.startDate || !leavePolicy?.noticeRules || requestedDays === 0) {
      return { valid: true, warning: null, error: null, requiredDays: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(watchedValues.startDate);
    startDate.setHours(0, 0, 0, 0);

    const daysDifference = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Find applicable notice rule based on leave duration
    const applicableRule = leavePolicy.noticeRules.find(rule => {
      const meetsMin = rule.minLength === null || rule.minLength === undefined || requestedDays >= rule.minLength;
      const meetsMax = rule.maxLength === null || rule.maxLength === undefined || requestedDays <= rule.maxLength;
      return meetsMin && meetsMax;
    });

    if (!applicableRule) {
      return { valid: true, warning: null, error: null, requiredDays: 0 };
    }

    const requiredNoticeDays = applicableRule.noticeDays;

    if (daysDifference < requiredNoticeDays) {
      const shortfall = requiredNoticeDays - daysDifference;
      return {
        valid: false,
        warning: null,
        error: `Notice period not met: ${requestedDays} day${requestedDays > 1 ? 's' : ''} leave requires ${requiredNoticeDays} days notice, you provided ${Math.max(0, daysDifference)} days. Shortfall: ${shortfall} days.`,
        requiredDays: requiredNoticeDays
      };
    }

    if (daysDifference === requiredNoticeDays) {
      return {
        valid: true,
        warning: `Minimum notice period met (${requiredNoticeDays} days required).`,
        error: null,
        requiredDays: requiredNoticeDays
      };
    }

    return { valid: true, warning: null, error: null, requiredDays: requiredNoticeDays };
  }, [watchedValues.startDate, leavePolicy, requestedDays]);

  // Check for overlapping leaves
  const overlapCheck = useMemo(() => {
    if (!watchedValues.startDate || !watchedValues.endDate || !leaves) {
      return { hasOverlap: false, warning: null, error: null };
    }

    const requestStart = new Date(watchedValues.startDate);
    const requestEnd = new Date(watchedValues.endDate);

    // Check only approved or pending leaves
    const activeLeaves = leaves.filter(leave =>
      ['PENDING', 'APPROVED', 'APPROVED_BY_MANAGER'].includes(leave.status.toUpperCase())
    );

    for (const leave of activeLeaves) {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);

      // Check if date ranges overlap
      const overlaps = requestStart <= leaveEnd && requestEnd >= leaveStart;

      if (overlaps) {
        return {
          hasOverlap: true,
          warning: null,
          error: `Overlapping leave: You have ${leave.status.toLowerCase()} leave from ${formatRange(leave.startDate, leave.endDate)}`
        };
      }
    }

    return { hasOverlap: false, warning: null, error: null };
  }, [watchedValues.startDate, watchedValues.endDate, leaves]);

  // Check balance sufficiency
  const balanceCheck = useMemo(() => {
    if (!selectedBalance || requestedDays === 0) {
      return { sufficient: true, warning: null, error: null };
    }

    const available = selectedBalance.available;

    if (available < requestedDays) {
      const deficit = requestedDays - available;
      return {
        sufficient: false,
        warning: null,
        error: `Insufficient balance: You have ${available} days available, but requested ${requestedDays} days. Shortfall: ${deficit} days.`
      };
    }

    if (available === requestedDays) {
      return {
        sufficient: true,
        warning: "This request will use your entire available balance.",
        error: null
      };
    }

    if (available - requestedDays < 2) {
      return {
        sufficient: true,
        warning: `After this request, you will have only ${available - requestedDays} days remaining.`,
        error: null
      };
    }

    return { sufficient: true, warning: null, error: null };
  }, [selectedBalance, requestedDays]);

  const sortedLeaves = useMemo(
    () => (leaves ?? []).slice().sort((a, b) => (a.startDate > b.startDate ? -1 : 1)),
    [leaves],
  );

  const onSubmit = async (values: FormValues) => {
    if (new Date(values.endDate) < new Date(values.startDate)) {
      form.setError("endDate", { message: "End date must be after start date" });
      return;
    }

    // Final validation checks before submission
    if (!balanceCheck.sufficient) {
      toast.error("Insufficient leave balance", {
        description: balanceCheck.error || undefined,
      });
      return;
    }

    if (!noticeCheck.valid) {
      toast.error("Notice period requirement not met", {
        description: noticeCheck.error || undefined,
      });
      return;
    }

    if (overlapCheck.hasOverlap) {
      toast.error("Overlapping leave detected", {
        description: overlapCheck.error || undefined,
      });
      return;
    }

    try {
      await applyMutation.mutateAsync(values);
      toast.success("Leave request submitted", {
        description: "Your leave request has been submitted for approval"
      });
      form.reset();
      setSelectedLeaveTypeId("");
    } catch (error) {
      console.error(error);

      // Enhanced error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        const errorData = apiError.response?.data;

        if (errorData?.code) {
          // Handle specific error codes
          switch (errorData.code) {
            case 'INSUFFICIENT_BALANCE':
              toast.error("Insufficient leave balance", {
                description: errorData.message || errorData.details
              });
              break;
            case 'NOTICE_PERIOD_NOT_MET':
              toast.error("Notice period requirement not met", {
                description: errorData.message || errorData.details
              });
              break;
            case 'OVERLAPPING_LEAVE':
              toast.error("Overlapping leave detected", {
                description: errorData.message || errorData.details
              });
              break;
            default:
              toast.error("Submission failed", {
                description: errorData.message || "Could not submit leave request"
              });
          }
        } else if (errorData?.validationErrors) {
          // Handle validation errors
          const validationMessages = errorData.validationErrors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(', ');
          toast.error("Validation error", {
            description: validationMessages
          });
        } else {
          toast.error("Submission failed", {
            description: errorData?.message || "Could not submit leave request"
          });
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : "Could not submit leave request";
        toast.error("Submission failed", {
          description: errorMessage,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Leave Pie Chart */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Monthly Leave Summary</h2>
        {pieData.length > 0 ? (
          <div className="max-w-xs mx-auto">
            <LeavePieChart data={pieData} />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No leaves taken this month.</div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Time away</p>
          <h1 className="text-2xl font-semibold">Leave</h1>
        </div>
        <Badge variant="secondary">
          <CalendarDays className="mr-2 size-4" />
          Request and track your leave
        </Badge>
      </div>

      {/* Policy context and progressive disclosure for leave balance */}
      <div className="mb-4">
        <div className="text-sm text-muted-foreground mb-1">
          Company leave policy applies. Manager approval required. Team workload will be considered.
        </div>
        <div className="text-xs text-gray-500">
          Leave eligibility (as per policy)
        </div>
      </div>

      {/* Usage awareness: show leaves taken this year */}
      {leaves && (
        <div className="mb-2 text-xs text-gray-500">
          Leaves taken this year: {leaves.filter(l => new Date(l.startDate).getFullYear() === new Date().getFullYear()).length}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Apply for leave</CardTitle>
            <CardDescription>Select a type and choose your dates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="leaveTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedLeaveTypeId(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={typesLoading ? "Loading..." : "Select type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(leaveTypes ?? []).map((lt) => (
                            <SelectItem key={lt.id} value={lt.id}>
                              {lt.name} ({lt.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {/* Show leave notice rule in small text if available */}
                      {leavePolicy?.noticeRules && leavePolicy.noticeRules.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {leavePolicy.noticeRules.map((rule, idx) => (
                            <div key={idx}>
                              {rule.minLength && rule.maxLength
                                ? `For ${rule.minLength}-${rule.maxLength} days: `
                                : rule.minLength
                                  ? `For ${rule.minLength}+ days: `
                                  : ''}
                              {`Requires ${rule.noticeDays} day${rule.noticeDays > 1 ? 's' : ''} notice`}
                            </div>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Balance Display */}
                {/* Progressive disclosure: show balance only after dates are selected */}
                {selectedBalance && watchedValues.startDate && watchedValues.endDate ? (
                  <div className="rounded border bg-muted/50 p-2 mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Leave balance (subject to policy)</span>
                      <span className="font-semibold">{selectedBalance.available} days</span>
                    </div>
                    {selectedBalance.carried > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Includes {selectedBalance.carried} carried forward days
                      </div>
                    )}
                  </div>
                ) : selectedBalance ? (
                  <div className="text-xs text-gray-400 mt-2">Leave balance available</div>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => {
                      const today = new Date().toISOString().split('T')[0];
                      const maxDate = leavePolicy?.allowAdvance
                        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        : today;
                      return (
                        <FormItem>
                          <FormLabel>Start date</FormLabel>
                          <FormControl>
                            <Input type="date" min={today} max={maxDate} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => {
                      const today = new Date().toISOString().split('T')[0];
                      const maxDate = leavePolicy?.allowAdvance
                        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                        : today;
                      return (
                        <FormItem>
                          <FormLabel>End date</FormLabel>
                          <FormControl>
                            <Input type="date" min={today} max={maxDate} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Short reason for your manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notice Period Info */}
                {leavePolicy && noticeCheck.requiredDays > 0 && requestedDays > 0 && (
                  <Alert variant="info">
                    <Info className="size-4" />
                    <AlertDescription>
                      This leave type requires {noticeCheck.requiredDays} days notice for {requestedDays} day{requestedDays > 1 ? 's' : ''} leave.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Requested Days Display */}
                {requestedDays > 0 && (
                  <div className="rounded-lg border-2 border-dashed bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requested Days</span>
                      <span className="text-lg font-bold">{requestedDays} days</span>
                    </div>
                  </div>
                )}

                {/* Notice Period Error */}
                {noticeCheck.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertDescription>{noticeCheck.error}</AlertDescription>
                  </Alert>
                )}

                {/* Notice Period Warning */}
                {noticeCheck.warning && !noticeCheck.error && (
                  <Alert variant="warning">
                    <Info className="size-4" />
                    <AlertDescription>{noticeCheck.warning}</AlertDescription>
                  </Alert>
                )}

                {/* Overlap Error */}
                {overlapCheck.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertDescription>{overlapCheck.error}</AlertDescription>
                  </Alert>
                )}

                {/* Balance Error Alert */}
                {balanceCheck.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertDescription>{balanceCheck.error}</AlertDescription>
                  </Alert>
                )}

                {/* Balance Warning Alert */}
                {balanceCheck.warning && !balanceCheck.error && (
                  <Alert variant="warning">
                    <Info className="size-4" />
                    <AlertDescription>{balanceCheck.warning}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    applyMutation.isPending ||
                    !balanceCheck.sufficient ||
                    !noticeCheck.valid ||
                    overlapCheck.hasOverlap
                  }
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Submit request {requestedDays > 0 && `(${requestedDays} days)`}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>Track approvals and dates.</CardDescription>
          </CardHeader>
          <CardContent>
            {leavesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading leave history...
              </div>
            ) : sortedLeaves.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-3 text-sm text-muted-foreground">
                <NotebookPen className="size-4" />
                No leave requests yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-25">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeaves.map((leave) => (
                    <TableRow key={leave.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/employee/leave/${leave.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          {leave.leaveType?.name || leave.leaveTypeId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatRange(leave.startDate, leave.endDate)}
                      </TableCell>
                      <TableCell>
                        <LeaveStatusBadge status={leave.status} />
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/employee/leave/${leave.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="size-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
