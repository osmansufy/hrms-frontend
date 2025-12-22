"use client";

import { useMemo } from "react";
import { User, Mail, Phone, Briefcase, Calendar, Building2, Users, Heart, Globe, Droplet, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { listEmployees, type ApiEmployee } from "@/lib/api/employees";
import { useUserBalances } from "@/lib/queries/leave";

export default function ProfilePage() {
  const { session } = useSession();
  const userId = session?.user.id;

  // Find employee by userId
  const { data: employees, isLoading: employeeLoading } = useQuery({
    queryKey: ["employees", "profile", userId],
    queryFn: async () => {
      const allEmployees = await listEmployees();
      return allEmployees.find((emp: ApiEmployee) => emp.userId === userId);
    },
    enabled: Boolean(userId),
  });

  const employee = employees;
  const { data: balances, isLoading: balancesLoading } = useUserBalances();

  // Find subordinates (employees reporting to this employee)
  const { data: allEmployees } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: async () => {
      return await listEmployees();
    },
  });

  const subordinates = useMemo(() => {
    if (!employee?.id || !allEmployees) return [];
    return allEmployees.filter((emp: ApiEmployee) => emp.reportingManagerId === employee.id);
  }, [employee?.id, allEmployees]);

  const fullName = useMemo(() => {
    if (!employee) return session?.user.name || "N/A";
    return `${employee.firstName} ${employee.middleName ? employee.middleName + " " : ""}${employee.lastName}`.trim();
  }, [employee, session]);

  const initials = useMemo(() => {
    if (!employee) return session?.user.name?.charAt(0) || "U";
    return `${employee.firstName?.charAt(0) || ""}${employee.lastName?.charAt(0) || ""}`.toUpperCase();
  }, [employee, session]);

  const totalLeaveBalance = useMemo(() => {
    return balances?.reduce((sum, b) => sum + b.available, 0) || 0;
  }, [balances]);

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="text-2xl font-semibold">Your Profile</h1>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee?.profilePicture || undefined} alt={fullName} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <Badge variant={employee?.user?.status === "ACTIVE" ? "default" : "secondary"}>
                  {employee?.user?.status || "Active"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {employee?.employeeCode && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {employee.employeeCode}
                  </span>
                )}
                {employee?.designation?.title && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {employee.designation.title}
                  </span>
                )}
                {employee?.department?.name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {employee.department.name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Leave Balance</p>
              <p className="text-3xl font-bold">{totalLeaveBalance}</p>
              <p className="text-xs text-muted-foreground">days available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={employee?.user?.email || session?.user.email || "N/A"}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={employee?.phone || "N/A"}
            />
            {employee?.alternatePhone && (
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Alternate Phone"
                value={employee.alternatePhone}
              />
            )}
            {employee?.personalEmail && (
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Personal Email"
                value={employee.personalEmail}
              />
            )}
            {employee?.dateOfBirth && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Date of Birth"
                value={new Date(employee.dateOfBirth).toLocaleDateString()}
              />
            )}
            {employee?.gender && (
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Gender"
                value={employee.gender}
              />
            )}
            {employee?.maritalStatus && (
              <InfoRow
                icon={<Heart className="h-4 w-4" />}
                label="Marital Status"
                value={employee.maritalStatus}
              />
            )}
            {employee?.bloodGroup && (
              <InfoRow
                icon={<Droplet className="h-4 w-4" />}
                label="Blood Group"
                value={employee.bloodGroup}
              />
            )}
            {employee?.nationality && (
              <InfoRow
                icon={<Globe className="h-4 w-4" />}
                label="Nationality"
                value={employee.nationality}
              />
            )}
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Information
            </CardTitle>
            <CardDescription>Your employment and organizational details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Department"
              value={employee?.department?.name || "N/A"}
            />
            <InfoRow
              icon={<Briefcase className="h-4 w-4" />}
              label="Designation"
              value={employee?.designation?.title || "N/A"}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Joining Date"
              value={employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "N/A"}
            />
            {employee?.employmentType && (
              <InfoRow
                icon={<Briefcase className="h-4 w-4" />}
                label="Employment Type"
                value={employee.employmentType.replace(/_/g, " ")}
              />
            )}
            {employee?.reportingManager && (
              <InfoRow
                icon={<Users className="h-4 w-4" />}
                label="Reporting Manager"
                value={`${employee.reportingManager.firstName || ""} ${employee.reportingManager.lastName || ""}`.trim() || "N/A"}
              />
            )}
            {employee?.confirmationDate && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Confirmation Date"
                value={new Date(employee.confirmationDate).toLocaleDateString()}
              />
            )}
            {employee?.probationPeriod !== null && employee?.probationPeriod !== undefined && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Probation Period"
                value={`${employee.probationPeriod} months`}
              />
            )}
            {employee?.noticePeriod !== null && employee?.noticePeriod !== undefined && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Notice Period"
                value={`${employee.noticePeriod} days`}
              />
            )}
            {employee?.workSchedule?.name && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Work Schedule"
                value={employee.workSchedule.name}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Manager Information */}
      {employee?.reportingManager && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Line Manager
            </CardTitle>
            <CardDescription>Your direct reporting manager details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {`${employee.reportingManager.firstName?.charAt(0) || ""}${employee.reportingManager.lastName?.charAt(0) || ""}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {`${employee.reportingManager.firstName || ""} ${employee.reportingManager.lastName || ""}`.trim()}
                  </h3>
                  {employee.reportingManager.employeeCode && (
                    <p className="text-sm text-muted-foreground">
                      Employee ID: {employee.reportingManager.employeeCode}
                    </p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Your Direct Manager</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members (Subordinates) */}
      {subordinates && subordinates.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Team
            </CardTitle>
            <CardDescription>
              Employees reporting to you ({subordinates.length} {subordinates.length === 1 ? 'member' : 'members'})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subordinates.map((subordinate: ApiEmployee) => (
                <div key={subordinate.id} className="rounded-lg border p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={subordinate.profilePicture || undefined} />
                      <AvatarFallback>
                        {`${subordinate.firstName?.charAt(0) || ""}${subordinate.lastName?.charAt(0) || ""}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {`${subordinate.firstName} ${subordinate.lastName}`.trim()}
                      </h4>
                      {subordinate.employeeCode && (
                        <p className="text-xs text-muted-foreground">
                          {subordinate.employeeCode}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    {subordinate.designation?.title && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{subordinate.designation.title}</span>
                      </div>
                    )}
                    {subordinate.department?.name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{subordinate.department.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Balance Summary */}
      {!balancesLoading && balances && balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Balance Summary</CardTitle>
            <CardDescription>Your current leave balances by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {balances.map((balance) => (
                <div key={balance.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{balance.leaveTypeName}</h4>
                    <Badge variant="outline">{balance.leaveTypeCode}</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{balance.available}</span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  {balance.carried > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{balance.carried} carried forward
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your account security and role information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-xs text-muted-foreground">Authentication Status</p>
              <p className="text-sm font-semibold">Authenticated</p>
            </div>
            <Badge variant="secondary">Active Session</Badge>
          </div>
          <InfoRow
            label="Role"
            value={session?.user.roles.join(", ") || "Employee"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm font-medium">{value}</p>
      <Separator className="mt-2" />
    </div>
  );
}
