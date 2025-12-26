"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

// Types for reconciliation requests
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

export default function AttendanceReconciliationAdminPage() {
    const [refresh, setRefresh] = useState(0);

    // Fetch all reconciliation requests (admin/HR)
    const { data, isLoading, refetch } = useQuery<AttendanceReconciliationRequest[]>({
        queryKey: ["attendance-reconciliation-requests", refresh],
        queryFn: async () => {
            const res = await apiClient.get("/attendance/reconciliation");
            return res.data;
        },
    });

    const handleApprove = async (id: string) => {
        await apiClient.put(`/attendance/reconciliation/${id}/status`, { status: "APPROVED" });
        setRefresh((r) => r + 1);
    };
    const handleReject = async (id: string) => {
        await apiClient.put(`/attendance/reconciliation/${id}/status`, { status: "REJECTED" });
        setRefresh((r) => r + 1);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Reconciliation Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>{new Date(req.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{req.userId}</TableCell>
                                        <TableCell>{req.type}</TableCell>
                                        <TableCell>{req.reason}</TableCell>
                                        <TableCell>{req.status}</TableCell>
                                        <TableCell>
                                            {req.status === "PENDING" && (
                                                <>
                                                    <Button size="sm" onClick={() => handleApprove(req.id)} className="mr-2">Approve</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>Reject</Button>
                                                </>
                                            )}
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
