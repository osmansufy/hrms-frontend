"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useSession } from "@/components/auth/session-provider";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { formatDateInDhaka, formatTimeInTimezone } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTimezone } from "@/contexts/timezone-context";

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

export default function AttendanceReconciliationEmployeePage() {
    const { session } = useSession();
    const { timezone } = useTimezone();
    const userId = session?.user?.email;
    const [refresh, setRefresh] = useState(0);
    const [form, setForm] = useState({
        date: "",
        type: "SIGN_IN",
        requestedSignIn: "",
        requestedSignOut: "",
        reason: "",
    });
    const [submitting, setSubmitting] = useState(false);

    // Helper to get timezone offset in hours (simplified - works for most cases)
    const getTimezoneOffsetHours = (tz: string): number => {
        const offsets: Record<string, number> = {
            "Asia/Dhaka": 6,
            "Asia/Kolkata": 5.5,
            "Asia/Karachi": 5,
            "Asia/Dubai": 4,
            "America/New_York": -5,
            "America/Chicago": -6,
            "America/Los_Angeles": -8,
            "Europe/London": 0,
            "Europe/Paris": 1,
        };
        return offsets[tz] ?? 6;
    };

    // Fetch employee's own reconciliation requests
    const { data, isLoading } = useQuery<AttendanceReconciliationRequest[]>({
        queryKey: ["attendance-reconciliation-requests-employee", userId, refresh],
        queryFn: async () => {
            if (!userId) return [];
            const res = await apiClient.get("/attendance/reconciliation/my");
            return res.data;
        },
        enabled: !!userId,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !form.date || !form.reason) return;
        setSubmitting(true);
        try {
            // Properly construct datetime in system timezone and convert to UTC ISO string
            let requestedSignIn: string | undefined;
            let requestedSignOut: string | undefined;

            const offsetHours = getTimezoneOffsetHours(timezone);
            const offsetSign = offsetHours >= 0 ? "+" : "-";
            const offsetHoursAbs = Math.abs(offsetHours);
            const offsetMins = Math.abs((offsetHours % 1) * 60);
            const offsetStr = `${offsetSign}${String(offsetHoursAbs).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

            if (form.type === "SIGN_IN" && form.requestedSignIn) {
                // Create date in system timezone
                const dateTimeStr = `${form.date}T${form.requestedSignIn}:00${offsetStr}`;
                const date = new Date(dateTimeStr);
                requestedSignIn = date.toISOString();
            }

            if (form.type === "SIGN_OUT" && form.requestedSignOut) {
                // Create date in system timezone
                const dateTimeStr = `${form.date}T${form.requestedSignOut}:00${offsetStr}`;
                const date = new Date(dateTimeStr);
                requestedSignOut = date.toISOString();
            }

            await apiClient.post("/attendance/reconciliation", {
                date: form.date,
                type: form.type,
                requestedSignIn,
                requestedSignOut,
                reason: form.reason,
            });
            setForm({ date: "", type: "SIGN_IN", requestedSignIn: "", requestedSignOut: "", reason: "" });
            setRefresh((r) => r + 1);
        } finally {
            setSubmitting(false);
        }
    };

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
                                max={new Date().toISOString().split('T')[0]}
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
                        <Button type="submit" disabled={submitting}>Submit Request</Button>
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
                                        <TableCell>{formatDateInDhaka(req.date, "long")}</TableCell>
                                        <TableCell>{req.type}</TableCell>
                                        <TableCell>
                                            {req.type === "SIGN_IN"
                                                ? (req.originalSignIn ? formatTimeInTimezone(req.originalSignIn) : "Missing")
                                                : (req.originalSignOut ? formatTimeInTimezone(req.originalSignOut) : "Missing")}
                                        </TableCell>
                                        <TableCell>
                                            {req.type === "SIGN_IN"
                                                ? (req.requestedSignIn ? formatTimeInTimezone(req.requestedSignIn) : "-")
                                                : (req.requestedSignOut ? formatTimeInTimezone(req.requestedSignOut) : "-")}
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
