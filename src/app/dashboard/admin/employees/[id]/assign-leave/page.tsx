"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { useEmployeeDetail } from "@/lib/queries/employees";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLeaveTypes } from "@/lib/queries/leave";

const leaveAssignmentSchema = z.object({
    leaveType: z.string().min(1, "Leave type is required"),
    totalDays: z.number().min(0, "Days must be >= 0"),
});

type LeaveAssignmentFormData = z.infer<typeof leaveAssignmentSchema>;

interface LeaveAssignment extends LeaveAssignmentFormData {
    id?: string;
    leaveTypeName?: string;
}

export default function AssignLeavePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const employeeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const { data: employee, isLoading: employeeLoading } = useEmployeeDetail(employeeId || "");
    const { data: leaveTypes = [], isLoading: leaveTypesLoading } = useLeaveTypes();
    const [leaveAssignments, setLeaveAssignments] = useState<LeaveAssignment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<LeaveAssignmentFormData>({
        resolver: zodResolver(leaveAssignmentSchema),
        defaultValues: {
            leaveType: "",
            totalDays: 20,
        },
    });

    useEffect(() => {
        if (leaveTypes.length && !form.getValues("leaveType")) {
            form.setValue("leaveType", leaveTypes[0]?.id || "");
        }
    }, [leaveTypes, form]);

    // Add leave assignment to list
    const onAddLeaveAssignment = (data: LeaveAssignmentFormData) => {
        const numData = {
            ...data,
            totalDays: Number(data.totalDays),
        };
        const exists = leaveAssignments.some((l) => l.leaveType === numData.leaveType);

        if (exists) {
            toast.error("This leave type is already added");
            return;
        }

        const selectedType = leaveTypes.find((t) => t.id === numData.leaveType);
        setLeaveAssignments([
            ...leaveAssignments,
            {
                ...numData,
                leaveTypeName: selectedType?.name || numData.leaveType,
                id: `temp-${Date.now()}`,
            },
        ]);
        toast.success(`${selectedType?.name || numData.leaveType} added to assignment list`);
        form.reset({
            leaveType: leaveTypes[0]?.id || "",
            totalDays: 20,
        });
    };

    // Remove leave assignment from list
    const removeLeaveAssignment = (id: string | undefined) => {
        if (!id) return;
        setLeaveAssignments(leaveAssignments.filter((l) => l.id !== id));
        toast.success("Leave type removed");
    };

    // Save all leave balances to backend
    const handleSaveLeaveBalances = async () => {
        if (leaveAssignments.length === 0) {
            toast.error("Please add at least one leave type");
            return;
        }

        const userId = employee?.userId;
        if (!userId) {
            toast.error("Unable to assign leave: user ID is missing for this employee");
            return;
        }

        if (leaveTypes.length === 0) {
            toast.error("No leave types available. Please create leave types first.");
            return;
        }

        try {
            setIsSubmitting(true);

            await Promise.all(
                leaveAssignments.map((assignment) =>
                    apiClient.post("/leave/balance/initialize", {
                        userId,
                        leaveTypeId: assignment.leaveType,
                        initialBalance: assignment.totalDays,
                    })
                )
            );

            toast.success("Leave balances assigned successfully");
            router.push(`/dashboard/admin/employees/${employeeId}`);
        } catch (error: any) {
            toast.error(error?.message || "Failed to assign leave balances");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (employeeLoading || leaveTypesLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/admin/employees/${employeeId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Assign Leave Balances</h1>
                    <p className="text-gray-600">
                        {employee?.firstName} {employee?.lastName} • {employee?.user?.email}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Add Leave Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Leave Type</CardTitle>
                        <CardDescription>Define leave balance for employee</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Custom Leave Form */}
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onAddLeaveAssignment)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="leaveType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Leave Type</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value || undefined}
                                                    disabled={leaveTypesLoading || leaveTypes.length === 0}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={leaveTypesLoading ? "Loading..." : "Select leave type"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {leaveTypes.map((lt) => (
                                                            <SelectItem key={lt.id} value={lt.id}>
                                                                {lt.name || lt.id}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="totalDays"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Days</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="20"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Leave Type
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Leave Types</CardTitle>
                        <CardDescription>
                            {leaveAssignments.length} type{leaveAssignments.length !== 1 ? "s" : ""} added
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {leaveAssignments.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">
                                    No leave types added yet. Add from templates or custom form.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {leaveAssignments.map((leave) => (
                                        <div
                                            key={leave.id}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{leave.leaveTypeName || leave.leaveType}</p>
                                                <p className="text-xs text-gray-600">{leave.totalDays} days</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLeaveAssignment(leave.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Total Days:</span>
                                        <span className="font-bold">
                                            {leaveAssignments.reduce((sum, l) => sum + l.totalDays, 0)}
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => router.back()}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={handleSaveLeaveBalances}
                                            disabled={isSubmitting || leaveAssignments.length === 0}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save Leave Balances"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
