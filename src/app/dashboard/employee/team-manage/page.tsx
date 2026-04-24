"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ClipboardCheck,
  AlertCircle,
  Package,
  Coffee,
  Activity,
  CalendarDays,
  FileEdit,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PendingApprovalsTab,
  PendingAmendmentsTab,
  PendingAssetApprovalsTab,
  TeamCalendarTab,
  TeamMembersTab,
  TeamBreakRecordsTab,
  TeamPresenceTab,
} from "./components";

import { useManagerSubordinates } from "@/lib/queries/employees";

export default function TeamManagePage() {
  // get manager subordinates
  const {
    data: managerSubordinates,
    isLoading: isManagerSubordinatesLoading,
    error: isManagerSubordinatesError,
  } = useManagerSubordinates();

  // If error indicates no subordinates or not a manager
  if (isManagerSubordinatesError && !isManagerSubordinatesLoading && !managerSubordinates) {
    return (
      <div className="container space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Leadership
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Manage your team members</p>
          </div>
          <Users className="text-primary size-8" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <AlertCircle className="text-muted-foreground mt-1 size-6" />
              <div>
                <CardTitle>No Team Members Found</CardTitle>
                <CardDescription className="mt-2">
                  You don&apos;t have any team members reporting to you.
                  <br />
                  Contact your HR department if you believe this is an error.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/employee">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Leadership
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage your team members</p>
        </div>
        <Users className="text-primary size-8" />
      </div>

      <Tabs defaultValue="presence" className="space-y-4">
        {/* Underline-style nav — scrolls horizontally on small screens */}
        <div className="overflow-x-auto border-b">
          <TabsList className="h-auto w-max min-w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0">
            {(
              [
                { value: "presence", Icon: Activity, label: "Presence" },
                { value: "pending", Icon: ClipboardCheck, label: "Leave Approvals" },
                { value: "amendments", Icon: FileEdit, label: "Leave Amendments" },
                { value: "asset-approvals", Icon: Package, label: "Asset Approvals" },
                { value: "breaks", Icon: Coffee, label: "Break Records" },
                { value: "subordinates", Icon: Users, label: "Team Members" },
                { value: "calendar", Icon: CalendarDays, label: "Leave Calendar" },
              ] as const
            ).map(({ value, Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="text-muted-foreground hover:text-foreground data-[state=active]:text-primary after:bg-primary relative flex items-center gap-2 rounded-none border-0 bg-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap shadow-none transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:scale-x-0 after:rounded-full after:transition-transform after:duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:scale-x-100"
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="presence" className="space-y-4">
          <TeamPresenceTab />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingApprovalsTab />
        </TabsContent>

        <TabsContent value="amendments" className="space-y-4">
          <PendingAmendmentsTab />
        </TabsContent>

        <TabsContent value="asset-approvals" className="space-y-4">
          <PendingAssetApprovalsTab />
        </TabsContent>

        <TabsContent value="breaks" className="space-y-4">
          <TeamBreakRecordsTab />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <TeamCalendarTab />
        </TabsContent>

        <TabsContent value="subordinates" className="space-y-4">
          <TeamMembersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
