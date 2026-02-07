"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
    adminCreateBreak,
    adminUpdateBreak,
    BreakType,
    getBreakTypeLabel,
    getBreakTypeIcon,
    type AttendanceBreakWithUser,
} from "@/lib/api/attendance";
import { listEmployees } from "@/lib/api/employees";
import { getAttendanceRecords } from "@/lib/api/attendance";

interface BreakDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    breakData?: AttendanceBreakWithUser;
}

interface BreakFormData {
    userId: string;
    attendanceId: string;
    startTime: string;
    endTime?: string;
    breakType: BreakType;
    location?: string;
    reason?: string;
}

// Helper function to format ISO DateTime to datetime-local input format
function formatToDatetimeLocal(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper function to format date only
function formatDateOnly(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Helper function to format display date
function formatDisplayDate(date: Date): string {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

// Helper function to format display time
function formatDisplayTime(date: Date): string {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
}

export function BreakDialog({
    open,
    onOpenChange,
    mode,
    breakData,
}: BreakDialogProps) {
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );

    const form = useForm<BreakFormData>({
        defaultValues: {
            userId: "",
            attendanceId: "",
            startTime: "",
            endTime: "",
            breakType: BreakType.LUNCH,
            location: "",
            reason: "",
        },
    });

    // Fetch employees
    const { data: employeesResponse } = useQuery({
        queryKey: ["employees"],
        queryFn: () => listEmployees({}),
    });

    const employees = employeesResponse || [];

    // Fetch attendance records for selected employee
    const { data: attendanceRecords } = useQuery({
        queryKey: ["attendance-records", selectedUserId, selectedDate],
        queryFn: () =>
            getAttendanceRecords({
                userId: selectedUserId,
                startDate: selectedDate,
                endDate: selectedDate,
            }),
        enabled: Boolean(selectedUserId && selectedDate),
    });

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (open && mode === "create") {
            form.reset({
                userId: "",
                attendanceId: "",
                startTime: "",
                endTime: "",
                breakType: BreakType.LUNCH,
                location: "",
                reason: "",
            });
            setSelectedUserId("");
            setSelectedDate(new Date().toISOString().split("T")[0]);
        } else if (open && mode === "edit" && breakData) {
            const startDate = new Date(breakData.startTime);
            const endDate = breakData.endTime ? new Date(breakData.endTime) : null;

            form.reset({
                userId: breakData.userId,
                attendanceId: breakData.attendanceId,
                startTime: formatToDatetimeLocal(breakData.startTime),
                endTime: endDate && breakData.endTime ? formatToDatetimeLocal(breakData.endTime) : "",
                breakType: breakData.breakType,
                location: breakData.notes || "",
                reason: breakData.notes || "",
            });
            setSelectedUserId(breakData.userId);
            setSelectedDate(formatDateOnly(breakData.startTime));
        }
    }, [open, mode, breakData, form]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: adminCreateBreak,
        onSuccess: () => {
            toast.success("Break created successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-breaks"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || "Failed to create break"
            );
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            adminUpdateBreak(id, data),
        onSuccess: () => {
            toast.success("Break updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-breaks"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message || "Failed to update break"
            );
        },
    });

    const onSubmit = (data: BreakFormData) => {
        if (mode === "create") {
            createMutation.mutate({
                userId: data.userId,
                attendanceId: data.attendanceId,
                startTime: new Date(data.startTime).toISOString(),
                endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
                breakType: data.breakType,
                location: data.location,
                reason: data.reason,
            });
        } else if (mode === "edit" && breakData) {
            updateMutation.mutate({
                id: breakData.id,
                data: {
                    startTime: new Date(data.startTime).toISOString(),
                    endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
                    breakType: data.breakType,
                    location: data.location,
                    reason: data.reason,
                },
            });
        }
    };

    const handleUserChange = (userId: string) => {
        setSelectedUserId(userId);
        form.setValue("userId", userId);
        form.setValue("attendanceId", ""); // Reset attendance when user changes
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        form.setValue("attendanceId", ""); // Reset attendance when date changes
    };

    const isLoading =
        createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Create New Break" : "Edit Break"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Manually create a break record for an employee."
                            : "Update the break record details."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {mode === "create" && (
                            <>
                                {/* Employee Selection */}
                                <FormField
                                    control={form.control}
                                    name="userId"
                                    rules={{ required: "Employee is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Employee *</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleUserChange(value);
                                                }}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select an employee" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {employees.map((emp: any) => (
                                                        <SelectItem key={emp.userId} value={emp.userId || ""}>
                                                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                                                            {emp.department && ` - ${emp.department.name}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Date Selection */}
                                <div>
                                    <FormLabel>Date *</FormLabel>
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        max={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                    />
                                </div>

                                {/* Attendance Record Selection */}
                                <FormField
                                    control={form.control}
                                    name="attendanceId"
                                    rules={{ required: "Attendance record is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Attendance Record *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!selectedUserId || !attendanceRecords?.data}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select attendance record" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {attendanceRecords?.data?.map((record) => {
                                                        const recordDate = new Date(record.date);
                                                        const signInTime = record.signIn
                                                            ? new Date(record.signIn)
                                                            : null;
                                                        return (
                                                            <SelectItem key={record.id} value={record.id}>
                                                                {formatDisplayDate(recordDate)} -{" "}
                                                                {signInTime
                                                                    ? formatDisplayTime(signInTime)
                                                                    : "Not signed in"}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                    {attendanceRecords?.data?.length === 0 && (
                                                        <SelectItem value="none" disabled>
                                                            No attendance record found for this date
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Employee must have an attendance record for the selected
                                                date
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Break Type */}
                        <FormField
                            control={form.control}
                            name="breakType"
                            rules={{ required: "Break type is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Break Type *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select break type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(BreakType).map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {getBreakTypeIcon(type)} {getBreakTypeLabel(type)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Start Time */}
                        <FormField
                            control={form.control}
                            name="startTime"
                            rules={{ required: "Start time is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Time *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                            max={new Date().toISOString().slice(0, 16)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        When the break started (must be within attendance sign-in and
                                        sign-out times)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* End Time */}
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                            max={new Date().toISOString().slice(0, 16)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        When the break ended (leave empty for active break)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Location */}
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Break location (optional)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Reason/Notes */}
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason/Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional notes or reason for the break (optional)"
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading
                                    ? "Saving..."
                                    : mode === "create"
                                        ? "Create Break"
                                        : "Update Break"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
