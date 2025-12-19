"use client";

import { useState } from "react";
import { Loader2, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInactive, setShowInactive] = useState(false);

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
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Config</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaveTypes.map((type: LeaveTypeData) => (
                                        <TableRow key={type.id}>
                                            <TableCell className="font-medium">{type.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{type.code}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {type.description || "-"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex gap-2 flex-wrap">
                                                    {type.requiresApproval && (
                                                        <Badge variant="secondary">Requires Approval</Badge>
                                                    )}
                                                    {type.isPaid && (
                                                        <Badge variant="secondary">Paid</Badge>
                                                    )}
                                                    {type.allowOverlapPartial && (
                                                        <Badge variant="secondary">Overlap OK</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={type.isActive ? "default" : "outline"}
                                                >
                                                    {type.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
