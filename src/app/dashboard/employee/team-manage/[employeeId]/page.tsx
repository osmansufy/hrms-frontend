"use client";

import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserCircle, Briefcase, Calendar, Clock } from "lucide-react";
import { JobCardTab } from "../components/job-card-tab";
import { SubordinateLeaveRecordsTab } from "../components/subordinate-leave-records-tab";
import { SubordinateAttendanceRecordsTab } from "../components/subordinate-attendance-records-tab";
import { Breadcrumb } from "../components/breadcrumb";
import { useManagerSubordinates } from "@/lib/queries/employees";
import { useSession } from "@/components/auth/session-provider";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubordinateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useSession();
  const employeeId = params?.employeeId as string;    
console.log({employeeId});
  // Get subordinates to verify access and get employee details
  const { data: managerSubordinates, isLoading } = useManagerSubordinates(session?.user.id);
  // Find the specific subordinate
  const subordinate = useMemo(() => {
    if (!managerSubordinates || !employeeId) return null;
    return managerSubordinates.find((sub) => sub.userId == employeeId);
  }, [managerSubordinates, employeeId]);
  const subordinateName = subordinate
    ? `${subordinate.firstName} ${subordinate.lastName}`
    : "Team Member";

  if (isLoading) {
    return (
      <div className="container space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If subordinate not found or unauthorized
  if (!subordinate) {
    return (
      <div className="container space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/employee/team-manage")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Member Not Found</CardTitle>
            <CardDescription>
              The team member you're trying to view doesn't exist or you don't have permission to view their details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/employee/team-manage")}>
              Return to Team Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/employee" },
          { label: "Team Management", href: "/dashboard/employee/team-manage" },
          { label: subordinateName },
        ]}
      />

      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/employee/team-manage")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">{subordinateName}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {subordinate.designation?.name || subordinate.designation?.title || "Employee"} 
              {subordinate.department?.name && ` • ${subordinate.department.name}`}
            </p>
          </div>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{subordinate.user?.email || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{subordinate.phone || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Employee ID</p>
              <p className="text-sm font-medium">{subordinate.employeeCode || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p> 
              <p className="text-sm font-medium capitalize">{subordinate.user?.status || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Details */}
      <Tabs defaultValue="job-card" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="job-card" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Job Card</span>
            <span className="sm:hidden">Job</span>
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Leave Records</span>
            <span className="sm:hidden">Leaves</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance Records</span>
            <span className="sm:hidden">Attendance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="job-card" className="space-y-4">
          <JobCardTab
            employeeId={subordinate.id}
            userId={subordinate.userId || ""}
          />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <SubordinateLeaveRecordsTab userId={subordinate.userId || ""} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <SubordinateAttendanceRecordsTab userId={subordinate.userId || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
