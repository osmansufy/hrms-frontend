"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="container space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Employees" value="0" helper="Total employees" />
        <DashboardCard title="Departments" value="0" helper="Active departments" />
        <DashboardCard title="Designations" value="0" helper="Job roles" />
        <DashboardCard title="Pending Approvals" value="0" helper="Awaiting approval" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Overview</CardTitle>
          <CardDescription>
            Select a section from the sidebar to manage your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Employees:</strong> Manage employee records, profiles, and details
            </p>
            <p>
              <strong>Departments:</strong> Create and manage organizational departments
            </p>
            <p>
              <strong>Designations:</strong> Set up job roles and positions
            </p>
            <p>
              <strong>Leave:</strong> View and manage leave policies and requests
            </p>
            <p>
              <strong>Attendance:</strong> Configure attendance policies and view reports
            </p>
            <p>
              <strong>Line Managers:</strong> Assign reporting relationships
            </p>
            <p>
              <strong>Users:</strong> Manage user accounts and permissions
            </p>
            <p>
              <strong>Approvals:</strong> Review and approve pending requests
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
