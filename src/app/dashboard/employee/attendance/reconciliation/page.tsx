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

interface AttendanceReconciliationRequest {
    id: string;
    userId: string;
    date: string;
    type: "SIGN_IN" | "SIGN_OUT";
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requestedTime: string;
    reviewedBy?: string;
    reviewedAt?: string;
    response?: string;
}

export default function AttendanceReconciliationEmployeePage() {
    const { session } = useSession();
    const userId = session?.user?.email;
    const [refresh, setRefresh] = useState(0);
    const [form, setForm] = useState({
        date: "",
        type: "SIGN_IN",
        reason: "",
    });
    const [submitting, setSubmitting] = useState(false);

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
            await apiClient.post("/attendance/reconciliation", {
                date: form.date,
                type: form.type,
                reason: form.reason,
            });
            setForm({ date: "", type: "SIGN_IN", reason: "" });
            setRefresh((r) => r + 1);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Submit Attendance Reconciliation Request</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                            required
                        />
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
                        <Input
                            type="text"
                            placeholder="Reason"
                            value={form.reason}
                            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                            required
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
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requested</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{req.type}</TableCell>
                                        <TableCell>{req.reason}</TableCell>
                                        <TableCell>{req.status}</TableCell>
                                        <TableCell>{new Date(req.requestedTime).toLocaleString()}</TableCell>
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
