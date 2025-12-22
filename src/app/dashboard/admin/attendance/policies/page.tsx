"use client";

import { Plus, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useAttendancePolicies, useCreateAttendancePolicy, useUpdateAttendancePolicy, useWorkSchedules, useUpdateWorkSchedule } from "@/lib/queries/attendance";
import { AttendancePolicy, WorkSchedule, WorkScheduleDay } from "@/lib/api/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PolicyForm = {
    id?: string;
    name: string;
    description?: string;
    effectiveFrom: string;
    startTime: string;
    endTime: string;
    targetMinutes: number;
    delayBufferMinutes: number;
    extraDelayBufferMinutes: number;
    breakMinutes: number;
    ignoreOtAndDeduction: boolean;
    excludeFromReports: boolean;
    discardOnWeekend: boolean;
    isDefault: boolean;
    isActive: boolean;
    workScheduleId?: string;
};

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
    const { data: policies } = useAttendancePolicies();
    const { data: workSchedules } = useWorkSchedules();
    const createMutation = useCreateAttendancePolicy();
    const updateMutation = useUpdateAttendancePolicy();
    const updateScheduleMutation = useUpdateWorkSchedule();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<PolicyForm>(emptyForm);
    const [editableDays, setEditableDays] = useState<WorkScheduleDay[]>([]);

    const isEdit = Boolean(form.id);

    const onSubmit = async () => {
        try {
            if (!form.name) throw new Error("Name is required");
            const { id: _ignore, ...payload } = form;
            if (!payload.workScheduleId) delete payload.workScheduleId;
            // Update selected work schedule days first (if any edits exist)
            if (form.workScheduleId && editableDays.length > 0) {
                await updateScheduleMutation.mutateAsync({
                    id: form.workScheduleId,
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
            if (isEdit && form.id) {
                await updateMutation.mutateAsync({ id: form.id, payload });
                toast.success("Policy updated");
            } else {
                await createMutation.mutateAsync(payload);
                toast.success("Policy created");
            }
            setOpen(false);
            setForm(emptyForm);
            setEditableDays([]);
        } catch (e: Error | unknown) {
            const message = e instanceof Error ? e.message : "Failed to save policy";
            toast.error(message);
        }
    };

    const onEdit = (policy: AttendancePolicy) => {
        setForm({
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

    const selectedPolicy = policies?.find((p: AttendancePolicy) => p.id === form.id);
    const selectedSchedule = workSchedules?.find((ws) => ws.id === form.workScheduleId);
    const scheduleDaysSource = selectedSchedule?.days ?? selectedPolicy?.workSchedule?.days ?? [];

    useEffect(() => {
        if (form.workScheduleId) {
            const next = scheduleDaysSource.map((d) => ({ ...d }));
            setEditableDays(next);
        } else {
            setEditableDays([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.workScheduleId, selectedSchedule?.id, open]);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Attendance Policies</h1>
                <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(emptyForm); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" /> New Policy
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isEdit ? "Edit Policy" : "Create Policy"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <Label>Name *</Label>
                                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <Label>Description</Label>
                                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                                </div>
                                <div>
                                    <Label>Effective From *</Label>
                                    <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Work Schedule</Label>
                                    <Select value={form.workScheduleId || "none"} onValueChange={(v) => setForm({ ...form, workScheduleId: v === "none" ? undefined : v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select schedule" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {workSchedules?.map((ws: WorkSchedule) => (
                                                <SelectItem key={ws.id} value={ws.id}>{ws.name} ({ws.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Start Time (HH:mm) *</Label>
                                    <Input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} placeholder="09:00" />
                                </div>
                                <div>
                                    <Label>End Time (HH:mm) *</Label>
                                    <Input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} placeholder="18:00" />
                                </div>
                                <div>
                                    <Label>Target Minutes *</Label>
                                    <Input type="number" value={form.targetMinutes} onChange={(e) => setForm({ ...form, targetMinutes: Number(e.target.value) })} />
                                    <p className="text-xs text-muted-foreground mt-1">{Math.round(form.targetMinutes / 60)} hours</p>
                                </div>
                                <div>
                                    <Label>Break Minutes</Label>
                                    <Input type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <Label>Delay Buffer (min)</Label>
                                    <Input type="number" value={form.delayBufferMinutes} onChange={(e) => setForm({ ...form, delayBufferMinutes: Number(e.target.value) })} />
                                    <p className="text-xs text-muted-foreground mt-1">Grace period before marking late</p>
                                </div>
                                <div>
                                    <Label>Extra Delay Buffer (min)</Label>
                                    <Input type="number" value={form.extraDelayBufferMinutes} onChange={(e) => setForm({ ...form, extraDelayBufferMinutes: Number(e.target.value) })} />
                                    <p className="text-xs text-muted-foreground mt-1">Additional threshold (e.g., half-day)</p>
                                </div>
                            </div>

                            <div className="space-y-3 border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Ignore OT and Deduction</Label>
                                        <p className="text-xs text-muted-foreground">Skip overtime/lost hours calculation</p>
                                    </div>
                                    <Switch checked={form.ignoreOtAndDeduction} onCheckedChange={(v) => setForm({ ...form, ignoreOtAndDeduction: v })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Exclude from Reports</Label>
                                        <p className="text-xs text-muted-foreground">Hide from attendance reports</p>
                                    </div>
                                    <Switch checked={form.excludeFromReports} onCheckedChange={(v) => setForm({ ...form, excludeFromReports: v })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Discard on Weekend</Label>
                                        <p className="text-xs text-muted-foreground">Auto-delete weekend attendance</p>
                                    </div>
                                    <Switch checked={form.discardOnWeekend} onCheckedChange={(v) => setForm({ ...form, discardOnWeekend: v })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Set as Default</Label>
                                        <p className="text-xs text-muted-foreground">Apply to all unassigned users</p>
                                    </div>
                                    <Switch checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Active</Label>
                                        <p className="text-xs text-muted-foreground">Enable this policy</p>
                                    </div>
                                    <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                                </div>
                            </div>

                            {/* Work Schedule Days */}
                            {form.workScheduleId && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-3">Working Schedule</h3>
                                    <div className="overflow-x-auto">
                                        <Table className="text-sm">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-24">Day</TableHead>
                                                    <TableHead className="w-24">Working Hours</TableHead>
                                                    <TableHead className="w-24">Delay Buffer (min)</TableHead>
                                                    <TableHead className="w-24">Break (min)</TableHead>
                                                    <TableHead className="w-24">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {editableDays.length > 0 ? (
                                                    editableDays.map((day, idx) => (
                                                        <TableRow key={day.id ?? day.dayOfWeek}>
                                                            <TableCell className="font-medium">{day.dayOfWeek}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        type="time"
                                                                        value={day.startTime ?? ""}
                                                                        onChange={(e) => updateDay(idx, { startTime: e.target.value })}
                                                                        disabled={!day.isWorking}
                                                                        className="w-28"
                                                                    />
                                                                    <span>-</span>
                                                                    <Input
                                                                        type="time"
                                                                        value={day.endTime ?? ""}
                                                                        onChange={(e) => updateDay(idx, { endTime: e.target.value })}
                                                                        disabled={!day.isWorking}
                                                                        className="w-28"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    value={day.graceMinutes ?? 0}
                                                                    onChange={(e) => updateDay(idx, { graceMinutes: Number(e.target.value) })}
                                                                    className="w-28"
                                                                    min={0}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    value={day.breakMinutes ?? 0}
                                                                    onChange={(e) => updateDay(idx, { breakMinutes: Number(e.target.value) })}
                                                                    className="w-28"
                                                                    min={0}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={Boolean(day.isWorking)}
                                                                        onCheckedChange={(v) => updateDay(idx, { isWorking: v })}
                                                                    />
                                                                    {day.isWorking ? (
                                                                        <Badge variant="outline" className="bg-blue-50">Working</Badge>
                                                                    ) : (
                                                                        <Badge variant="secondary">Weekend</Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                                                            No schedule days found
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setOpen(false); setForm(emptyForm); }}>Cancel</Button>
                            <Button onClick={onSubmit} disabled={createMutation.isPending || updateMutation.isPending || updateScheduleMutation.isPending}>
                                {isEdit ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Policies</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Work Schedule</TableHead>
                                <TableHead>Effective From</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Buffers</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {policies?.map((p: AttendancePolicy) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{p.name}</span>
                                            {p.description && <span className="text-xs text-muted-foreground">{p.description}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {p.workSchedule ? (
                                            <Badge variant="outline">{p.workSchedule.name}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(p.effectiveFrom).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-sm">
                                        {p.startTime} - {p.endTime}
                                    </TableCell>
                                    <TableCell>{Math.round(p.targetMinutes / 60)}h</TableCell>
                                    <TableCell className="text-sm">
                                        {p.delayBufferMinutes > 0 || p.extraDelayBufferMinutes > 0 ? (
                                            <span>{p.delayBufferMinutes}m + {p.extraDelayBufferMinutes}m</span>
                                        ) : (
                                            <span className="text-muted-foreground">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {p.isDefault && <Badge variant="default">Default</Badge>}
                                            {p.isActive ? <Badge variant="outline">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                            {!p.isDefault && (
                                                <Button size="sm" variant="outline" onClick={() => toggleDefault(p.id)} disabled={updateMutation.isPending}>
                                                    Set Default
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {policies?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">No policies</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
