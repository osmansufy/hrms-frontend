"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

export default function AttendanceReconciliationAdminPage() {
    const router = useRouter();
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} title="Back">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold">Attendance Reconciliation</h1>
            </div>
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
                                    <TableHead>Original Time</TableHead>
                                    <TableHead>Requested Time</TableHead>
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
                                        <TableCell className="text-sm">
                                            {req.type === "SIGN_IN"
                                                ? (req.originalSignIn ? new Date(req.originalSignIn).toLocaleTimeString() : "Missing")
                                                : (req.originalSignOut ? new Date(req.originalSignOut).toLocaleTimeString() : "Missing")}
                                        </TableCell>
                                        <TableCell className="text-sm font-semibold">
                                            {req.type === "SIGN_IN"
                                                ? (req.requestedSignIn ? new Date(req.requestedSignIn).toLocaleTimeString() : "-")
                                                : (req.requestedSignOut ? new Date(req.requestedSignOut).toLocaleTimeString() : "-")}
                                        </TableCell>
                                        <TableCell>{req.reason}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${req.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                                    req.status === "REJECTED" ? "bg-red-100 text-red-800" :
                                                        "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                {req.status}
                                            </span>
                                        </TableCell>
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
