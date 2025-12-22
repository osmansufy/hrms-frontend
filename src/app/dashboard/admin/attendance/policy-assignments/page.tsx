"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAttendancePolicies, useCreatePolicyAssignment, usePolicyAssignments } from "@/lib/queries/attendance";
import { useDepartments } from "@/lib/queries/departments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function PolicyAssignmentsPage() {
    const { data: policies } = useAttendancePolicies({ isActive: true });
    const { data: assignments } = usePolicyAssignments();
    const { data: departments } = useDepartments();
    const createMutation = useCreatePolicyAssignment();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<any>({ policyId: "", departmentId: "", effectiveFrom: new Date().toISOString().slice(0, 10) });

    const onCreate = async () => {
        try {
            if (!form.policyId) throw new Error("Policy is required");
            if (!form.departmentId) throw new Error("Department is required");
            await createMutation.mutateAsync({
                policyId: form.policyId,
                departmentId: form.departmentId,
                effectiveFrom: form.effectiveFrom,
            });
            setOpen(false);
            toast.success("Assignment created");
        } catch (e: any) {
            toast.error(e?.message || "Failed to create assignment");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Policy Assignments</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 size-4" />New Assignment</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Assignment</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 py-2">
                            <div>
                                <Label>Policy</Label>
                                <Select value={form.policyId} onValueChange={(v) => setForm({ ...form, policyId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                                    <SelectContent>
                                        {policies?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Department</Label>
                                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                    <SelectContent>
                                        {departments?.map((d: any) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Effective From</Label>
                                <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={onCreate} disabled={createMutation.isPending}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Policy</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Effective From</TableHead>
                                <TableHead>Effective To</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments?.map((a: any) => (
                                <TableRow key={a.id}>
                                    <TableCell>{a.policy?.name}</TableCell>
                                    <TableCell>{a.user?.name || a.userId || "—"}</TableCell>
                                    <TableCell>{a.department?.name || a.departmentId || "—"}</TableCell>
                                    <TableCell>{new Date(a.effectiveFrom).toLocaleDateString()}</TableCell>
                                    <TableCell>{a.effectiveTo ? new Date(a.effectiveTo).toLocaleDateString() : "—"}</TableCell>
                                </TableRow>
                            ))}
                            {assignments?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No assignments</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
