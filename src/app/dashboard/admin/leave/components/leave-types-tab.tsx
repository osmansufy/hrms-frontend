"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Edit, Trash2, AlertCircle, ChevronDown, ChevronRight, Bell, TrendingUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
    useLeaveTypesAdmin,
    useCreateLeaveType,
    useUpdateLeaveType,
    useDeactivateLeaveType,
} from "@/lib/queries/leave";
import { getLeavePolicy } from "@/lib/api/leave";
import type { LeavePolicy } from "@/lib/api/leave";
import { toast } from "sonner";

type LeaveTypeData = {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    requiresApproval: boolean;
    allowOverlapPartial: boolean;
    isPaid: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    leavePolicy?: {
        id: string;
        maxDays?: number | null;
        carryForwardCap?: number | null;
        allowAdvance?: boolean;
    } | null;
};

export function LeaveTypesTab() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [loadedPolicies, setLoadedPolicies] = useState<Map<string, LeavePolicy>>(new Map());

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        requiresApproval: true,
        allowOverlapPartial: false,
        isPaid: true,
    });

    const { data: leaveTypes, isLoading } = useLeaveTypesAdmin({
        isActive: showInactive ? undefined : true,
        search: searchTerm,
    });

    const createMutation = useCreateLeaveType();
    const updateMutation = useUpdateLeaveType(editingId || "");
    const deactivateMutation = useDeactivateLeaveType(editingId || "");

    const handleCreate = async () => {
        if (!formData.name || !formData.code) {
            toast.error("Name and code are required");
            return;
        }

        try {
            await createMutation.mutateAsync(formData);
            toast.success("Leave type created successfully");
            setIsCreateOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to create leave type"
            );
        }
    };

    const handleEdit = (leaveType: LeaveTypeData) => {
        setEditingId(leaveType.id);
        setFormData({
            name: leaveType.name,
            code: leaveType.code,
            description: leaveType.description || "",
            requiresApproval: leaveType.requiresApproval,
            allowOverlapPartial: leaveType.allowOverlapPartial,
            isPaid: leaveType.isPaid,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!formData.name || !formData.code) {
            toast.error("Name and code are required");
            return;
        }

        try {
            await updateMutation.mutateAsync(formData);
            toast.success("Leave type updated successfully");
            setIsEditOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to update leave type"
            );
        }
    };

    const handleDeactivate = async (id: string) => {
        if (
            !confirm(
                "Are you sure you want to deactivate this leave type? It will no longer be available for new leave applications."
            )
        )
            return;

        try {
            setEditingId(id);
            await deactivateMutation.mutateAsync();
            toast.success("Leave type deactivated successfully");
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to deactivate leave type"
            );
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            description: "",
            requiresApproval: true,
            allowOverlapPartial: false,
            isPaid: true,
        });
        setEditingId(null);
    };

    const toggleRow = async (type: LeaveTypeData) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(type.id)) {
            newExpanded.delete(type.id);
        } else {
            newExpanded.add(type.id);
            // Load policy details if not already loaded and policy exists
            if (type.leavePolicy && !loadedPolicies.has(type.id)) {
                try {
                    const policy = await getLeavePolicy(type.id);
                    setLoadedPolicies(new Map(loadedPolicies.set(type.id, policy)));
                } catch (error) {
                    console.error("Failed to load policy details", error);
                }
            }
        }
        setExpandedRows(newExpanded);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Types</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40">
                    <Loader2 className="animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Leave Types</CardTitle>
                            <CardDescription>
                                Manage all leave types available in your organization
                            </CardDescription>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Leave Type
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Leave Type</DialogTitle>
                                    <DialogDescription>
                                        Add a new leave type to your organization
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Form fields */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Leave Type Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Annual Leave"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="code">Code *</Label>
                                        <Input
                                            id="code"
                                            placeholder="e.g., AL"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    code: e.target.value.toUpperCase(),
                                                })
                                            }
                                            maxLength={10}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            placeholder="Optional description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Requires Approval</Label>
                                            <Switch
                                                checked={formData.requiresApproval}
                                                onCheckedChange={(checked) =>
                                                    setFormData({
                                                        ...formData,
                                                        requiresApproval: checked,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label>Allow Overlap (Partial)</Label>
                                            <Switch
                                                checked={formData.allowOverlapPartial}
                                                onCheckedChange={(checked) =>
                                                    setFormData({
                                                        ...formData,
                                                        allowOverlapPartial: checked,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label>Is Paid Leave</Label>
                                            <Switch
                                                checked={formData.isPaid}
                                                onCheckedChange={(checked) =>
                                                    setFormData({ ...formData, isPaid: checked })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreate}
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Create
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-2 items-center">
                        <Input
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-xs"
                        />
                        <div className="flex items-center gap-2 ml-auto">
                            <Label htmlFor="inactive">Show Inactive</Label>
                            <Switch
                                id="inactive"
                                checked={showInactive}
                                onCheckedChange={setShowInactive}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leave Types Table */}
            <Card>
                <CardContent className="pt-6">
                    {leaveTypes && leaveTypes.length > 0 ? (
                        <div className="space-y-2">
                            {leaveTypes.map((type: LeaveTypeData) => {
                                const isExpanded = expandedRows.has(type.id);
                                const policy = loadedPolicies.get(type.id);
                                const hasPolicy = !!type.leavePolicy;
                                const hasNoticeRules = policy?.noticeRules && policy.noticeRules.length > 0;
                                const hasAccrualRule = !!policy?.accrualRule;

                                return (
                                    <div key={type.id} className="rounded-lg border">
                                        <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                                            <div className="flex items-center gap-4 flex-1">
                                                {hasPolicy && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => toggleRow(type)}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                                <div className="flex-1">
                                                    <div className="font-medium">{type.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline">{type.code}</Badge>
                                                        {type.description && (
                                                            <span className="text-xs text-muted-foreground">{type.description}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {type.requiresApproval && (
                                                        <Badge variant="secondary">Requires Approval</Badge>
                                                    )}
                                                    {type.isPaid && (
                                                        <Badge variant="secondary">Paid</Badge>
                                                    )}
                                                    {type.allowOverlapPartial && (
                                                        <Badge variant="secondary">Overlap OK</Badge>
                                                    )}
                                                    <Badge variant={type.isActive ? "default" : "outline"}>
                                                        {type.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Dialog
                                                        open={isEditOpen && editingId === type.id}
                                                        onOpenChange={setIsEditOpen}
                                                    >
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(type)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Leave Type</DialogTitle>
                                                                <DialogDescription>
                                                                    Update leave type details
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            {/* Edit form fields */}
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <Label htmlFor="edit-name">
                                                                        Leave Type Name *
                                                                    </Label>
                                                                    <Input
                                                                        id="edit-name"
                                                                        value={formData.name}
                                                                        onChange={(e) =>
                                                                            setFormData({
                                                                                ...formData,
                                                                                name: e.target.value,
                                                                            })
                                                                        }
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label htmlFor="edit-code">Code *</Label>
                                                                    <Input
                                                                        id="edit-code"
                                                                        value={formData.code}
                                                                        onChange={(e) =>
                                                                            setFormData({
                                                                                ...formData,
                                                                                code: e.target.value.toUpperCase(),
                                                                            })
                                                                        }
                                                                        maxLength={10}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label htmlFor="edit-description">
                                                                        Description
                                                                    </Label>
                                                                    <Input
                                                                        id="edit-description"
                                                                        value={formData.description}
                                                                        onChange={(e) =>
                                                                            setFormData({
                                                                                ...formData,
                                                                                description: e.target.value,
                                                                            })
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label>Requires Approval</Label>
                                                                        <Switch
                                                                            checked={formData.requiresApproval}
                                                                            onCheckedChange={(checked) =>
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    requiresApproval: checked,
                                                                                })
                                                                            }
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center justify-between">
                                                                        <Label>Allow Overlap (Partial)</Label>
                                                                        <Switch
                                                                            checked={formData.allowOverlapPartial}
                                                                            onCheckedChange={(checked) =>
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    allowOverlapPartial: checked,
                                                                                })
                                                                            }
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center justify-between">
                                                                        <Label>Is Paid Leave</Label>
                                                                        <Switch
                                                                            checked={formData.isPaid}
                                                                            onCheckedChange={(checked) =>
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    isPaid: checked,
                                                                                })
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setIsEditOpen(false);
                                                                        resetForm();
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleUpdate}
                                                                    disabled={updateMutation.isPending}
                                                                >
                                                                    {updateMutation.isPending && (
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    )}
                                                                    Update
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeactivate(type.id)}
                                                        disabled={!type.isActive}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Policy Details */}
                                        {isExpanded && hasPolicy && (
                                            <div className="border-t bg-muted/20 p-4 space-y-4">
                                                {/* Policy Summary */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-sm">Leave Policy</h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push('/dashboard/admin/leave?tab=policies')}
                                                            className="h-8 gap-2"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            View All Policies
                                                        </Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm bg-background rounded-md p-3 border">
                                                        <div>
                                                            <span className="text-muted-foreground">Max Days: </span>
                                                            {type.leavePolicy?.maxDays ? (
                                                                <Badge variant="outline">{type.leavePolicy.maxDays}</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">No limit</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Carry Forward: </span>
                                                            {type.leavePolicy?.carryForwardCap ? (
                                                                <Badge variant="outline">{type.leavePolicy.carryForwardCap}</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">N/A</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Advance Leave: </span>
                                                            <Badge variant={type.leavePolicy?.allowAdvance ? "default" : "secondary"}>
                                                                {type.leavePolicy?.allowAdvance ? "Yes" : "No"}
                                                            </Badge>
                                                        </div>
                                                        {policy?.requireDocThresholdDays && (
                                                            <div>
                                                                <span className="text-muted-foreground">Doc Required: </span>
                                                                <span className="font-medium">≥ {policy.requireDocThresholdDays} days</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Notice Rules Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Bell className="h-4 w-4 text-muted-foreground" />
                                                            <h4 className="font-semibold text-sm">Notice Rules</h4>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push('/dashboard/admin/leave?tab=notice')}
                                                            className="h-8 gap-2"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            View All Notice Rules
                                                        </Button>
                                                    </div>
                                                    {hasNoticeRules ? (
                                                        <div className="grid gap-2">
                                                            {policy?.noticeRules?.map((rule, index) => (
                                                                <div key={rule.id} className="flex items-center gap-4 text-sm bg-background rounded-md p-3 border">
                                                                    <Badge variant="outline">Rule {index + 1}</Badge>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-muted-foreground">Duration:</span>
                                                                        <span className="font-medium">
                                                                            {rule.minLength && rule.maxLength
                                                                                ? `${rule.minLength}-${rule.maxLength} days`
                                                                                : rule.minLength
                                                                                    ? `≥${rule.minLength} days`
                                                                                    : rule.maxLength
                                                                                        ? `≤${rule.maxLength} days`
                                                                                        : "Any duration"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-muted-foreground">Notice:</span>
                                                                        <Badge variant="secondary">
                                                                            {rule.noticeDays} days
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground bg-background rounded-md p-3 border">
                                                            No notice rules configured
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Accrual Rule Section */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                            <h4 className="font-semibold text-sm">Accrual Rule</h4>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push('/dashboard/admin/leave?tab=accruals')}
                                                            className="h-8 gap-2"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            View All Accrual Rules
                                                        </Button>
                                                    </div>
                                                    {hasAccrualRule ? (
                                                        <div className="bg-background rounded-md p-3 border space-y-2">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-muted-foreground">Frequency: </span>
                                                                    <Badge variant="outline">
                                                                        {policy?.accrualRule?.frequency.replace("_", " ")}
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Rate: </span>
                                                                    <span className="font-medium">
                                                                        {policy?.accrualRule?.ratePerPeriod} days/period
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Strategy: </span>
                                                                    <Badge variant="secondary">
                                                                        {policy?.accrualRule?.accrualStrategy.replace("_", " ")}
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground">Prorate: </span>
                                                                    <Badge variant={policy?.accrualRule?.prorateFlag ? "default" : "outline"}>
                                                                        {policy?.accrualRule?.prorateFlag ? "Yes" : "No"}
                                                                    </Badge>
                                                                </div>
                                                                {policy?.accrualRule?.startAfterDays && (
                                                                    <div>
                                                                        <span className="text-muted-foreground">Start After: </span>
                                                                        <span className="font-medium">
                                                                            {policy.accrualRule.startAfterDays} days
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {policy?.accrualRule?.resetMonthDay && (
                                                                    <div>
                                                                        <span className="text-muted-foreground">Reset Day: </span>
                                                                        <span className="font-medium">
                                                                            Day {policy.accrualRule.resetMonthDay} of month
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground bg-background rounded-md p-3 border">
                                                            No accrual rule configured
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* No Policy Message */}
                                        {isExpanded && !hasPolicy && (
                                            <div className="border-t bg-muted/20 p-4">
                                                <div className="text-sm text-muted-foreground bg-background rounded-md p-3 border text-center">
                                                    No policy configured for this leave type
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                            <p>
                                {searchTerm
                                    ? "No leave types found matching your search"
                                    : "No leave types found"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
