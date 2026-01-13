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
    useSystemSettings,
    useUpdateSystemSettings,
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
});

type FormValues = z.infer<typeof schema>;

export default function SystemSettingsPage() {
    const { data: settings, isLoading } = useSystemSettings();
    const updateMutation = useUpdateSystemSettings();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            leaveDeductionDay: 4,
            allowMobileAttendance: false,
            captureEmployeeLocation: true,
        },
    });

    // Update form when settings are loaded
    useEffect(() => {
        if (settings) {
            form.reset({
                leaveDeductionDay: settings.leaveDeductionDay,
                allowMobileAttendance: settings.allowMobileAttendance,
                captureEmployeeLocation: settings.captureEmployeeLocation,
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

                    <div className="flex justify-end">
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
                </form>
            </Form>
        </div>
    );
}
