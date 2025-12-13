"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Loader2, NotebookPen, Send } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { useApplyLeave, useLeaveTypes, useMyLeaves, useUserBalances } from "@/lib/queries/leave";
import { LeaveBalanceCard } from "@/components/leave/leave-balance-card";

const schema = z.object({
  leaveTypeId: z.string().min(1, "Choose a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(5, "Add a short reason"),
});

type FormValues = z.infer<typeof schema>;

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
};

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

  const { data: leaveTypes, isLoading: typesLoading } = useLeaveTypes();
  const { data: leaves, isLoading: leavesLoading } = useMyLeaves(userId);
  const { data: balances, isLoading: balancesLoading } = useUserBalances();
  const applyMutation = useApplyLeave(userId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const sortedLeaves = useMemo(
    () => (leaves ?? []).slice().sort((a, b) => (a.startDate > b.startDate ? -1 : 1)),
    [leaves],
  );

  const onSubmit = async (values: FormValues) => {
    if (new Date(values.endDate) < new Date(values.startDate)) {
      form.setError("endDate", { message: "End date must be after start date" });
      return;
    }
    try {
      await applyMutation.mutateAsync(values);
      toast.success("Leave request submitted");
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Could not submit leave request");
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Leave Balance Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Leave Balances</h2>
        {balancesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : balances && balances.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {balances.map((balance) => (
              <LeaveBalanceCard key={balance.id} balance={balance} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No leave balances found. Contact HR to initialize your leave balances.
            </CardContent>
          </Card>
        )}
      </div>

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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Submit request
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">
                        {leave.leaveType?.name || leave.leaveTypeId}
                      </TableCell>
                      <TableCell>
                        {formatRange(leave.startDate, leave.endDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[leave.status] ?? "outline"}>
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
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
