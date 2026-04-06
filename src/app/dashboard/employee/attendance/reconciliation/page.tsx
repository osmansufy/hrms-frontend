"use client";
import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useSession } from "@/components/auth/session-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toLocalDateStr } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTimezoneFormatters } from "@/lib/hooks/use-timezone-formatters";
import { useTimezone } from "@/contexts/timezone-context";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";
import {formatISO} from 'date-fns'

interface AttendanceReconciliationRequest {
    id: string;
    userId: string;
    attendanceId?: string;
    date: string;
    type: "SIGN_IN" | "SIGN_OUT";
    originalSignIn?: string;
    originalSignOut?: string;
    requestedSignIn?: string;
    requestedSignOut?: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reviewedBy?: string;
    reviewedAt?: string;
    reviewerComment?: string;
    createdAt: string;
}

const RECONCILIATION_QUERY_KEY = "attendance-reconciliation-employee";

/**
 * Builds a UTC ISO-8601 string from a local date (YYYY-MM-DD) + time (HH:mm)
 * in the given IANA timezone.  Uses date-fns-tz for DST-aware conversion —
 * same library the backend uses.
 */
function localDateTimeToISO(date: string, time: string, timezone: string): string {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    const zonedDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return fromZonedTime(zonedDate, timezone).toISOString();
}

export default function AttendanceReconciliationEmployeePage() {
    const { session } = useSession();
    const queryClient = useQueryClient();
    const { timezone } = useTimezone();
    const { formatDate, formatTime } = useTimezoneFormatters();
    const userEmail = session?.user?.email;
    const [form, setForm] = useState({
        date: "",
        type: "SIGN_IN" as "SIGN_IN" | "SIGN_OUT",
        requestedSignIn: "",
        requestedSignOut: "",
        reason: "",
    });

    const { data, isLoading } = useQuery<AttendanceReconciliationRequest[]>({
        queryKey: [RECONCILIATION_QUERY_KEY, userEmail],
        queryFn: async () => {
            if (!userEmail) return [];
            const res = await apiClient.get("/attendance/reconciliation/my");
            return res.data;
        },
        enabled: !!userEmail,
        staleTime: 30_000,
    });

    const submitMutation = useMutation({
        mutationFn: async (payload: {
            date: string;
            type: string;
            requestedSignIn?: string;
            requestedSignOut?: string;
            reason: string;
        }) => {
            const res = await apiClient.post("/attendance/reconciliation", payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [RECONCILIATION_QUERY_KEY] });
            toast.success("Reconciliation request submitted");
        },
        onError: (error: any) => {
            const data = error?.response?.data;
            const rawMsg = data?.message ?? data?.error ?? error?.message;

            const msg =
                typeof rawMsg === "string"
                    ? rawMsg
                    : Array.isArray(rawMsg)
                      ? rawMsg.filter((x) => typeof x === "string").join("\n")
                      : typeof rawMsg?.message === "string"
                        ? rawMsg.message
                        : "Failed to submit request";

            toast.error(msg);
        },
    });

    const resetForm = useCallback(() => {
        setForm({ date: "", type: "SIGN_IN", requestedSignIn: "", requestedSignOut: "", reason: "" });
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userEmail || !form.date || !form.reason) return;

        let requestedSignIn: Date | undefined;
        let requestedSignOut: Date | undefined;
console.log(form);
//
// date
// : 
// "2026-04-06"
// reason
// : 
// "using date-fns"
// requestedSignIn
// : 
// "10:28"
// requestedSignOut
// : 
// ""
// type
// : 
// "SIGN_IN"

// create date object from form.date and form.requestedSignIn and form.requestedSignOut
const date = new Date(form.date);
 requestedSignIn = new Date(`${form.date}T${form.requestedSignIn}`);
 requestedSignOut = form.requestedSignOut ? new Date(`${form.date}T${form.requestedSignOut}`) : undefined;
 // convert date to ISO string with date-fns
 const dateISO = formatISO(date, { representation: 'complete' });
 const requestedSignInISO = formatISO(requestedSignIn, { representation: 'complete' });
 const requestedSignOutISO = requestedSignOut ? formatISO(requestedSignOut, { representation: 'complete' }) : undefined;

       if(!requestedSignInISO && !requestedSignOutISO) {
        toast.error("Please select a time");
        return;
       }

        await submitMutation.mutateAsync({
                date: form.date,
                type: form.type as "SIGN_IN" | "SIGN_OUT",
                requestedSignIn: requestedSignInISO ? requestedSignInISO : undefined,
                requestedSignOut: requestedSignOutISO ? requestedSignOutISO : undefined,
                reason: form.reason,
        });
        resetForm();
    }, [userEmail, form, timezone, submitMutation, resetForm]);

    const todayLocal = toLocalDateStr(new Date());

    return (
        <div className="container space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Submit Attendance Reconciliation Request</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                max={todayLocal}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Only past dates can be selected</p>
                        </div>
                        <Select
                            value={form.type}
                            onValueChange={(v) => setForm((f) => ({ ...f, type: v as "SIGN_IN" | "SIGN_OUT" }))}
                        >
                            <SelectTrigger>
                                <SelectValue>{form.type === "SIGN_IN" ? "Sign In" : "Sign Out"}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SIGN_IN">Sign In</SelectItem>
                                <SelectItem value="SIGN_OUT">Sign Out</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.type === "SIGN_IN" && (
                            <div>
                                <label className="text-sm font-medium">Requested Sign-In Time</label>
                                <Input
                                    type="time"
                                    value={form.requestedSignIn}
                                    onChange={(e) => setForm((f) => ({ ...f, requestedSignIn: e.target.value }))}
                                    required
                                />
                            </div>
                        )}
                        {form.type === "SIGN_OUT" && (
                            <div>
                                <label className="text-sm font-medium">Requested Sign-Out Time</label>
                                <Input
                                    type="time"
                                    value={form.requestedSignOut}
                                    onChange={(e) => setForm((f) => ({ ...f, requestedSignOut: e.target.value }))}
                                    required
                                />
                            </div>
                        )}
                        <Textarea
                            placeholder="Reason"
                            value={form.reason}
                            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                            required
                            rows={3}
                        />
                        <Button type="submit" disabled={submitMutation.isPending}>
                            {submitMutation.isPending ? "Submitting..." : "Submit Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>My Attendance Reconciliation Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Original Time</TableHead>
                                    <TableHead>Requested Time</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{formatDate(req.date, "long")}</TableCell>
                                        <TableCell>{req.type === "SIGN_IN" ? "Sign In" : "Sign Out"}</TableCell>
                                        <TableCell>
                                            {req.type === "SIGN_IN"
                                                ? (req.originalSignIn ? formatTime(req.originalSignIn) : "Missing")
                                                : (req.originalSignOut ? formatTime(req.originalSignOut) : "Missing")}
                                        </TableCell>
                                        <TableCell>
                                            {req.type === "SIGN_IN"
                                                ? (req.requestedSignIn ? formatTime(req.requestedSignIn) : "-")
                                                : (req.requestedSignOut ? formatTime(req.requestedSignOut) : "-")}
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <p className="truncate text-sm cursor-help">
                                                            {req.reason}
                                                        </p>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-md">
                                                        <p className="whitespace-normal">
                                                            {req.reason}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${req.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                                req.status === "REJECTED" ? "bg-red-100 text-red-800" :
                                                    "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                {req.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
