"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { bulkResetLeaveBalances } from "@/lib/api/leave";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface BulkResetLeaveBalancesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function BulkResetLeaveBalancesDialog({
    open,
    onOpenChange,
    onSuccess,
}: BulkResetLeaveBalancesDialogProps) {
    const currentYear = new Date().getFullYear();
    const [fiscalYear, setFiscalYear] = useState(currentYear);
    const [dryRun, setDryRun] = useState(true);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [showResults, setShowResults] = useState(false);

    const mutation = useMutation({
        mutationFn: bulkResetLeaveBalances,
        onSuccess: (response) => {
            if (response.success) {
                setResults(response.data);
                setShowResults(true);
                if (!response.data.dryRun) {
                    toast.success(response.message);
                    onSuccess?.();
                } else {
                    toast.info("Dry Run Completed", {
                        description: "Review the results below. No changes were made.",
                    });
                }
            } else {
                toast.error(response.message || "Operation failed");
            }
        },
        onError: (error: any) => {
            toast.error("Failed to reset balances", {
                description: error?.response?.data?.message || error.message,
            });
        },
    });

    const handleSubmit = () => {
        mutation.mutate({ fiscalYear, dryRun, includeInactiveLeaveTypes: includeInactive });
    };

    const handleRunForReal = () => {
        setDryRun(false);
        setShowResults(false);
        mutation.mutate({ fiscalYear, dryRun: false, includeInactiveLeaveTypes: includeInactive });
    };

    const handleClose = () => {
        setShowResults(false);
        setResults(null);
        setDryRun(true);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Reset Leave Balances</DialogTitle>
                    <DialogDescription>
                        Set available leave balances to zero for all active employees and active leave types.
                    </DialogDescription>
                </DialogHeader>

                {!showResults ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fiscalYear">Fiscal Year</Label>
                            <Input
                                id="fiscalYear"
                                type="number"
                                min={2000}
                                max={currentYear + 10}
                                value={fiscalYear}
                                onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">The year in which to reset balances</p>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="dryRun"
                                checked={dryRun}
                                onCheckedChange={(checked) => setDryRun(!!checked)}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="dryRun">Dry Run (Preview)</Label>
                                <p className="text-xs text-muted-foreground">
                                    Preview the changes without posting ledger entries
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="includeInactive"
                                checked={includeInactive}
                                onCheckedChange={(checked) => setIncludeInactive(!!checked)}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="includeInactive">Include inactive leave types</Label>
                                <p className="text-xs text-muted-foreground">
                                    Also reset balances for leave types that are currently inactive.
                                </p>
                            </div>
                        </div>

                        <Alert className="border-yellow-200">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                This creates ADJUSTMENT ledger entries to reduce available balances to zero.
                                Ledger is immutable; this is audit-safe.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4">
                                <p className="text-sm font-medium">Employees</p>
                                <p className="text-2xl font-bold">{results.totalEmployees}</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-sm font-medium">Leave Types</p>
                                <p className="text-2xl font-bold">{results.totalLeaveTypes}</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-sm font-medium">Adjusted Entries</p>
                                <p className="text-2xl font-bold">{results.totalAdjustedEntries}</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-sm font-medium">Skipped</p>
                                <p className="text-2xl font-bold">{results.skippedCount}</p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!showResults ? (
                        <>
                            <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {dryRun ? "Preview" : "Reset Balances"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Close
                            </Button>
                            {results.dryRun && (
                                <Button onClick={handleRunForReal} disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Apply Reset
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}