"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useSystemSettings,
    useUpdateSystemSettings,
    useRebuildEmployeeCodes,
} from "@/lib/queries/system-settings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const schema = z.object({
    leaveDeductionDay: z
        .number()
        .min(1, "Must be at least 1")
        .max(31, "Must not exceed 31")
        .int("Must be a whole number"),
    allowMobileAttendance: z.boolean(),
    captureEmployeeLocation: z.boolean(),
    employeeIdPrefix: z
        .string()
        .min(1, "Prefix is required")
        .max(20, "Prefix must not exceed 20 characters"),
    timezone: z
        .string()
        .min(1, "Timezone is required")
        .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, "Must be a valid IANA timezone (e.g., Asia/Dhaka)"),
});

type FormValues = z.infer<typeof schema>;

export default function SystemSettingsPage() {
    const { data: settings, isLoading } = useSystemSettings();
    const updateMutation = useUpdateSystemSettings();
    const rebuildCodesMutation = useRebuildEmployeeCodes();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            leaveDeductionDay: 4,
            allowMobileAttendance: false,
            captureEmployeeLocation: true,
            employeeIdPrefix: "EMP",
            timezone: "Asia/Dhaka",
        },
    });

    // Update form when settings are loaded
    useEffect(() => {
        if (settings) {
            form.reset({
                leaveDeductionDay: settings.leaveDeductionDay,
                allowMobileAttendance: settings.allowMobileAttendance,
                captureEmployeeLocation: settings.captureEmployeeLocation,
                employeeIdPrefix: settings.employeeIdPrefix,
                timezone: settings.timezone || "Asia/Dhaka",
            });
        }
    }, [settings, form]);

    const onSubmit = async (values: FormValues) => {
        await updateMutation.mutateAsync(values);
    };

    if (isLoading) {
        return (
            <div className="container space-y-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-6 py-6">
            <div>
                <p className="text-sm text-muted-foreground">Configuration</p>
                <h1 className="text-2xl font-semibold">System Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure system-wide settings for leave deduction, mobile attendance, and location tracking
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Leave Deduction Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave Deduction Settings</CardTitle>
                            <CardDescription>
                                Configure when leave is deducted for late attendance
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="leaveDeductionDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Leave Deduction Day</FormLabel>
                                        <FormDescription>
                                            Leave will be deducted after this many late occurrences in a month.
                                            For example, if set to 4, leave will be deducted starting from the 4th late (after 3 lates).
                                        </FormDescription>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={31}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseInt(e.target.value, 10))
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Current setting: Leave will be deducted starting from the{" "}
                                    {form.watch("leaveDeductionDay")}th late attendance in a month.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Employee Code Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Employee ID/Code</CardTitle>
                            <CardDescription>
                                Configure the prefix used for auto-generated employee IDs/codes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="employeeIdPrefix"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee ID Prefix</FormLabel>
                                        <FormDescription>
                                            This prefix is used when generating new employee codes (e.g.,{" "}
                                            {field.value || "EMP"}
                                            001, {field.value || "EMP"}
                                            002). Only affects newly created employees.
                                        </FormDescription>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                maxLength={20}
                                                placeholder="EMP"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Timezone Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Timezone</CardTitle>
                            <CardDescription>
                                Set the timezone used across the application for displaying dates and times
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="timezone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>System Timezone</FormLabel>
                                        <FormDescription>
                                            All dates and times will be displayed in this timezone. Use IANA timezone format.
                                            <br />
                                            Common options: Asia/Dhaka, Asia/Kolkata, America/New_York, Europe/London
                                        </FormDescription>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="e.g., Asia/Dhaka"
                                                {...field}
                                                list="timezone-options"
                                            />
                                        </FormControl>
                                        <datalist id="timezone-options">
                                            <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                                            <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                                            <option value="Asia/Karachi">Asia/Karachi (UTC+5)</option>
                                            <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                                            <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                                            <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                                            <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                                            <option value="America/New_York">America/New_York (UTC-5)</option>
                                            <option value="America/Chicago">America/Chicago (UTC-6)</option>
                                            <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                                            <option value="Europe/London">Europe/London (UTC+0)</option>
                                            <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                                            <option value="Australia/Sydney">Australia/Sydney (UTC+11)</option>
                                        </datalist>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Mobile Attendance Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Mobile Attendance</CardTitle>
                            <CardDescription>
                                Control whether employees can mark attendance from mobile devices
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="allowMobileAttendance"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Allow Mobile Attendance
                                            </FormLabel>
                                            <FormDescription>
                                                When enabled, employees can mark attendance from mobile devices and tablets.
                                                When disabled, only desktop/laptop devices are allowed.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Location Tracking Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location Tracking</CardTitle>
                            <CardDescription>
                                Control whether employee GPS location is captured during attendance
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="captureEmployeeLocation"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Capture Employee Location
                                            </FormLabel>
                                            <FormDescription>
                                                When enabled, the system will capture GPS coordinates and address
                                                when employees mark attendance. When disabled, location data will not be collected.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between gap-4 pt-2">
                        <div className="text-xs text-muted-foreground max-w-md">
                            <p className="font-semibold">Bulk Update Employee Codes</p>
                            <p>
                                This will regenerate all existing employee codes using the current{" "}
                                <span className="font-mono">
                                    {form.watch("employeeIdPrefix") || "EMP"}
                                </span>{" "}
                                prefix and a new sequential number (e.g.{" "}
                                {form.watch("employeeIdPrefix") || "EMP"}
                                001,{" "}
                                {form.watch("employeeIdPrefix") || "EMP"}
                                002). This operation cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={rebuildCodesMutation.isPending}
                                onClick={() => rebuildCodesMutation.mutate()}
                            >
                                {rebuildCodesMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Codes...
                                    </>
                                ) : (
                                    "Update Existing Employee Codes"
                                )}
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                                size="lg"
                            >
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
