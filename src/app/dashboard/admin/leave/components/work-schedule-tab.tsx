"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash } from "lucide-react";

// Dummy data and types for demonstration. Replace with API integration.
type WorkSchedule = {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    days: string;
};

const initialSchedules: WorkSchedule[] = [
    { id: 1, name: "General", startTime: "09:00", endTime: "18:00", days: "Mon-Fri" },
];

export function WorkScheduleTab() {
    const [schedules, setSchedules] = useState<WorkSchedule[]>(initialSchedules);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<WorkSchedule | null>(null);
    const [form, setForm] = useState({ name: "", startTime: "", endTime: "", days: "" });

    const handleOpen = (schedule: WorkSchedule | null) => {
        setEditing(schedule);
        setForm(schedule ? { ...schedule } : { name: "", startTime: "", endTime: "", days: "" });
        setIsDialogOpen(true);
    };
    const handleClose = () => setIsDialogOpen(false);
    const handleSave = () => {
        if (editing) {
            setSchedules(schedules.map(s => (s.id === editing.id ? { ...editing, ...form } : s)));
        } else {
            setSchedules([...schedules, { ...form, id: Date.now() } as WorkSchedule]);
        }
        setIsDialogOpen(false);
    };
    const handleDelete = (id: number) => setSchedules(schedules.filter(s => s.id !== id));

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Work Schedules</h2>
                    <Button onClick={() => handleOpen(null)}><Plus className="mr-2 size-4" />Add Schedule</Button>
                </div>
                <div className="p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>End Time</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No work schedules defined.</TableCell>
                                </TableRow>
                            ) : (
                                schedules.map(schedule => (
                                    <TableRow key={schedule.id}>
                                        <TableCell>{schedule.name}</TableCell>
                                        <TableCell>{schedule.startTime}</TableCell>
                                        <TableCell>{schedule.endTime}</TableCell>
                                        <TableCell>{schedule.days}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpen(schedule)}><Edit className="size-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}><Trash className="size-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Work Schedule" : "Add Work Schedule"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Input
                            placeholder="Name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <Input
                            type="time"
                            placeholder="Start Time"
                            value={form.startTime}
                            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                        />
                        <Input
                            type="time"
                            placeholder="End Time"
                            value={form.endTime}
                            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                        />
                        <Input
                            placeholder="Days (e.g. Mon-Fri)"
                            value={form.days}
                            onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSave}>{editing ? "Update" : "Add"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
