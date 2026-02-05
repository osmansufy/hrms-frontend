"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmployees } from "@/lib/queries/employees";
import { useDepartments } from "@/lib/queries/departments";
import { useDesignationsList } from "@/lib/queries/designations";
import { usePendingHRApprovals } from "@/lib/queries/leave";
import { Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";

export default function DashboardPage() {
  const { session } = useSession();
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { data: designations, isLoading: designationsLoading } = useDesignationsList();
  const { data: pendingApprovals, isLoading: approvalsLoading } = usePendingHRApprovals(session?.user.roles[0] || "");

  const employeesCount = employees?.length ?? 0;
  const departmentsCount = departments?.length ?? 0;
  const designationsCount = designations?.length ?? 0;
  const pendingApprovalsCount = pendingApprovals?.length ?? 0;

  const isLoading = employeesLoading || departmentsLoading || designationsLoading || approvalsLoading;

  return (
    <div className="container space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Employees"
          value={isLoading ? "..." : employeesCount.toString()}
          helper="Total employees"
          isLoading={employeesLoading}
        />
        <DashboardCard
          title="Departments"
          value={isLoading ? "..." : departmentsCount.toString()}
          helper="Active departments"
          isLoading={departmentsLoading}
        />
        <DashboardCard
          title="Designations"
          value={isLoading ? "..." : designationsCount.toString()}
          helper="Job roles"
          isLoading={designationsLoading}
        />
        <DashboardCard
          title="Pending Approvals"
          value={isLoading ? "..." : pendingApprovalsCount.toString()}
          helper="Awaiting approval"
          isLoading={approvalsLoading}
        />
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
  isLoading,
}: {
  title: string;
  value: string;
  helper: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
