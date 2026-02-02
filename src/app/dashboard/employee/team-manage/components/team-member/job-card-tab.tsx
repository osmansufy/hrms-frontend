"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubordinateDetails } from "@/lib/queries/employees";
import {
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  User,
  Clock,
  Users,
} from "lucide-react";

interface JobCardTabProps {
  employeeId: string;
  userId: string;
}

export function JobCardTab({ employeeId, userId }: JobCardTabProps) {
  const { data: employee, isLoading, error } = useSubordinateDetails(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            {error ? "Failed to load employee details" : "Employee not found"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const fullName = [
    employee.firstName,
    employee.middleName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const formatEmploymentType = (type?: string | null) =>
    type
      ? type.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
      : "—";

  const formatStatus = (status?: string | null) => {
    if (!status) return "Active";
    const normalized = status.toUpperCase();
    if (normalized.includes("INACTIVE")) return "Inactive";
    if (normalized.includes("LEAVE")) return "On Leave";
    return "Active";
  };

  const status = formatStatus(employee.user?.status);

  return (
    <div className="space-y-4">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Name" value={fullName} />
          <InfoRow
            label="Employee Code"
            value={employee.employeeCode || "—"}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <InfoRow
            label="Email"
            value={employee.user?.email || employee.personalEmail || "—"}
            icon={<Mail className="h-4 w-4" />}
          />
          <InfoRow
            label="Phone"
            value={employee.phone || "—"}
            icon={<Phone className="h-4 w-4" />}
          />
          {employee.alternatePhone && (
            <InfoRow
              label="Alternate Phone"
              value={employee.alternatePhone}
              icon={<Phone className="h-4 w-4" />}
            />
          )}
          <InfoRow
            label="Status"
            value={
              <Badge
                variant={
                  status === "Active"
                    ? "default"
                    : status === "On Leave"
                      ? "secondary"
                      : "outline"
                }
              >
                {status}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow
            label="Department"
            value={employee.department?.name || "—"}
            icon={<Building2 className="h-4 w-4" />}
          />
          <InfoRow
            label="Designation"
            value={
              employee.designation?.title ||
              employee.designation?.name ||
              "—"
            }
            icon={<Briefcase className="h-4 w-4" />}
          />
          <InfoRow
            label="Employment Type"
            value={formatEmploymentType(employee.employmentType)}
          />
          <InfoRow
            label="Joining Date"
            value={
              employee.joiningDate
                ? new Date(employee.joiningDate).toLocaleDateString()
                : "—"
            }
            icon={<Calendar className="h-4 w-4" />}
          />
          {employee.confirmationDate && (
            <InfoRow
              label="Confirmation Date"
              value={new Date(employee.confirmationDate).toLocaleDateString()}
              icon={<Calendar className="h-4 w-4" />}
            />
          )}
          {employee.probationPeriod !== null &&
            employee.probationPeriod !== undefined && (
              <InfoRow
                label="Probation Period"
                value={`${employee.probationPeriod} months`}
              />
            )}
          {employee.noticePeriod !== null &&
            employee.noticePeriod !== undefined && (
              <InfoRow
                label="Notice Period"
                value={`${employee.noticePeriod} days`}
              />
            )}
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Work Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow
            label="Work Schedule"
            value={employee.workSchedule?.name || "—"}
            icon={<Clock className="h-4 w-4" />}
          />
          {employee.reportingManager && (
            <InfoRow
              label="Reporting Manager"
              value={`${employee.reportingManager.firstName} ${employee.reportingManager.lastName}`}
              icon={<Users className="h-4 w-4" />}
            />
          )}
          {employee.nationality && (
            <InfoRow label="Nationality" value={employee.nationality} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {value}
      </div>
    </div>
  );
}
