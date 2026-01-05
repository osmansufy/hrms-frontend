"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WorkSchedule, WorkScheduleDay, WorkScheduleDayInput } from "@/lib/api/attendance";
import {
    useCreateWorkSchedule,
    useDeleteWorkSchedule,
    useUpdateWorkSchedule,
    useWorkSchedules
} from "@/lib/queries/attendance";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Clock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const DAYS_OF_WEEK = [
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" },
];

// Validation schema
const scheduleValidationSchema = z.object({
    id: z.string().optional(),
    code: z.string().min(1, "Code is required").min(2, "Code must be at least 2 characters"),
    name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    isFlexible: z.boolean(),
    isActive: z.boolean(),
});

const dayValidationSchema = z.object({
    dayOfWeek: z.string(),
    isWorking: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    breakMinutes: z.number().min(0).optional(),
    graceMinutes: z.number().min(0).optional(),
}).refine(
    (data) => {
        if (data.isWorking && (!data.startTime || !data.endTime)) {
            return false;
        }
        return true;
    },
    { message: "Working days must have start and end times" }
);

type ScheduleForm = z.infer<typeof scheduleValidationSchema>;
type DayForm = z.infer<typeof dayValidationSchema>;

const emptyForm: ScheduleForm = {
    code: "",
    name: "",
    description: "",
    isFlexible: false,
    isActive: true,
};

const defaultDays: DayForm[] = DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day.value,
    isWorking: day.value !== "SATURDAY" && day.value !== "SUNDAY",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    graceMinutes: 15,
}));

export default function WorkSchedulesPage() {
    const router = useRouter();
    const { data: schedules, isLoading } = useWorkSchedules();
    const createMutation = useCreateWorkSchedule();
    const updateMutation = useUpdateWorkSchedule();
    const deleteMutation = useDeleteWorkSchedule();

    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
    const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
    const [days, setDays] = useState<DayForm[]>(defaultDays);
    const [activeTab, setActiveTab] = useState("basic");

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<ScheduleForm>({
        resolver: zodResolver(scheduleValidationSchema),
        defaultValues: emptyForm,
    });

    const isEdit = Boolean(watch("id"));

    // Sync days with API data - use first active schedule as template for defaults
    useEffect(() => {
        if (schedules && schedules.length > 0 && !isEdit && !open) {
            const firstActiveSchedule = schedules.find((s: any) => s.isActive && s.days);
            if (firstActiveSchedule?.days && firstActiveSchedule.days.length > 0) {
                const apiDays = DAYS_OF_WEEK.map((dow) => {
                    const existingDay = firstActiveSchedule.days?.find((d: any) => d.dayOfWeek === dow.value);
                    if (existingDay) {
                        return {
                            dayOfWeek: existingDay.dayOfWeek,
                            isWorking: existingDay.isWorking,
                            startTime: existingDay.startTime || "09:00",
                            endTime: existingDay.endTime || "18:00",
                            breakMinutes: existingDay.breakMinutes || 0,
                            graceMinutes: existingDay.graceMinutes || 0,
                        };
                    }
                    return {
                        dayOfWeek: dow.value,
                        isWorking: false,
                        startTime: "09:00",
                        endTime: "18:00",
                        breakMinutes: 0,
                        graceMinutes: 0,
                    };
                });
                setDays(apiDays);
            }
        }
    }, [schedules, isEdit, open]);

    const onSubmit = async (formData: ScheduleForm) => {
        try {
            // Validate days
            const validDays = days.filter((day) => {
                if (!day.isWorking) return true;
                return day.startTime && day.endTime;
            });

            if (validDays.length === 0) {
                toast.error("Please configure at least one day");
                return;
            }

            // Check if at least one day is a working day
            const hasWorkingDay = days.some((day) => day.isWorking);
            if (!hasWorkingDay) {
                toast.error("Schedule must have at least one working day");
                return;
            }

            const daysPayload: WorkScheduleDayInput[] = days.map((day) => ({
                dayOfWeek: day.dayOfWeek,
                isWorking: day.isWorking,
                startTime: day.isWorking ? day.startTime || null : null,
                endTime: day.isWorking ? day.endTime || null : null,
                breakMinutes: day.isWorking && day.breakMinutes ? day.breakMinutes : null,
                graceMinutes: day.isWorking && day.graceMinutes ? day.graceMinutes : null,
            }));

            if (isEdit && formData.id) {
                await updateMutation.mutateAsync({
                    id: formData.id,
                    payload: {
                        code: formData.code,
                        name: formData.name,
                        description: formData.description,
                        isFlexible: formData.isFlexible,
                        isActive: formData.isActive,
                        days: daysPayload,
                    },
                });
                toast.success("Work schedule updated successfully");
            } else {
                await createMutation.mutateAsync({
                    code: formData.code,
                    name: formData.name,
                    description: formData.description,
                    isFlexible: formData.isFlexible,
                    isActive: formData.isActive,
                    days: daysPayload,
                });
                toast.success("Work schedule created successfully");
            }

            setOpen(false);
            reset(emptyForm);
            setDays(defaultDays);
            setActiveTab("basic");
        } catch (error: any) {
            toast.error(error?.message || "Failed to save work schedule");
        }
    };

    const handleEdit = (schedule: WorkSchedule) => {
        reset({
            id: schedule.id,
            code: schedule.code,
            name: schedule.name,
            description: schedule.description || "",
            isFlexible: schedule.isFlexible,
            isActive: schedule.isActive,
        });
        if (schedule.days && schedule.days.length > 0) {
            const scheduleDays = schedule.days?.map((dow) => {

                return {
                    dayOfWeek: dow.dayOfWeek,
                    isWorking: dow.isWorking,
                    startTime: dow.startTime || "09:00",
                    endTime: dow.endTime || "18:00",
                    breakMinutes: dow.breakMinutes || 0,
                    graceMinutes: dow.graceMinutes || 0,
                };
            });
            setDays(scheduleDays);
        } else {
            setDays(defaultDays);
        }

        setOpen(true);
    };

    const handleDeleteClick = (scheduleId: string) => {
        setScheduleToDelete(scheduleId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!scheduleToDelete) return;
        try {
            await deleteMutation.mutateAsync(scheduleToDelete);
            toast.success("Work schedule deleted successfully");
            setDeleteDialogOpen(false);
            setScheduleToDelete(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete work schedule");
        }
    };

    const handleDayChange = (dayIndex: number, field: keyof DayForm, value: any) => {
        if (!days) return;
        const newDays = [...days];
        newDays[dayIndex] = { ...newDays[dayIndex], [field]: value };
        setDays(newDays);
    };

    const formatTime = (time: string | null | undefined) => {
        if (!time) return "—";
        return time;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} title="Back">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Work Schedules</h1>
                    <Dialog open={open} onOpenChange={(o) => {
                        setOpen(o);
                        if (!o) {
                            reset(emptyForm);
                            setDays(defaultDays);
                            setActiveTab("basic");
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 size-4" /> New Schedule
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>{isEdit ? "Edit Work Schedule" : "Create Work Schedule"}</DialogTitle>
                                <p className="text-sm text-muted-foreground">
                                    Define working days and hours for employee schedules
                                </p>
                            </DialogHeader>

                            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                        <TabsTrigger value="days">Schedule Days</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="code">Code *</Label>
                                                <Input id="code" {...register("code")} placeholder="e.g., STD-01" />
                                                {errors.code && <p className="text-sm text-destructive mt-1">{errors.code.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="name">Name *</Label>
                                                <Input id="name" {...register("name")} placeholder="e.g., Standard 9-6" />
                                                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                {...register("description")}
                                                placeholder="Optional description of this schedule"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between border rounded-lg p-4">
                                                <div>
                                                    <Label htmlFor="isFlexible" className="font-medium">Flexible Schedule</Label>
                                                    <p className="text-xs text-muted-foreground mt-1">Allows flexible working hours</p>
                                                </div>
                                                <Controller
                                                    name="isFlexible"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Switch id="isFlexible" checked={field.value} onCheckedChange={field.onChange} />
                                                    )}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between border rounded-lg p-4">
                                                <div>
                                                    <Label htmlFor="isActive" className="font-medium">Active</Label>
                                                    <p className="text-xs text-muted-foreground mt-1">Available for assignment</p>
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

                                    <TabsContent value="days" className="flex-1 overflow-y-auto py-4">
                                        <div className="space-y-2">
                                            <div className="text-sm text-muted-foreground mb-4">
                                                Configure working hours for each day of the week. Non-working days can be toggled off.
                                            </div>
                                            {Array.isArray(days) && days.map((day, index) => {
                                                const dayLabel = DAYS_OF_WEEK.find((d) => d.value === day.dayOfWeek)?.label || day.dayOfWeek;
                                                return (
                                                    <div key={day.dayOfWeek} className="border rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <Label className="font-semibold">{dayLabel}</Label>
                                                                {day.isWorking ? (
                                                                    <Badge variant="outline" className="text-xs">Working</Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="text-xs">Off</Badge>
                                                                )}
                                                            </div>
                                                            <Switch
                                                                checked={day.isWorking}
                                                                onCheckedChange={(checked) => handleDayChange(index, "isWorking", checked)}
                                                            />
                                                        </div>

                                                        {day.isWorking && (
                                                            <div className="grid grid-cols-4 gap-3">
                                                                <div>
                                                                    <Label className="text-xs">Start Time</Label>
                                                                    <Input
                                                                        type="time"
                                                                        value={day.startTime || ""}
                                                                        onChange={(e) => handleDayChange(index, "startTime", e.target.value)}
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">End Time</Label>
                                                                    <Input
                                                                        type="time"
                                                                        value={day.endTime || ""}
                                                                        onChange={(e) => handleDayChange(index, "endTime", e.target.value)}
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Break (min)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={day.breakMinutes || 0}
                                                                        onChange={(e) => handleDayChange(index, "breakMinutes", parseInt(e.target.value) || 0)}
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs">Grace (min)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={day.graceMinutes || 0}
                                                                        onChange={(e) => handleDayChange(index, "graceMinutes", parseInt(e.target.value) || 0)}
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <DialogFooter className="mt-4">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {createMutation.isPending || updateMutation.isPending ? "Saving..." : isEdit ? "Update" : "Create"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Work Schedules</CardTitle>
                    <CardDescription>Manage employee work schedules and working hours</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
                    ) : !schedules || schedules.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No work schedules found. Create one to get started.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {schedules.map((schedule: any) => (
                                <div key={schedule.id} className="border rounded-lg">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold">{schedule.name}</h3>
                                                    <Badge variant="outline" className="text-xs">{schedule.code}</Badge>
                                                    {schedule.isActive ? (
                                                        <Badge variant="outline" className="text-xs">Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                                    )}
                                                    {schedule.isFlexible && (
                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                            Flexible
                                                        </Badge>
                                                    )}
                                                </div>
                                                {schedule.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{schedule.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    {schedule._count?.employees !== undefined && (
                                                        <div className="flex items-center gap-1">
                                                            <Users className="size-3" />
                                                            <span>{schedule._count.employees} employees</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setExpandedSchedule(expandedSchedule === schedule.id ? null : schedule.id)}
                                                >
                                                    {expandedSchedule === schedule.id ? (
                                                        <ChevronUp className="size-4" />
                                                    ) : (
                                                        <ChevronDown className="size-4" />
                                                    )}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(schedule)}>
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(schedule.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {expandedSchedule === schedule.id && schedule.days && (
                                        <div className="border-t p-4 bg-muted/30">
                                            <h4 className="text-sm font-semibold mb-3">Weekly Schedule</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {schedule.days.map((day: WorkScheduleDay) => {

                                                    return (
                                                        <div key={day.dayOfWeek} className="border rounded-lg p-3 bg-background">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-medium text-sm">{day.dayOfWeek}</span>
                                                                {day?.isWorking ? (
                                                                    <Badge variant="outline" className="text-xs">Working</Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="text-xs">Off</Badge>
                                                                )}
                                                            </div>
                                                            {day?.isWorking && (
                                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock className="size-3" />
                                                                        <span>{formatTime(day.startTime)} - {formatTime(day.endTime)}</span>
                                                                    </div>
                                                                    {(day?.breakMinutes || day?.graceMinutes) && (
                                                                        <div className="flex gap-3 ml-5">
                                                                            {(day?.breakMinutes ?? 0) > 0 && <span>Break: {day.breakMinutes}m</span>}
                                                                            {(day?.graceMinutes ?? 0) > 0 && <span>Grace: {day.graceMinutes}m</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-destructive" />
                            Delete Work Schedule
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this work schedule? This action cannot be undone.
                            {scheduleToDelete && schedules && schedules.find((s: any) => s.id === scheduleToDelete)?._count?.employees && schedules.find((s: any) => s.id === scheduleToDelete)?._count?.employees! > 0 && (
                                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                                    Warning: This schedule is assigned to employees. Please reassign them first.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setScheduleToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
