"use client";

import React from "react";
import Link from "next/link";
import { Plus, Pencil, ArrowLeft, ChevronDown, ChevronUp, Users, ChevronRight, Trash2, AlertTriangle, Calendar, Clock, Settings, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAttendancePolicies, useCreateAttendancePolicy, useUpdateAttendancePolicy, useWorkSchedules, useUpdateWorkSchedule, useDeleteAttendancePolicy } from "@/lib/queries/attendance";
import { AttendancePolicy, WorkSchedule, WorkScheduleDay } from "@/lib/api/attendance";
import { useEmployees } from "@/lib/queries/employees";
import { useDepartments } from "@/lib/queries/departments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDateInDhaka } from "@/lib/utils";

// Zod validation schema
const policyValidationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Policy name is required").min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    effectiveFrom: z.string().min(1, "Effective date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    targetMinutes: z.number().min(0, "Target minutes must be positive"),
    delayBufferMinutes: z.number().min(0, "Delay buffer must be positive"),
    extraDelayBufferMinutes: z.number().min(0, "Extra delay buffer must be positive"),
    breakMinutes: z.number().min(0, "Break minutes must be positive"),
    ignoreOtAndDeduction: z.boolean(),
    excludeFromReports: z.boolean(),
    discardOnWeekend: z.boolean(),
    isDefault: z.boolean(),
    isActive: z.boolean(),
    workScheduleId: z.string().optional(),
}).refine(
    (data) => {
        // Convert time strings to minutes for comparison
        const [startH, startM] = data.startTime.split(":").map(Number);
        const [endH, endM] = data.endTime.split(":").map(Number);
        const startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = endH * 60 + endM;
        return startTotalMinutes < endTotalMinutes;
    },
    {
        message: "End time must be after start time",
        path: ["endTime"],
    }
);

type PolicyForm = z.infer<typeof policyValidationSchema>;

const emptyForm: PolicyForm = {
    name: "",
    description: "",
    effectiveFrom: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "18:00",
    targetMinutes: 540,
    delayBufferMinutes: 0,
    extraDelayBufferMinutes: 0,
    breakMinutes: 0,
    ignoreOtAndDeduction: false,
    excludeFromReports: false,
    discardOnWeekend: false,
    isDefault: false,
    isActive: true,
};

export default function AttendancePoliciesPage() {
    const router = useRouter();
    const { data: policies } = useAttendancePolicies();
    const { data: workSchedules } = useWorkSchedules();
    const { data: employees } = useEmployees();
    const { data: departments } = useDepartments();
    const createMutation = useCreateAttendancePolicy();
    const updateMutation = useUpdateAttendancePolicy();
    const updateScheduleMutation = useUpdateWorkSchedule();
    const deleteMutation = useDeleteAttendancePolicy();

    // React Hook Form setup
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<PolicyForm>({
        resolver: zodResolver(policyValidationSchema),
        defaultValues: emptyForm,
    });

    const [open, setOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [scheduleEditOpen, setScheduleEditOpen] = useState(false);
    const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);
    const [scheduleWarningOpen, setScheduleWarningOpen] = useState(false);
    const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
    const [editableDays, setEditableDays] = useState<WorkScheduleDay[]>([]);
    const [activeTab, setActiveTab] = useState("basic");

    const isEdit = Boolean(watch("id"));
    const selectedWorkScheduleId = watch("workScheduleId");

    const onSubmit = async (formData: PolicyForm) => {
        // Check if editing work schedule days that are shared
        if (formData.workScheduleId && editableDays.length > 0) {
            const affectedPoliciesCount = policies?.filter(
                (p: AttendancePolicy) => p.workScheduleId === formData.workScheduleId && p.id !== formData.id
            ).length || 0;

            const affectedEmployeesCount = employees?.filter(
                (emp: any) => emp.workSchedule?.id === formData.workScheduleId
            ).length || 0;

            if (affectedPoliciesCount > 0 || affectedEmployeesCount > 0) {
                // Show warning if this schedule is used by others
                setScheduleWarningOpen(true);
                return;
            }
        }

        // Proceed with save
        await proceedWithSave(formData);
    };

    const proceedWithSave = async (formData: PolicyForm) => {
        try {
            const { id: _ignore, ...payload } = formData;
            if (!payload.workScheduleId) delete payload.workScheduleId;

            // Update selected work schedule days first (if any edits exist)
            if (formData.workScheduleId && editableDays.length > 0) {
                await updateScheduleMutation.mutateAsync({
                    id: formData.workScheduleId,
                    payload: {
                        days: editableDays.map((d) => ({
                            dayOfWeek: d.dayOfWeek,
                            startTime: d.startTime ?? undefined,
                            endTime: d.endTime ?? undefined,
                            breakMinutes: d.breakMinutes ?? undefined,
                            graceMinutes: d.graceMinutes ?? undefined,
                            isWorking: d.isWorking,
                        })),
                    },
                });
            }

            if (isEdit && formData.id) {
                await updateMutation.mutateAsync({ id: formData.id, payload });
                toast.success("Policy updated");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Policy created");
            }
            setOpen(false);
            reset(emptyForm);
            setEditableDays([]);
            setActiveTab("basic");
            setScheduleWarningOpen(false);
        } catch (e: Error | unknown) {
            const message = e instanceof Error ? e.message : "Failed to save policy";
            toast.error(message);
        }
    };

    const onEdit = (policy: AttendancePolicy) => {
        reset({
            id: policy.id,
            name: policy.name,
            description: policy.description || "",
            effectiveFrom: policy.effectiveFrom.slice(0, 10),
            startTime: policy.startTime,
            endTime: policy.endTime,
            targetMinutes: policy.targetMinutes,
            delayBufferMinutes: policy.delayBufferMinutes,
            extraDelayBufferMinutes: policy.extraDelayBufferMinutes,
            breakMinutes: policy.breakMinutes,
            ignoreOtAndDeduction: policy.ignoreOtAndDeduction,
            excludeFromReports: policy.excludeFromReports,
            discardOnWeekend: policy.discardOnWeekend,
            isDefault: policy.isDefault,
            isActive: policy.isActive,
            workScheduleId: policy.workScheduleId || undefined,
        });
        setOpen(true);
        const initialDays = (policy.workSchedule?.days ?? []).map((d) => ({ ...d }));
        setEditableDays(initialDays);
    };

    const toggleDefault = async (id: string) => {
        try {
            await updateMutation.mutateAsync({ id, payload: { isDefault: true } });
            toast.success("Default policy updated");
        } catch (e: Error | unknown) {
            const message = e instanceof Error ? e.message : "Failed to set default";
            toast.error(message);
        }
    };

    const editingPolicy = policies?.find((p: AttendancePolicy) => p.id === watch("id"));
    const selectedSchedule = workSchedules?.find((ws) => ws.id === watch("workScheduleId"));
    const scheduleDaysSource = selectedSchedule?.days ?? editingPolicy?.workSchedule?.days ?? [];

    useEffect(() => {
        if (watch("workScheduleId")) {
            const next = scheduleDaysSource.map((d: any) => ({ ...d }));
            setEditableDays(next);
        } else {
            setEditableDays([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch("workScheduleId"), selectedSchedule?.id, open]);

    const updateDay = (idx: number, patch: Partial<WorkScheduleDay>) => {
        setEditableDays((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...patch } as WorkScheduleDay;
            if (patch.isWorking === false) {
                next[idx].startTime = null;
                next[idx].endTime = null;
                next[idx].breakMinutes = next[idx].breakMinutes ?? 0;
                next[idx].graceMinutes = next[idx].graceMinutes ?? 0;
            }
            return next;
        });
    };

    const handleDeleteClick = (policyId: string) => {
        setPolicyToDelete(policyId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!policyToDelete) return;
        try {
            await deleteMutation.mutateAsync(policyToDelete);
            toast.success("Policy deleted successfully");
            setDeleteConfirmOpen(false);
            setPolicyToDelete(null);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || "Failed to delete policy");
        }
    };
    const proceedWithScheduleUpdate = () => {
        setScheduleWarningOpen(false);
        // Get the current form data and proceed with save
        const formValues = watch();
        proceedWithSave(formValues as PolicyForm);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} title="Back">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Attendance Policies</h1>
                    <div className="flex gap-2">
                        <Link href="/dashboard/admin/work-schedules">
                            <Button variant="outline">
                                <Calendar className="mr-2 size-4" /> Manage Schedules
                            </Button>
                        </Link>
                        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { reset(emptyForm); setActiveTab("basic"); } }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 size-4" /> New Policy
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>{isEdit ? "Edit Policy" : "Create Policy"}</DialogTitle>
                                    <p className="text-sm text-muted-foreground">Manage attendance tracking rules and work schedules</p>
                                </DialogHeader>

                                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="basic" className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span className="hidden sm:inline">Basic Info</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="timing" className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span className="hidden sm:inline">Timing</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="advanced" className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                <span className="hidden sm:inline">Advanced</span>
                                            </TabsTrigger>
                                        </TabsList>

                                        <div className="flex-1 overflow-y-auto">
                                            {/* BASIC INFO TAB */}
                                            <TabsContent value="basic" className="space-y-4 p-4 mt-0">
                                                <div>
                                                    <Label htmlFor="name">Policy Name *</Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="e.g., Standard 9-5 Policy"
                                                        className="mt-1"
                                                        {...register("name")}
                                                    />
                                                    {errors.name && (
                                                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.name.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        rows={3}
                                                        placeholder="Add details about this policy..."
                                                        className="mt-1"
                                                        {...register("description")}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="effectiveFrom">Effective From *</Label>
                                                    <Input type="date" id="effectiveFrom" className="mt-1" {...register("effectiveFrom")} />
                                                    {errors.effectiveFrom && (
                                                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {errors.effectiveFrom.message}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="workSchedule">Work Schedule</Label>
                                                    <Controller
                                                        name="workScheduleId"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}>
                                                                <SelectTrigger id="workSchedule" className="mt-1">
                                                                    <SelectValue placeholder="Select or create schedule" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">None</SelectItem>
                                                                    {workSchedules?.map((ws: WorkSchedule) => (
                                                                        <SelectItem key={ws.id} value={ws.id}>{ws.name} ({ws.code})</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {selectedWorkScheduleId && (
                                                        <Button variant="outline" size="sm" type="button" onClick={() => setScheduleEditOpen(true)} className="mt-2 w-full">
                                                            <Calendar className="h-4 w-4 mr-2" />
                                                            Edit Work Schedule Days
                                                        </Button>
                                                    )}
                                                </div>
                                            </TabsContent>

                                            {/* TIMING TAB */}
                                            <TabsContent value="timing" className="space-y-4 p-4 mt-0">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="startTime">Start Time *</Label>
                                                        <Input id="startTime" type="time" className="mt-1" {...register("startTime")} />
                                                        {errors.startTime && (
                                                            <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                {errors.startTime.message}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="endTime">End Time *</Label>
                                                        <Input id="endTime" type="time" className="mt-1" {...register("endTime")} />
                                                        {errors.endTime && (
                                                            <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                {errors.endTime.message}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                                                    <h3 className="font-semibold text-sm">Work Duration</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="targetMinutes">Target Daily Minutes</Label>
                                                            <Input id="targetMinutes" type="number" min={0} className="mt-1" {...register("targetMinutes", { valueAsNumber: true })} />
                                                            <p className="text-xs text-muted-foreground mt-1">{Math.round(watch("targetMinutes") / 60)} hours</p>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="breakMinutes">Break Minutes</Label>
                                                            <Input id="breakMinutes" type="number" min={0} className="mt-1" {...register("breakMinutes", { valueAsNumber: true })} />
                                                            <p className="text-xs text-muted-foreground mt-1">Excluded from work hours</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-4">
                                                    <h3 className="font-semibold text-sm">Grace Periods</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="delayBuffer">Delay Buffer (minutes)</Label>
                                                            <Input id="delayBuffer" type="number" min={0} className="mt-1" {...register("delayBufferMinutes", { valueAsNumber: true })} />
                                                            <p className="text-xs text-muted-foreground mt-1">Grace before marking late</p>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="extraDelayBuffer">Extra Delay Buffer (minutes)</Label>
                                                            <Input id="extraDelayBuffer" type="number" min={0} className="mt-1" {...register("extraDelayBufferMinutes", { valueAsNumber: true })} />
                                                            <p className="text-xs text-muted-foreground mt-1">Additional threshold (e.g., half-day)</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            {/* ADVANCED TAB */}
                                            <TabsContent value="advanced" className="space-y-4 p-4 mt-0">
                                                <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <Label htmlFor="ignoreOt" className="font-medium">Ignore OT & Deduction</Label>
                                                            <p className="text-xs text-muted-foreground mt-1">Skip overtime and lost hours calculation</p>
                                                        </div>
                                                        <Controller
                                                            name="ignoreOtAndDeduction"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Switch id="ignoreOt" checked={field.value} onCheckedChange={field.onChange} />
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <Label htmlFor="excludeReports" className="font-medium">Exclude from Reports</Label>
                                                            <p className="text-xs text-muted-foreground mt-1">Hide this policy from attendance reports</p>
                                                        </div>
                                                        <Controller
                                                            name="excludeFromReports"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Switch id="excludeReports" checked={field.value} onCheckedChange={field.onChange} />
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <Label htmlFor="discardWeekend" className="font-medium">Discard Weekend</Label>
                                                            <p className="text-xs text-muted-foreground mt-1">Automatically delete weekend attendance records</p>
                                                        </div>
                                                        <Controller
                                                            name="discardOnWeekend"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Switch id="discardWeekend" checked={field.value} onCheckedChange={field.onChange} />
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <Label htmlFor="isDefault" className="font-medium">Set as Default</Label>
                                                            <p className="text-xs text-muted-foreground mt-1">Apply to all users without specific assignment</p>
                                                        </div>
                                                        <Controller
                                                            name="isDefault"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Switch id="isDefault" checked={field.value} onCheckedChange={field.onChange} />
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3 border rounded-lg p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <Label htmlFor="isActive" className="font-medium">Active</Label>
                                                            <p className="text-xs text-muted-foreground mt-1">Enable or disable this policy</p>
                                                        </div>
                                                        <Controller
                                                            name="isActive"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </Tabs>

                                    <DialogFooter className="border-t pt-4">
                                        <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(emptyForm); setActiveTab("basic"); }}>Cancel</Button>
                                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || updateScheduleMutation.isPending}>
                                            {isEdit ? "Update Policy" : "Create Policy"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Policies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden sm:table-cell">Work Schedule</TableHead>
                                    <TableHead className="hidden md:table-cell">Effective From</TableHead>
                                    <TableHead className="hidden md:table-cell">Time</TableHead>
                                    <TableHead className="hidden lg:table-cell">Target</TableHead>
                                    <TableHead className="hidden lg:table-cell">Buffers</TableHead>
                                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                                    <TableHead className="text-right w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {policies?.map((p: AttendancePolicy) => {
                                    // Get employees assigned to this policy directly
                                    const policyAssignedEmployees = employees?.filter((emp: any) => emp.attendancePolicy?.id === p.id) || [];
                                    // Get employees connected through the work schedule
                                    const workScheduleEmployees = p.workScheduleId
                                        ? employees?.filter((emp: any) => emp.workSchedule?.id === p.workScheduleId) || []
                                        : [];
                                    // Combine and deduplicate
                                    const assignedEmployees = [...new Map(
                                        [...policyAssignedEmployees, ...workScheduleEmployees].map(emp => [emp.id, emp])
                                    ).values()];
                                    const isExpanded = expandedPolicy === p.id;
                                    return (
                                        <React.Fragment key={p.id}>
                                            <TableRow className={isExpanded ? "bg-muted/40" : ""}>
                                                <TableCell className="w-12">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setExpandedPolicy(isExpanded ? null : p.id)}
                                                        aria-label={isExpanded ? "Collapse" : "Expand"}
                                                        className="h-8 w-8"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{p.name}</span>
                                                        <div className="sm:hidden space-y-1 mt-1">
                                                            <p className="text-xs text-muted-foreground">
                                                                {p.startTime} - {p.endTime}
                                                            </p>
                                                            <div className="flex gap-1">
                                                                {p.isDefault && <Badge variant="default" className="text-xs">Default</Badge>}
                                                                {p.isActive ? <Badge variant="outline" className="text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                                                            </div>
                                                        </div>
                                                        {p.description && <span className="text-xs text-muted-foreground">{p.description}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {p.workSchedule ? (
                                                        <Badge variant="outline" className="text-xs">{p.workSchedule.name}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-sm">
                                                    {formatDateInDhaka(p.effectiveFrom, "long")}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-sm">
                                                    {p.startTime} - {p.endTime}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-sm">
                                                    {Math.round(p.targetMinutes / 60)}h
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-xs">
                                                    {p.delayBufferMinutes > 0 || p.extraDelayBufferMinutes > 0 ? (
                                                        <span>{p.delayBufferMinutes}m + {p.extraDelayBufferMinutes}m</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {p.isDefault && <Badge variant="default" className="text-xs">Default</Badge>}
                                                        {p.isActive ? <Badge variant="outline" className="text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-1 justify-end flex-wrap">
                                                        <Button size="sm" variant="ghost" onClick={() => onEdit(p)} className="h-8 w-8 p-0">
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        {!p.isDefault && (
                                                            <>
                                                                <Button size="sm" variant="outline" onClick={() => toggleDefault(p.id)} disabled={updateMutation.isPending} className="h-8 hidden sm:inline-flex text-xs px-2">
                                                                    Set Default
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleDeleteClick(p.id)}
                                                                    disabled={deleteMutation.isPending}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                                <TableRow className="bg-muted/10">
                                                    <TableCell colSpan={9}>
                                                        <div className="p-4 space-y-4">
                                                            <div className="space-y-3">
                                                                <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                                                                    <span>Connected Employees</span>
                                                                    <Badge variant="secondary" className="font-bold">{assignedEmployees.length}</Badge>
                                                                    {policyAssignedEmployees.length > 0 && (
                                                                        <Badge variant="default" className="text-xs">
                                                                            {policyAssignedEmployees.length} via Policy
                                                                        </Badge>
                                                                    )}
                                                                    {workScheduleEmployees.length > 0 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {workScheduleEmployees.length} via Work Schedule
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {assignedEmployees.length === 0 ? (
                                                                    <div className="text-muted-foreground text-sm py-4 px-3 text-center border rounded-md bg-muted/30">
                                                                        No employees connected to this policy or work schedule
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {/* Quick preview of assigned employees */}
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                            {assignedEmployees.slice(0, 6).map((emp: any) => {
                                                                                const isPolicyAssigned = policyAssignedEmployees.some(e => e.id === emp.id);
                                                                                const isWorkScheduleAssigned = workScheduleEmployees.some(e => e.id === emp.id);
                                                                                return (
                                                                                    <div key={emp.id} className="border rounded-lg p-3 bg-white dark:bg-slate-950 hover:bg-muted/50 transition-colors relative">
                                                                                        <div className="text-sm font-medium">{emp.name}</div>
                                                                                        <div className="text-xs text-muted-foreground">{emp.employeeCode}</div>
                                                                                        {emp.jobTitle && <div className="text-xs text-muted-foreground mt-1">{emp.jobTitle}</div>}
                                                                                        <div className="flex gap-1 mt-2">
                                                                                            {isPolicyAssigned && (
                                                                                                <Badge variant="default" className="text-[10px] px-1 py-0">Policy</Badge>
                                                                                            )}
                                                                                            {isWorkScheduleAssigned && (
                                                                                                <Badge variant="outline" className="text-[10px] px-1 py-0">Schedule</Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        {assignedEmployees.length > 6 && (
                                                                            <div className="text-xs text-muted-foreground py-2 px-3 border rounded-md bg-muted/30">
                                                                                +{assignedEmployees.length - 6} more employees
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {assignedEmployees.length > 0 && (
                                                                <div className="border-t pt-4">
                                                                    <div className="text-sm font-semibold mb-3">Detailed List</div>
                                                                    <div className="border rounded-md overflow-x-auto">
                                                                        <Table className="text-sm">
                                                                            <TableHeader>
                                                                                <TableRow className="bg-muted/50">
                                                                                    <TableHead className="text-xs">Employee Code</TableHead>
                                                                                    <TableHead className="text-xs">Full Name</TableHead>
                                                                                    <TableHead className="text-xs">Connection</TableHead>
                                                                                    <TableHead className="hidden sm:table-cell text-xs">Email</TableHead>
                                                                                    <TableHead className="hidden md:table-cell text-xs">Department</TableHead>
                                                                                    <TableHead className="hidden lg:table-cell text-xs">Work Schedule</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {assignedEmployees.map((emp: any) => {
                                                                                    const isPolicyAssigned = policyAssignedEmployees.some(e => e.id === emp.id);
                                                                                    const isWorkScheduleAssigned = workScheduleEmployees.some(e => e.id === emp.id);
                                                                                    return (
                                                                                        <TableRow key={emp.id} className="hover:bg-muted/30">
                                                                                            <TableCell className="font-mono text-xs">{emp.employeeCode}</TableCell>
                                                                                            <TableCell>
                                                                                                <div className="flex flex-col gap-0.5">
                                                                                                    <span className="font-medium text-sm">{emp.name}</span>
                                                                                                    <span className="text-xs text-muted-foreground">{emp.jobTitle || '—'}</span>
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell>
                                                                                                <div className="flex flex-col gap-1">
                                                                                                    {isPolicyAssigned && (
                                                                                                        <Badge variant="default" className="text-[10px] px-1.5 py-0 w-fit">Policy</Badge>
                                                                                                    )}
                                                                                                    {isWorkScheduleAssigned && (
                                                                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 w-fit">Schedule</Badge>
                                                                                                    )}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{emp.email}</TableCell>
                                                                                            <TableCell className="hidden md:table-cell">
                                                                                                {emp.department ? (
                                                                                                    <Badge variant="outline" className="text-xs">{emp.department}</Badge>
                                                                                                ) : (
                                                                                                    <span className="text-muted-foreground text-xs">—</span>
                                                                                                )}
                                                                                            </TableCell>
                                                                                            <TableCell className="hidden lg:table-cell">
                                                                                                {emp.workSchedule ? (
                                                                                                    <Badge variant="secondary" className="text-xs">{emp.workSchedule.name}</Badge>
                                                                                                ) : (
                                                                                                    <span className="text-muted-foreground text-xs">—</span>
                                                                                                )}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    );
                                                                                })}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {policies?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">No policies</TableCell>
                                    </TableRow>
                                )}

                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Work Schedule Impact Warning Dialog */}
            <Dialog open={scheduleWarningOpen} onOpenChange={setScheduleWarningOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <span>Work Schedule Impact Warning</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-muted-foreground">
                            You are about to modify a work schedule that is shared by other policies and employees.
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 space-y-2">
                            <p className="text-sm font-medium">This will affect:</p>
                            <ul className="text-sm space-y-1 ml-4 list-disc">
                                <li>
                                    {policies?.filter((p: AttendancePolicy) => p.workScheduleId === watch("workScheduleId") && p.id !== watch("id")).length || 0} other attendance {policies?.filter((p: AttendancePolicy) => p.workScheduleId === watch("workScheduleId") && p.id !== watch("id")).length === 1 ? 'policy' : 'policies'}
                                </li>
                                <li>
                                    {employees?.filter((emp: any) => emp.workSchedule?.id === watch("workScheduleId")).length || 0} {employees?.filter((emp: any) => emp.workSchedule?.id === watch("workScheduleId")).length === 1 ? 'employee' : 'employees'}
                                </li>
                            </ul>
                        </div>
                        <p className="text-sm">
                            Are you sure you want to continue? This will update the work schedule for all affected policies and employees.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduleWarningOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={proceedWithScheduleUpdate} disabled={createMutation.isPending || updateMutation.isPending || updateScheduleMutation.isPending}>
                            Proceed with Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Attendance Policy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete this attendance policy? This action cannot be undone.
                        </p>
                        {policyToDelete && (() => {
                            const policy = policies?.find((p: AttendancePolicy) => p.id === policyToDelete);
                            const assignmentCount = employees?.filter((emp: any) => emp.attendancePolicy?.id === policyToDelete).length || 0;
                            return (
                                <div className="bg-muted rounded-md p-3 space-y-2">
                                    <p className="text-sm font-medium">{policy?.name}</p>
                                    {assignmentCount > 0 && (
                                        <p className="text-sm text-yellow-600 dark:text-yellow-500">
                                            Note: This policy has {assignmentCount} active {assignmentCount === 1 ? 'assignment' : 'assignments'}.
                                            You must remove these assignments before deletion.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Policy"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Work Schedule Day Editing Dialog */}
            <Dialog open={scheduleEditOpen} onOpenChange={setScheduleEditOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Work Schedule Days</DialogTitle>
                        <p className="text-sm text-muted-foreground">Configure working hours and breaks for each day</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 p-4">
                        {editableDays.length > 0 ? (
                            editableDays.map((day, idx) => (
                                <div key={day.id ?? day.dayOfWeek} className={`border rounded-lg p-4 space-y-3 ${day.isWorking ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-muted/50'}`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">{day.dayOfWeek}</h3>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`working-${idx}`} className="text-sm">Working Day</Label>
                                            <Switch
                                                id={`working-${idx}`}
                                                checked={Boolean(day.isWorking)}
                                                onCheckedChange={(v) => updateDay(idx, { isWorking: v })}
                                            />
                                        </div>
                                    </div>

                                    {day.isWorking && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor={`start-${idx}`} className="text-sm">Start Time</Label>
                                                    <Input
                                                        id={`start-${idx}`}
                                                        type="time"
                                                        value={day.startTime ?? ""}
                                                        onChange={(e) => updateDay(idx, { startTime: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`end-${idx}`} className="text-sm">End Time</Label>
                                                    <Input
                                                        id={`end-${idx}`}
                                                        type="time"
                                                        value={day.endTime ?? ""}
                                                        onChange={(e) => updateDay(idx, { endTime: e.target.value })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor={`break-${idx}`} className="text-sm">Break (minutes)</Label>
                                                    <Input
                                                        id={`break-${idx}`}
                                                        type="number"
                                                        value={day.breakMinutes ?? 0}
                                                        onChange={(e) => updateDay(idx, { breakMinutes: Number(e.target.value) })}
                                                        min={0}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`grace-${idx}`} className="text-sm">Grace Period (minutes)</Label>
                                                    <Input
                                                        id={`grace-${idx}`}
                                                        type="number"
                                                        value={day.graceMinutes ?? 0}
                                                        onChange={(e) => updateDay(idx, { graceMinutes: Number(e.target.value) })}
                                                        min={0}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No schedule days found
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={() => setScheduleEditOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
