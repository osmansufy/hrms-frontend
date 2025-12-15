"use client";

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
import { useCreateLeavePolicy, useLeaveTypes, useUpdateLeavePolicy } from "@/lib/queries/leave";
import { AlertCircle, Edit, Loader2, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type LeaveType = NonNullable<ReturnType<typeof useLeaveTypes>["data"]>[number];

export function LeavePoliciesTab() {
    const { data: leaveTypes, isLoading } = useLeaveTypes();
    const createPolicyMutation = useCreateLeavePolicy();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
    const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);

    // Form state
    const [maxDays, setMaxDays] = useState("");
    const [encashmentFlag, setEncashmentFlag] = useState(false);
    const [carryForwardCap, setCarryForwardCap] = useState("");
    const [allowAdvance, setAllowAdvance] = useState(false);
    const [requireDocThresholdDays, setRequireDocThresholdDays] = useState("");

    const handleCreatePolicy = async () => {
        if (!selectedLeaveTypeId) {
            toast.error("Please select a leave type");
            return;
        }

        try {
            await createPolicyMutation.mutateAsync({
                leaveTypeId: selectedLeaveTypeId,
                maxDays: maxDays ? parseInt(maxDays) : undefined,
                encashmentFlag,
                carryForwardCap: carryForwardCap ? parseInt(carryForwardCap) : undefined,
                allowAdvance,
                requireDocThresholdDays: requireDocThresholdDays ? parseInt(requireDocThresholdDays) : undefined,
            });
            toast.success("Leave policy created successfully");
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create policy");
        }
    };

    const updatePolicyMutation = useUpdateLeavePolicy(editingLeaveType?.id || "");

    const handleUpdatePolicy = async () => {
        if (!editingLeaveType) {
            toast.error("No leave type selected");
            return;
        }

        try {
            await updatePolicyMutation.mutateAsync({
                maxDays: maxDays ? parseInt(maxDays) : undefined,
                encashmentFlag,
                carryForwardCap: carryForwardCap ? parseInt(carryForwardCap) : undefined,
                allowAdvance,
                requireDocThresholdDays: requireDocThresholdDays ? parseInt(requireDocThresholdDays) : undefined,
            });
            toast.success("Leave policy updated successfully");
            setIsEditDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update policy");
        }
    };

    const resetForm = () => {
        setSelectedLeaveTypeId("");
        setMaxDays("");
        setEncashmentFlag(false);
        setCarryForwardCap("");
        setAllowAdvance(false);
        setRequireDocThresholdDays("");
        setEditingLeaveType(null);
    };

    const openEditDialog = (type: LeaveType) => {
        setEditingLeaveType(type);
        setMaxDays(type.leavePolicy?.maxDays?.toString() || "");
        setEncashmentFlag(type.leavePolicy?.encashmentFlag || false);
        setCarryForwardCap(type.leavePolicy?.carryForwardCap?.toString() || "");
        setAllowAdvance(type.leavePolicy?.allowAdvance || false);
        setRequireDocThresholdDays(type.leavePolicy?.requireDocThresholdDays?.toString() || "");
        setIsEditDialogOpen(true);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leave Policies</CardTitle>
                    <CardDescription>Configure policies for each leave type</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const typesWithPolicies = leaveTypes?.filter((type) => type.leavePolicy) || [];
    const typesWithoutPolicies = leaveTypes?.filter((type) => !type.leavePolicy) || [];

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Leave Policies</CardTitle>
                            <CardDescription>Configure policies for each leave type</CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 size-4" />
                                    Create Policy
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create Leave Policy</DialogTitle>
                                    <DialogDescription>
                                        Configure policy rules for a leave type
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="leaveType">Leave Type *</Label>
                                        <select
                                            id="leaveType"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={selectedLeaveTypeId}
                                            onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                                        >
                                            <option value="">Select a leave type</option>
                                            {typesWithoutPolicies.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name} ({type.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maxDays">Maximum Days</Label>
                                        <Input
                                            id="maxDays"
                                            type="number"
                                            placeholder="e.g., 30"
                                            value={maxDays}
                                            onChange={(e) => setMaxDays(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Maximum days allowed per leave request (leave empty for no limit)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="carryForwardCap">Carry Forward Cap</Label>
                                        <Input
                                            id="carryForwardCap"
                                            type="number"
                                            placeholder="e.g., 10"
                                            value={carryForwardCap}
                                            onChange={(e) => setCarryForwardCap(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Maximum days that can be carried forward to next year
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="requireDocThresholdDays">Document Threshold Days</Label>
                                        <Input
                                            id="requireDocThresholdDays"
                                            type="number"
                                            placeholder="e.g., 5"
                                            value={requireDocThresholdDays}
                                            onChange={(e) => setRequireDocThresholdDays(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Require supporting document if leave exceeds this many days
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Encashment Allowed</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Allow employees to encash unused leave
                                            </p>
                                        </div>
                                        <Switch
                                            checked={encashmentFlag}
                                            onCheckedChange={setEncashmentFlag}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Allow Advance Leave</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Allow taking leave before accrual
                                            </p>
                                        </div>
                                        <Switch
                                            checked={allowAdvance}
                                            onCheckedChange={setAllowAdvance}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsDialogOpen(false);
                                            resetForm();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreatePolicy} disabled={createPolicyMutation.isPending}>
                                        {createPolicyMutation.isPending ? (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        ) : null}
                                        Create Policy
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {typesWithPolicies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Settings className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No policies configured</h3>
                            <p className="text-sm text-muted-foreground">
                                Create policies to configure rules for leave types
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Leave Type</TableHead>
                                        <TableHead>Max Days</TableHead>
                                        <TableHead>Carry Forward</TableHead>
                                        <TableHead>Doc Required</TableHead>
                                        <TableHead>Encashment</TableHead>
                                        <TableHead>Advance</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {typesWithPolicies.map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell className="font-medium">
                                                {type.name}
                                                <div className="text-xs text-muted-foreground">{type.code}</div>
                                            </TableCell>
                                            <TableCell>
                                                {type.leavePolicy?.maxDays ? (
                                                    <Badge variant="outline">{type.leavePolicy.maxDays} days</Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No limit</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {type.leavePolicy?.carryForwardCap ? (
                                                    <Badge variant="outline">{type.leavePolicy.carryForwardCap} days</Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {type.leavePolicy?.requireDocThresholdDays ? (
                                                    <Badge variant="outline">≥{type.leavePolicy.requireDocThresholdDays} days</Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Not configured</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={type.leavePolicy?.encashmentFlag ? "default" : "secondary"}>
                                                    {type.leavePolicy?.encashmentFlag ? "Yes" : "No"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={type.leavePolicy?.allowAdvance ? "default" : "secondary"}>
                                                    {type.leavePolicy?.allowAdvance ? "Yes" : "No"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(type)}
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Policy Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Leave Policy</DialogTitle>
                        <DialogDescription>
                            Update policy rules for {editingLeaveType?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-maxDays">Maximum Days</Label>
                            <Input
                                id="edit-maxDays"
                                type="number"
                                placeholder="e.g., 30"
                                value={maxDays}
                                onChange={(e) => setMaxDays(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum days allowed per leave request (leave empty for no limit)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-carryForwardCap">Carry Forward Cap</Label>
                            <Input
                                id="edit-carryForwardCap"
                                type="number"
                                placeholder="e.g., 10"
                                value={carryForwardCap}
                                onChange={(e) => setCarryForwardCap(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum days that can be carried forward to next year
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-requireDocThresholdDays">Document Threshold Days</Label>
                            <Input
                                id="edit-requireDocThresholdDays"
                                type="number"
                                placeholder="e.g., 5"
                                value={requireDocThresholdDays}
                                onChange={(e) => setRequireDocThresholdDays(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Require supporting document if leave exceeds this many days
                            </p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label>Encashment Allowed</Label>
                                <p className="text-xs text-muted-foreground">
                                    Allow employees to encash unused leave
                                </p>
                            </div>
                            <Switch
                                checked={encashmentFlag}
                                onCheckedChange={setEncashmentFlag}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label>Allow Advance Leave</Label>
                                <p className="text-xs text-muted-foreground">
                                    Allow taking leave before accrual
                                </p>
                            </div>
                            <Switch
                                checked={allowAdvance}
                                onCheckedChange={setAllowAdvance}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdatePolicy} disabled={updatePolicyMutation.isPending}>
                            {updatePolicyMutation.isPending ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : null}
                            Update Policy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
