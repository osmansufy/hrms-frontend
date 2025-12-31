import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useWorkSchedules } from "@/lib/queries/work-schedules";
import { useUpdateEmployee } from "@/lib/queries/employees";
import { toast } from "sonner";

export function ChangeWorkScheduleDialog({ employeeId, currentScheduleId }: { employeeId: string; currentScheduleId?: string | null }) {
    const [open, setOpen] = useState(false);
    const { data: schedules = [], isLoading } = useWorkSchedules();
    const updateEmployee = useUpdateEmployee(employeeId);
    const [selected, setSelected] = useState<string | undefined>(currentScheduleId || undefined);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await updateEmployee.mutateAsync({ workScheduleId: selected });
            toast.success("Work schedule updated");
            setOpen(false);
        } catch (e: any) {
            toast.error(e?.message || "Failed to update work schedule");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                Change Work Schedule
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Work Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Select value={selected} onValueChange={setSelected} disabled={isLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select work schedule" />
                        </SelectTrigger>
                        <SelectContent>
                            {schedules.map((ws) => (
                                <SelectItem key={ws.id} value={ws.id}>
                                    {ws.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={!selected || saving}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
