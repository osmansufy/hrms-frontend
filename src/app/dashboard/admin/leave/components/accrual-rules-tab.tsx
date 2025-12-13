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
import { useAccrualRules, useCreateAccrualRule } from "@/lib/queries/leave";
import { AlertCircle, CalendarClock, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const FREQUENCY_OPTIONS = [
    { value: "WEEKLY", label: "Weekly" },
    { value: "SEMI_MONTHLY", label: "Semi-Monthly (twice per month)" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "YEARLY", label: "Yearly" },
];

const STRATEGY_OPTIONS = [
    { value: "FIXED", label: "Fixed" },
    { value: "TENURE_BASED", label: "Tenure Based" },
];

export function AccrualRulesTab() {
    const { data: accrualRules, isLoading } = useAccrualRules();
    const createRuleMutation = useCreateAccrualRule();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [frequency, setFrequency] = useState<"WEEKLY" | "SEMI_MONTHLY" | "MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
    const [ratePerPeriod, setRatePerPeriod] = useState("");
    const [accrualStrategy, setAccrualStrategy] = useState<"FIXED" | "TENURE_BASED">("FIXED");
    const [prorateFlag, setProrateFlag] = useState(false);
    const [startAfterDays, setStartAfterDays] = useState("");
    const [resetMonthDay, setResetMonthDay] = useState("");

    const handleCreateRule = async () => {
        if (!ratePerPeriod || parseFloat(ratePerPeriod) <= 0) {
            toast.error("Please enter a valid rate per period");
            return;
        }

        try {
            await createRuleMutation.mutateAsync({
                frequency,
                ratePerPeriod: parseFloat(ratePerPeriod),
                accrualStrategy,
                prorateFlag,
                startAfterDays: startAfterDays ? parseInt(startAfterDays) : undefined,
                resetMonthDay: resetMonthDay ? parseInt(resetMonthDay) : undefined,
            });
            toast.success("Accrual rule created successfully");
            setIsDialogOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create accrual rule");
        }
    };

    const resetForm = () => {
        setFrequency("MONTHLY");
        setRatePerPeriod("");
        setAccrualStrategy("FIXED");
        setProrateFlag(false);
        setStartAfterDays("");
        setResetMonthDay("");
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Accrual Rules</CardTitle>
                    <CardDescription>Configure how leave balances accrue over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Accrual Rules</CardTitle>
                            <CardDescription>
                                Configure how leave balances accrue over time for employees
                            </CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 size-4" />
                                    Create Rule
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create Accrual Rule</DialogTitle>
                                    <DialogDescription>
                                        Define how leave days are automatically added to employee balances
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="frequency">Accrual Frequency *</Label>
                                        <select
                                            id="frequency"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value as any)}
                                        >
                                            {FREQUENCY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground">
                                            How often leave days are added to the balance
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ratePerPeriod">Days Per Period *</Label>
                                        <Input
                                            id="ratePerPeriod"
                                            type="number"
                                            step="0.1"
                                            placeholder="e.g., 1.5"
                                            value={ratePerPeriod}
                                            onChange={(e) => setRatePerPeriod(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Number of leave days added per accrual period
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="accrualStrategy">Accrual Strategy</Label>
                                        <select
                                            id="accrualStrategy"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={accrualStrategy}
                                            onChange={(e) => setAccrualStrategy(e.target.value as any)}
                                        >
                                            {STRATEGY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground">
                                            Fixed: same rate for all employees. Tenure-based: rate varies by years of service
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="startAfterDays">Start After Days</Label>
                                        <Input
                                            id="startAfterDays"
                                            type="number"
                                            placeholder="e.g., 90"
                                            value={startAfterDays}
                                            onChange={(e) => setStartAfterDays(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Number of days after joining before accrual starts (probation period)
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="resetMonthDay">Reset on Day of Month</Label>
                                        <Input
                                            id="resetMonthDay"
                                            type="number"
                                            min="1"
                                            max="31"
                                            placeholder="e.g., 1"
                                            value={resetMonthDay}
                                            onChange={(e) => setResetMonthDay(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Day of month when balance resets (1-31). Leave empty if no reset
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Prorate Accrual</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Prorate accrual based on employment period within the accrual period
                                            </p>
                                        </div>
                                        <Switch
                                            checked={prorateFlag}
                                            onCheckedChange={setProrateFlag}
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
                                    <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                                        {createRuleMutation.isPending ? (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        ) : null}
                                        Create Rule
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {!accrualRules || accrualRules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CalendarClock className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No accrual rules</h3>
                            <p className="text-sm text-muted-foreground">
                                Create accrual rules to automatically add leave days to employee balances
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Frequency</TableHead>
                                        <TableHead>Rate/Period</TableHead>
                                        <TableHead>Strategy</TableHead>
                                        <TableHead>Prorate</TableHead>
                                        <TableHead>Start After</TableHead>
                                        <TableHead>Reset Day</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accrualRules.map((rule) => (
                                        <TableRow key={rule.id}>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {rule.frequency.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {rule.ratePerPeriod} days
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {rule.accrualStrategy}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={rule.prorateFlag ? "default" : "outline"}>
                                                    {rule.prorateFlag ? "Yes" : "No"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {rule.startAfterDays ? (
                                                    <span className="text-sm">{rule.startAfterDays} days</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Immediate</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {rule.resetMonthDay ? (
                                                    <span className="text-sm">Day {rule.resetMonthDay}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No reset</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
