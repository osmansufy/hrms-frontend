import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome</p>
          <h1 className="text-2xl font-semibold">Your dashboard</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>View and update your information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/profile">
              Go to profile
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Sign in/out and view today&apos;s status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/attendance">
              Manage attendance
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave</CardTitle>
            <CardDescription>Apply for leave and track approvals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/leave">
              Request leave
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>Browse colleagues and teams.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/employee/directory">
              View directory
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
