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
import { bulkApplyLeaveTypes } from "@/lib/api/leave";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkApplyLeaveTypesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function BulkApplyLeaveTypesDialog({
    open,
    onOpenChange,
    onSuccess,
}: BulkApplyLeaveTypesDialogProps) {
    const currentYear = new Date().getFullYear();
    const [fiscalYear, setFiscalYear] = useState(currentYear);
    const [dryRun, setDryRun] = useState(true);
    const [overrideExisting, setOverrideExisting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<any>(null);

    const mutation = useMutation({
        mutationFn: bulkApplyLeaveTypes,
        onSuccess: (response) => {
            if (response.success) {
                setResults(response.data);
                setShowResults(true);

                if (!response.data.dryRun) {
                    toast.success(response.message, {
                        description: `Successfully applied leave types to ${response.data.successCount} employees`,
                    });
                    onSuccess?.();
                } else {
                    toast.info("Dry Run Completed", {
                        description: "Review the results below. No changes were made.",
                    });
                }
            } else {
                toast.error("Operation Failed", {
                    description: response.message || "An error occurred",
                });
            }
        },
        onError: (error: any) => {
            toast.error("Failed to apply leave types", {
                description: error?.response?.data?.message || error.message,
            });
        },
    });

    const handleSubmit = () => {
        mutation.mutate({
            fiscalYear,
            dryRun,
            overrideExisting,
        });
    };

    const handleClose = () => {
        setShowResults(false);
        setResults(null);
        setDryRun(true);
        setOverrideExisting(false);
        onOpenChange(false);
    };

    const handleRunForReal = () => {
        setDryRun(false);
        setShowResults(false);
        mutation.mutate({
            fiscalYear,
            dryRun: false,
            overrideExisting,
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Apply Leave Types to All Employees
                    </DialogTitle>
                    <DialogDescription>
                        This will apply all active leave types to all active employees for the selected fiscal year.
                        Perfect for year-start initialization.
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
                                placeholder="2026"
                            />
                            <p className="text-xs text-muted-foreground">
                                The year for which to apply leave types
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="dryRun"
                                    checked={dryRun}
                                    onCheckedChange={(checked) => setDryRun(checked as boolean)}
                                />
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="dryRun"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Dry Run (Preview Only)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Preview the results without making any changes to the database
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="overrideExisting"
                                    checked={overrideExisting}
                                    onCheckedChange={(checked) => setOverrideExisting(checked as boolean)}
                                />
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="overrideExisting"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Override Existing Balances
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Update balances even if employees already have them for this year
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>What this does:</strong>
                                <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
                                    <li>Fetches all active employees</li>
                                    <li>Fetches all active leave types</li>
                                    <li>Creates leave balances based on leave policies</li>
                                    <li>Automatically calculates pro-rata for mid-year joiners</li>
                                    <li>Skips employees with existing balances (unless override is enabled)</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">Success</span>
                                </div>
                                <p className="text-2xl font-bold">{results.successCount}</p>
                                <p className="text-xs text-muted-foreground">employees processed</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium">Failed</span>
                                </div>
                                <p className="text-2xl font-bold">{results.failureCount}</p>
                                <p className="text-xs text-muted-foreground">errors encountered</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm font-medium">Skipped</span>
                                </div>
                                <p className="text-2xl font-bold">{results.skippedCount}</p>
                                <p className="text-xs text-muted-foreground">already had balances</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">Created</span>
                                </div>
                                <p className="text-2xl font-bold">{results.totalBalancesCreated}</p>
                                <p className="text-xs text-muted-foreground">total balances</p>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 space-y-2">
                            <h4 className="text-sm font-medium">Summary</h4>
                            <div className="text-sm space-y-1">
                                <p>
                                    <span className="text-muted-foreground">Total Employees:</span>{" "}
                                    <span className="font-medium">{results.totalEmployees}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Total Leave Types:</span>{" "}
                                    <span className="font-medium">{results.totalLeaveTypes}</span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Duration:</span>{" "}
                                    <span className="font-medium">{(results.duration / 1000).toFixed(2)}s</span>
                                </p>
                            </div>
                        </div>

                        {results.errors && results.errors.length > 0 && (
                            <div className="rounded-lg border border-red-200 p-4 space-y-2">
                                <h4 className="text-sm font-medium text-red-900">Errors ({results.errors.length})</h4>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {results.errors.map((error: any, index: number) => (
                                        <div key={index} className="text-xs bg-red-50 rounded p-2">
                                            <p className="font-medium">{error.employeeName}</p>
                                            <p className="text-muted-foreground">{error.error}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.dryRun && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    This was a <strong>dry run</strong>. No changes were made to the database.
                                    Click &quot;Apply For Real&quot; to execute the operation.
                                </AlertDescription>
                            </Alert>
                        )}
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
                                {dryRun ? "Preview" : "Apply Leave Types"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Close
                            </Button>
                            {results.dryRun && results.failureCount === 0 && (
                                <Button onClick={handleRunForReal} disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Apply For Real
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
