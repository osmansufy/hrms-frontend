"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash, Tag } from "lucide-react";
import { useNoticeRules, useAddNoticeRule, useUpdateNoticeRule, useDeleteNoticeRule, useLeaveTypes } from "@/lib/queries/leave";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { NoticeRuleWithPolicy } from "@/lib/api/leave";

export function NoticeRulesTab() {
    const { data: rules, isLoading } = useNoticeRules();
    const { data: leaveTypes } = useLeaveTypes();
    const addRuleMutation = useAddNoticeRule();
    const updateRuleMutation = useUpdateNoticeRule();
    const deleteRuleMutation = useDeleteNoticeRule();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<NoticeRuleWithPolicy | null>(null);
    const [form, setForm] = useState({
        leaveTypeId: "",
        minLength: "",
        maxLength: "",
        noticeDays: ""
    });

    const handleOpen = (rule?: NoticeRuleWithPolicy) => {
        if (rule) {
            setEditingRule(rule);
            setForm({
                leaveTypeId: rule.leavePolicy.leaveTypeId,
                minLength: rule.minLength?.toString() || "",
                maxLength: rule.maxLength?.toString() || "",
                noticeDays: rule.noticeDays.toString(),
            });
        } else {
            setEditingRule(null);
            setForm({ leaveTypeId: "", minLength: "", maxLength: "", noticeDays: "" });
        }
        setIsDialogOpen(true);
    };

    const handleClose = () => {
        setEditingRule(null);
        setForm({ leaveTypeId: "", minLength: "", maxLength: "", noticeDays: "" });
        setIsDialogOpen(false);
    };

    // Create a map of leaveTypeId to policyId from the rules data
    const leaveTypeToPolicyMap = rules?.reduce((acc, rule) => {
        acc[rule.leavePolicy.leaveTypeId] = rule.leavePolicy.id;
        return acc;
    }, {} as Record<string, string>) || {};

    const handleSave = async () => {
        if (!form.noticeDays) {
            toast.error("Please enter notice days");
            return;
        }

        try {
            if (editingRule) {
                // Update existing rule
                await updateRuleMutation.mutateAsync({
                    id: editingRule.id,
                    payload: {
                        minLength: form.minLength ? parseInt(form.minLength) : undefined,
                        maxLength: form.maxLength ? parseInt(form.maxLength) : undefined,
                        noticeDays: parseInt(form.noticeDays),
                    },
                });
                toast.success("Notice rule updated successfully");
            } else {
                // Create new rule
                if (!form.leaveTypeId) {
                    toast.error("Please select a leave type");
                    return;
                }

                // Get the policy ID for this leave type
                const leavePolicyId = leaveTypeToPolicyMap[form.leaveTypeId];
                if (!leavePolicyId) {
                    toast.error("No policy found for this leave type");
                    return;
                }

                await addRuleMutation.mutateAsync({
                    leavePolicyId,
                    payload: {
                        minLength: form.minLength ? parseInt(form.minLength) : undefined,
                        maxLength: form.maxLength ? parseInt(form.maxLength) : undefined,
                        noticeDays: parseInt(form.noticeDays),
                    },
                });
                toast.success("Notice rule added successfully");
            }
            handleClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Failed to ${editingRule ? "update" : "add"} notice rule`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this notice rule?")) {
            return;
        }

        try {
            await deleteRuleMutation.mutateAsync(id);
            toast.success("Notice rule deleted successfully");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete notice rule");
        }
    };

    // Group rules by leave policy
    const rulesByPolicy = rules?.reduce((acc, rule) => {
        const policyId = rule.leavePolicy.id;
        if (!acc[policyId]) {
            acc[policyId] = {
                leaveType: rule.leavePolicy.leaveType,
                rules: [],
            };
        }
        acc[policyId].rules.push(rule);
        return acc;
    }, {} as Record<string, { leaveType: { id: string; name: string; code: string }; rules: typeof rules }>);

    // Get leave types that have policies (either have leavePolicy populated or exist in our rules)
    const leaveTypeIdsWithPolicies = new Set(Object.keys(leaveTypeToPolicyMap));
    const leaveTypesWithPolicies = leaveTypes?.filter(lt => {
        return lt.leavePolicy !== null && lt.leavePolicy !== undefined || leaveTypeIdsWithPolicies.has(lt.id);
    }) || [];

    return (
        <div className="space-y-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Card>
                        <div className="flex items-center justify-between p-4 border-b">
                            <div>
                                <h2 className="text-lg font-semibold">Leave Notice Rules</h2>
                                <p className="text-sm text-muted-foreground">
                                    Configure notice period requirements based on leave duration
                                </p>
                            </div>
                            <Button onClick={() => handleOpen()}>
                                <Plus className="mr-2 size-4" />
                                Add Rule
                            </Button>
                        </div>
                        <div className="p-4">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin size-8" />
                                </div>
                            ) : !rules || rules.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No notice rules defined. Add rules to specify notice requirements.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(rulesByPolicy || {}).map(([policyId, { leaveType, rules: policyRules }]) => (
                                        <div key={policyId} className="border rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Tag className="size-4 text-primary" />
                                                <h3 className="font-semibold">{leaveType.name}</h3>
                                                <Badge variant="outline">{leaveType.code}</Badge>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-1/4">Min Leave Days</TableHead>
                                                        <TableHead className="w-1/4">Max Leave Days</TableHead>
                                                        <TableHead className="w-1/4">Notice Required (Days)</TableHead>
                                                        <TableHead className="w-1/4 text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {policyRules.map((rule) => (
                                                        <TableRow key={rule.id}>
                                                            <TableCell>{rule.minLength ?? "Any"}</TableCell>
                                                            <TableCell>{rule.maxLength ?? "Any"}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary">{rule.noticeDays} days</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpen(rule)}
                                                                    disabled={updateRuleMutation.isPending || deleteRuleMutation.isPending}
                                                                >
                                                                    <Edit className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(rule.id)}
                                                                    disabled={updateRuleMutation.isPending || deleteRuleMutation.isPending}
                                                                >
                                                                    <Trash className="size-4 text-destructive" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRule ? "Edit Notice Rule" : "Add Notice Rule"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            {!editingRule && (
                                <div className="space-y-2">
                                    <Label htmlFor="leaveType">Leave Type *</Label>
                                    <Select
                                        value={form.leaveTypeId}
                                        onValueChange={(value) => setForm(f => ({ ...f, leaveTypeId: value }))}
                                    >
                                        <SelectTrigger id="leaveType">
                                            <SelectValue placeholder="Select leave type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leaveTypesWithPolicies.map((lt) => (
                                                <SelectItem key={lt.id} value={lt.id}>
                                                    {lt.name} ({lt.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Only leave types with policies are shown
                                    </p>
                                </div>
                            )}
                            {editingRule && (
                                <div className="space-y-2">
                                    <Label>Leave Type</Label>
                                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                        <Tag className="size-4 text-muted-foreground" />
                                        <span className="font-medium">{editingRule.leavePolicy.leaveType.name}</span>
                                        <Badge variant="outline">{editingRule.leavePolicy.leaveType.code}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Leave type cannot be changed when editing
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="minLength">Minimum Leave Days</Label>
                                <Input
                                    id="minLength"
                                    type="number"
                                    placeholder="e.g., 1 (optional)"
                                    value={form.minLength}
                                    onChange={e => setForm(f => ({ ...f, minLength: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank for no minimum
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxLength">Maximum Leave Days</Label>
                                <Input
                                    id="maxLength"
                                    type="number"
                                    placeholder="e.g., 7 (optional)"
                                    value={form.maxLength}
                                    onChange={e => setForm(f => ({ ...f, maxLength: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank for no maximum
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="noticeDays">Notice Days Required *</Label>
                                <Input
                                    id="noticeDays"
                                    type="number"
                                    placeholder="e.g., 7"
                                    value={form.noticeDays}
                                    onChange={e => setForm(f => ({ ...f, noticeDays: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Number of days notice required before leave start date
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button
                                onClick={handleSave}
                                disabled={addRuleMutation.isPending || updateRuleMutation.isPending}
                            >
                                {(addRuleMutation.isPending || updateRuleMutation.isPending) ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        {editingRule ? "Updating..." : "Adding..."}
                                    </>
                                ) : (
                                    editingRule ? "Update Rule" : "Add Rule"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
