"use client";

import { useState, ReactNode } from "react";
import { Search, UserCog, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/utils/error-handler";
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
import { Badge } from "@/components/ui/badge";
import { useAssignManager, useManagers } from "@/lib/queries/employees";
import type { ApiEmployee } from "@/lib/api/employees";

interface AssignManagerDialogProps {
    employeeId: string;
    employeeName: string;
    currentManager?: ApiEmployee["reportingManager"] | null;
    onSuccess?: () => void;
    trigger?: ReactNode;
}

export function AssignManagerDialog({
    employeeId,
    employeeName,
    currentManager,
    onSuccess,
    trigger,
}: AssignManagerDialogProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedManagerId, setSelectedManagerId] = useState<string | null>(
        currentManager?.id || null
    );

    const { data: managers = [], isLoading } = useManagers(search);
    console.log(managers);
    const assignMutation = useAssignManager(employeeId);

    const handleAssign = async () => {
        if (!selectedManagerId) {
            toast.error("Please select a manager");
            return;
        }

        try {
            const result = await assignMutation.mutateAsync({
                reportingManagerId: selectedManagerId,
            });

            const successMessage = typeof result.message === 'string'
                ? result.message
                : "Manager assigned successfully";

            toast.success(successMessage, {
                description: result.previousManager
                    ? `Previous manager: ${result.previousManager.firstName} ${result.previousManager.lastName}`
                    : undefined,
            });

            setOpen(false);
            onSuccess?.();
        } catch (error: any) {
            const message = extractErrorMessage(error, "Failed to assign manager");
            toast.error(message);
        }
    };

    const handleRemove = async () => {
        if (!currentManager) {
            toast.error("No manager to remove");
            return;
        }

        const confirmed = window.confirm(
            `Remove ${currentManager.firstName} ${currentManager.lastName} as manager for ${employeeName}?`
        );
        if (!confirmed) return;

        try {
            const result = await assignMutation.mutateAsync({
                reportingManagerId: null,
            });

            const successMessage = typeof result.message === 'string'
                ? result.message
                : "Manager removed successfully";
            toast.success(successMessage);
            setSelectedManagerId(null);
            setOpen(false);
            onSuccess?.();
        } catch (error: any) {
            const message = extractErrorMessage(error, "Failed to remove manager");
            toast.error(message);
        }
    };

    const filteredManagers = managers.filter((m) => m.id !== employeeId);

    const defaultTrigger = (
        <Button variant="outline" size="sm">
            <UserCog className="mr-2 h-4 w-4" />
            {currentManager ? "Change Manager" : "Assign Manager"}
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-125">
                <DialogHeader>
                    <DialogTitle>Assign Line Manager</DialogTitle>
                    <DialogDescription>
                        Select a reporting manager for {employeeName}. Only users with
                        managerial roles will appear.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {currentManager && (
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <Label className="text-xs text-muted-foreground">
                                Current Manager
                            </Label>
                            <div className="mt-1 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">
                                        {currentManager.firstName} {currentManager.lastName}
                                    </p>
                                    {currentManager.employeeCode && (
                                        <p className="text-xs text-muted-foreground">
                                            {currentManager.employeeCode}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemove}
                                    disabled={assignMutation.isPending}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="search">Search Managers</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search by name or code..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Available Managers</Label>
                        <div className="max-h-75 space-y-2 overflow-y-auto rounded-md border p-2">
                            {isLoading ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    Loading managers...
                                </div>
                            ) : filteredManagers.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No managers found
                                </div>
                            ) : (
                                filteredManagers.map((manager) => (
                                    <button
                                        key={manager.id}
                                        type="button"
                                        onClick={() => setSelectedManagerId(manager.id)}
                                        className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${selectedManagerId === manager.id
                                            ? "border-primary bg-accent"
                                            : "border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{manager.name}</p>
                                                {manager.employeeCode && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {manager.employeeCode}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedManagerId === manager.id && (
                                                <Badge variant="default" className="text-xs">
                                                    Selected
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={assignMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={
                            !selectedManagerId ||
                            selectedManagerId === currentManager?.id ||
                            assignMutation.isPending
                        }
                    >
                        {assignMutation.isPending ? "Assigning..." : "Assign Manager"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
