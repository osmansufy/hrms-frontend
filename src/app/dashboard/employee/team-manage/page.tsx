"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ClipboardCheck, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    PendingApprovalsTab,
    ApprovedLeavesTab,
    TeamCalendarTab,
    AttendanceTab,
    TeamMembersTab
} from "./components";

import { useManagerSubordinates } from "@/lib/queries/employees";

export default function TeamManagePage() {
    // get manager subordinates
    const { data: managerSubordinates, isLoading: isManagerSubordinatesLoading, error: isManagerSubordinatesError } = useManagerSubordinates();

    // If error indicates no subordinates or not a manager
    if (isManagerSubordinatesError && !isManagerSubordinatesLoading && !managerSubordinates) {
        return (
            <div className="container space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">Team Management</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your team members
                        </p>
                    </div>
                    <Users className="size-8 text-primary" />
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <AlertCircle className="size-6 text-muted-foreground mt-1" />
                            <div>
                                <CardTitle>No Team Members Found</CardTitle>
                                <CardDescription className="mt-2">
                                    You don't have any team members reporting to you.
                                    <br />
                                    Contact your HR department if you believe this is an error.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/employee">
                            <Button variant="outline">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Team Management</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your team members
                    </p>
                </div>
                <Users className="size-8 text-primary" />
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <ClipboardCheck className="size-4" />
                        Pending Approvals
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="flex items-center gap-2">
                        <Clock className="size-4" />
                        Awaiting HR
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Users className="size-4" />
                        Team Calendar
                    </TabsTrigger>
                    {/* Divider */}

                </TabsList>
                {/* Divider */}
                <div className="w-full h-[1px] bg-muted" />
                {/* Attendance Tab list */}
                <TabsList className="grid w-full grid-cols-3">
                    {/* if manager has subordinates, show attendance tab */}

                    <TabsTrigger value="subordinates" className="flex items-center gap-2">
                        <Users className="size-4" />
                        Team Members
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-2">
                        <Clock className="size-4" />
                        Attendance History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <PendingApprovalsTab />
                </TabsContent>

                <TabsContent value="approved" className="space-y-4">
                    <ApprovedLeavesTab />
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                    <TeamCalendarTab />
                </TabsContent>
                <TabsContent value="subordinates" className="space-y-4">
                    <TeamMembersTab />
                </TabsContent>
                <TabsContent value="attendance" className="space-y-4">
                    <AttendanceTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
