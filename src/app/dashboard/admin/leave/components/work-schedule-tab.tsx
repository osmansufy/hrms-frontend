"use client";
import { useState } from "react";
import React from "react";
import {
    useWorkSchedules,
    useCreateWorkSchedule,
    useUpdateWorkSchedule,
    useDeleteWorkSchedule,
} from "@/lib/queries/work-schedules";
import type { WorkSchedule } from "@/lib/queries/work-schedules";
import { useEmployees } from "@/lib/queries/employees";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash, ChevronDown, ChevronRight } from "lucide-react";


export function WorkScheduleTab() {
    const { data: schedules, isLoading: schedulesLoading } = useWorkSchedules();
    const { data: employees, isLoading: employeesLoading } = useEmployees();
    const createMutation = useCreateWorkSchedule();
    const updateMutation = useUpdateWorkSchedule();
    const deleteMutation = useDeleteWorkSchedule();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkSchedule | null>(null);
    type DayForm = {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isWorking: boolean;
        graceMinutes?: number;
        breakMinutes?: number;
    };
    const [form, setForm] = useState<{
        name: string;
        description?: string;
        isActive?: boolean;
        isFlexible?: boolean;
        days: DayForm[];
        graceMinutesAll?: number | "";
    }>({
        name: "",
        description: "",
        isActive: true,
        isFlexible: false,
        days: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true, graceMinutes: undefined, breakMinutes: undefined }],
        graceMinutesAll: ""
    });
    const [deleteTarget, setDeleteTarget] = useState<WorkSchedule | null>(null);

    const handleOpenAdd = () => {
        setEditTarget(null);
        setForm({ name: "", description: "", isActive: true, isFlexible: false, days: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true, graceMinutes: undefined, breakMinutes: undefined }], graceMinutesAll: "" });
        setDialogOpen(true);
    };
    const handleOpenEdit = (schedule: WorkSchedule) => {
        setEditTarget(schedule);
        setForm({
            name: schedule.name,
            description: (schedule as any).description ?? "",
            isActive: (schedule as any).isActive ?? true,
            isFlexible: (schedule as any).isFlexible ?? false,
            days: schedule.days.map(day => ({
                ...day,
                breakMinutes: (day as any).breakMinutes ?? undefined
            })),
            graceMinutesAll: ""
        });
        setDialogOpen(true);
    };
    const handleDialogClose = () => setDialogOpen(false);
    const handleDelete = (schedule: WorkSchedule) => setDeleteTarget(schedule);
    const handleDeleteConfirm = () => {
        if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        setDeleteTarget(null);
    };


    // Helper for day-wise graceMinutes update
    const handleDayGraceChange = (idx: number, value: number | "") => {
        setForm(f => ({
            ...f,
            days: f.days.map((d, i) => i === idx ? { ...d, graceMinutes: value === "" ? undefined : Number(value) } : d)
        }));
    };

    // Helper for all-days graceMinutes update
    const handleAllGraceChange = (value: number | "") => {
        setForm(f => ({
            ...f,
            graceMinutesAll: value,
            days: f.days.map(d => ({ ...d, graceMinutes: value === "" ? undefined : Number(value) }))
        }));
    };

    const handleSave = () => {
        // Remove graceMinutesAll before sending
        const { graceMinutesAll, ...payload } = form;
        if (editTarget) {
            updateMutation.mutate({ id: editTarget.id, payload });
        } else {
            createMutation.mutate(payload);
        }
        setDialogOpen(false);
    };

    // State for expanded rows
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <div className="flex items-center justify-between p-4 border-b bg-muted">
                    <h2 className="text-xl font-bold tracking-tight">Work Schedules</h2>
                    <Button onClick={handleOpenAdd} variant="default" className="gap-2"><Plus className="size-4" />Add Schedule</Button>
                </div>
                <div className="p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Buffer (min)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedulesLoading || employeesLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : !schedules || schedules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">No work schedules defined.</TableCell>
                                </TableRow>
                            ) : (
                                schedules.map(schedule => {
                                    const assignedEmployees = (employees || []).filter(emp => emp.workSchedule?.id === schedule.id);
                                    const isExpanded = expanded === schedule.id;
                                    return (
                                        <React.Fragment key={schedule.id}>
                                            <TableRow className={isExpanded ? "bg-muted/40" : ""}>
                                                <TableCell className="w-8">
                                                    <Button variant="ghost" size="icon" onClick={() => setExpanded(isExpanded ? null : schedule.id)} aria-label={isExpanded ? "Collapse" : "Expand"}>
                                                        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-semibold">{schedule.name}</TableCell>
                                                <TableCell>
                                                    {schedule.days
                                                        .filter(day => day.isWorking)
                                                        .map(day => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.dayOfWeek])
                                                        .join(", ")}
                                                </TableCell>
                                                <TableCell>
                                                    {schedule.days.length > 0
                                                        ? `${schedule.days[0].startTime} - ${schedule.days[0].endTime}`
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {schedule.days.length > 0
                                                        ? (schedule.days[0].graceMinutes ?? '-')
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(schedule)}><Edit className="size-4" /></Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule)}><Trash className="size-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                                <TableRow className="bg-muted/10">
                                                    <TableCell colSpan={6} className="p-0">
                                                        <div className="p-4">
                                                            <div className="font-semibold mb-2">Schedule Days</div>
                                                            <Table className="mb-4">
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Day</TableHead>
                                                                        <TableHead>Working</TableHead>
                                                                        <TableHead>Start</TableHead>
                                                                        <TableHead>End</TableHead>
                                                                        <TableHead>Break (min)</TableHead>
                                                                        <TableHead>Buffer (min)</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {schedule.days.map((day, idx) => (
                                                                        <TableRow key={day.dayOfWeek}>
                                                                            <TableCell>{typeof day.dayOfWeek === "number" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.dayOfWeek] : day.dayOfWeek}</TableCell>
                                                                            <TableCell>{day.isWorking ? "Yes" : "No"}</TableCell>
                                                                            <TableCell>{day.startTime}</TableCell>
                                                                            <TableCell>{day.endTime}</TableCell>
                                                                            <TableCell>{day.graceMinutes ?? "-"}</TableCell>
                                                                            <TableCell>{day.graceMinutes ?? "-"}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                            <div className="font-semibold mb-2">Employees Assigned</div>
                                                            {assignedEmployees.length === 0 ? (
                                                                <span className="text-muted-foreground">No employees assigned to this schedule.</span>
                                                            ) : (
                                                                <ul className="list-disc ml-6 space-y-1">
                                                                    {assignedEmployees.map(emp => (
                                                                        <li key={emp.id} className="text-sm">{emp.name} <span className="text-muted-foreground">({emp.email})</span></li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? "Edit Work Schedule" : "Add Work Schedule"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-8 py-2">
                        {/* General Info Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">General Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Schedule Name</label>
                                    <Input
                                        placeholder="Name"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">A unique name for this work schedule.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <Input
                                        placeholder="Description"
                                        value={form.description ?? ""}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Optional: Add details or notes for this schedule.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-8 items-center mt-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive ?? true}
                                        onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                    />
                                    <span className="text-sm">Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.isFlexible ?? false}
                                        onChange={e => setForm(f => ({ ...f, isFlexible: e.target.checked }))}
                                    />
                                    <span className="text-sm">Flexible</span>
                                </label>
                            </div>
                        </div>
                        {/* Buffer Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Buffer Time</h3>
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                <label className="text-sm font-medium min-w-45">Set Buffer (min) for all days</label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.graceMinutesAll ?? ""}
                                    onChange={e => handleAllGraceChange(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="w-32"
                                    placeholder="e.g. 15"
                                />
                                <span className="text-xs text-muted-foreground">This will apply to all days unless overridden below.</span>
                            </div>
                        </div>
                        {/* Day-wise Settings Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Day-wise Settings</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {form.days.map((day, idx) => {
                                    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                                    const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                    const dayColors = ["bg-orange-100", "bg-blue-100", "bg-green-100", "bg-yellow-100", "bg-purple-100", "bg-pink-100", "bg-gray-100"];
                                    const icon = day.isWorking ? <span className="inline-block mr-2 text-green-600" title="Working">●</span> : <span className="inline-block mr-2 text-red-500" title="Not working">●</span>;
                                    return (
                                        <Card key={idx} className={`p-4 border border-muted/60 shadow-sm flex flex-col md:flex-row md:items-center gap-4 ${dayColors[day.dayOfWeek]}`}>
                                            <div className="flex flex-col min-w-35">
                                                <div className="flex items-center gap-2">
                                                    {icon}
                                                    <span className="font-semibold text-base">{dayNamesShort[day.dayOfWeek]}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground ml-6">{dayNamesFull[day.dayOfWeek]}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 items-center">
                                                <span className="text-xs text-muted-foreground">Time:</span>
                                                <Input
                                                    type="time"
                                                    value={day.startTime || ""}
                                                    onChange={e => setForm(f => ({
                                                        ...f,
                                                        days: f.days.map((d, i) => i === idx ? { ...d, startTime: e.target.value } : d)
                                                    }))}
                                                    className="w-24"
                                                />
                                                <span>-</span>
                                                <Input
                                                    type="time"
                                                    value={day.endTime || ""}
                                                    onChange={e => setForm(f => ({
                                                        ...f,
                                                        days: f.days.map((d, i) => i === idx ? { ...d, endTime: e.target.value } : d)
                                                    }))}
                                                    className="w-24"
                                                />
                                                <span className="text-xs text-muted-foreground">Break (min):</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={day.breakMinutes ?? ""}
                                                    onChange={e => setForm(f => ({
                                                        ...f,
                                                        days: f.days.map((d, i) => i === idx ? { ...d, breakMinutes: e.target.value === "" ? undefined : Number(e.target.value) } : d)
                                                    }))}
                                                    className="w-20"
                                                />
                                                <span className="text-xs text-muted-foreground">Buffer (min):</span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={day.graceMinutes ?? ""}
                                                    onChange={e => handleDayGraceChange(idx, e.target.value === "" ? "" : Number(e.target.value))}
                                                    className="w-20"
                                                    placeholder="e.g. 10"
                                                />
                                                <span className="text-xs text-muted-foreground">(Overrides all-days value)</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                                <label className="flex items-center gap-1 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={day.isWorking}
                                                        onChange={e => setForm(f => ({
                                                            ...f,
                                                            days: f.days.map((d, i) => i === idx ? { ...d, isWorking: e.target.checked } : d)
                                                        }))}
                                                    />
                                                    <span>{day.isWorking ? "Working" : "Off"}</span>
                                                </label>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                            {editTarget ? (updateMutation.isPending ? "Saving..." : "Update") : (createMutation.isPending ? "Saving..." : "Add")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Work Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This cannot be undone.</div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
