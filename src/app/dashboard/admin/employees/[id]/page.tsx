"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, Clock, Key, Mail, MoreVertical, Phone, Trash2, UserCog } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AssignManagerDialog } from "@/components/assign-manager-dialog";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { ChangeWorkScheduleDialog } from "@/components/change-work-schedule-dialog";
import { EmployeeLeaveBalanceCard } from "@/components/employee-leave-balance-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDepartments } from "@/lib/queries/departments";
import { useDesignationsList } from "@/lib/queries/designations";
import { useDeleteEmployee, useEmployeeDetail, useManagerSubordinates, useUpdateEmployee } from "@/lib/queries/employees";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import { MonthlySummaryCard } from "../../attendance/components/monthly-summary-card";

const schema = z.object({
  phone: z.string().optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY", "CONSULTANT"])
    .optional(),
  joiningDate: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  reportingManagerId: z.string().optional(),
  employeeCodeSuffix: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d+$/.test(val),
      { message: "ID suffix must be numeric" }
    ),
});

type FormValues = z.infer<typeof schema>;

const employmentOptions = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
  "TEMPORARY",
  "CONSULTANT",
] as const;

const formatEmploymentType = (type?: string | null) =>
  type ? type.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : "—";

const formatStatus = (status?: string | null) => {
  if (!status) return "Active";
  const normalized = status.toUpperCase();
  if (normalized.includes("INACTIVE")) return "Inactive";
  if (normalized.includes("LEAVE")) return "On Leave";
  return "Active";
};

export default function AdminEmployeeDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const { data, isLoading, isError } = useEmployeeDetail(id || "");
  const updateMutation = useUpdateEmployee(id || "");
  const deleteMutation = useDeleteEmployee();
  const { data: subordinates = [] } = useManagerSubordinates(id);
  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignationsList();

  // Derive current employee code prefix/suffix from existing code, e.g. EMP001 -> prefix=EMP, suffix=001
  const existingCode = data?.employeeCode || "";
  const codeMatch = existingCode.match(/^([A-Za-z]+)(\d+)$/);
  const employeeCodePrefix = codeMatch?.[1] || "";
  const employeeCodeSuffix = codeMatch?.[2] || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: data?.phone || "",
      employmentType: data?.employmentType as FormValues["employmentType"],
      joiningDate: data?.joiningDate?.slice(0, 10) ?? "",
      departmentId: data?.departmentId || "",
      designationId: data?.designationId || "",
      reportingManagerId: data?.reportingManagerId || "",
      employeeCodeSuffix,
    },
    values: data
      ? {
        phone: data.phone || "",
        employmentType: (data.employmentType as FormValues["employmentType"]) || undefined,
        joiningDate: data.joiningDate?.slice(0, 10) || "",
        departmentId: data.departmentId || "",
        designationId: data.designationId || "",
        reportingManagerId: data.reportingManagerId || "",
        employeeCodeSuffix,
      }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    try {
      // Build a new employeeCode if suffix is provided, keeping the existing prefix
      let employeeCode: string | undefined;
      const rawSuffix = values.employeeCodeSuffix?.trim();
      if (rawSuffix && employeeCodePrefix) {
        const numeric = rawSuffix.replace(/\D/g, "");
        if (numeric) {
          // Preserve at least 3 digits, but allow longer suffixes without trimming
          const width = Math.max(3, numeric.length);
          employeeCode = `${employeeCodePrefix}${numeric.padStart(width, "0")}`;
        }
      }

      // Destructure employeeCodeSuffix to exclude it from the payload
      const { employeeCodeSuffix, ...restValues } = values;

      await updateMutation.mutateAsync({
        ...restValues,
        phone: restValues.phone || undefined,
        departmentId: restValues.departmentId || undefined,
        designationId: restValues.designationId || undefined,
        reportingManagerId: restValues.reportingManagerId || undefined,
        employmentType: restValues.employmentType || undefined,
        joiningDate: restValues.joiningDate || undefined,
        employeeCode: employeeCode || undefined,
      });
      toast.success("Employee updated");
    } catch (error: any) {
      const message = extractErrorMessage(error, "Unable to update employee");
      toast.error(message);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm("Delete this employee? This cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Employee deleted");
      router.push("/dashboard/admin/employees");
    } catch (error: any) {
      const message = extractErrorMessage(error, "Unable to delete employee");
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading employee...
      </div>
    );
  }

  if (!data || isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <p className="text-lg font-semibold">Employee not found</p>
        <Button asChild>
          <Link href="/dashboard/admin/employees">Back to employees</Link>
        </Button>
      </div>
    );
  }

  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
  const status = formatStatus(data.user?.status);


  return (
    <div className="container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.back()} variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="mr-1 size-4" />
                Back
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Admin · Employee</p>
            <h1 className="text-2xl font-semibold">{fullName || "Employee"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{data.employeeCode || "No code"}</Badge>
          <Badge variant={status === "Active" ? "default" : status === "On Leave" ? "secondary" : "outline"}>
            {status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Core employee and user details.</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ChangeWorkScheduleDialog
                    employeeId={id || ""}
                    currentScheduleId={data.workSchedule?.id}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Clock className="mr-2 size-4" />
                        Change Work Schedule
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/admin/employees/${id}/assign-leave`} className="flex items-center w-full">
                      <Calendar className="mr-2 size-4" />
                      Assign Leave
                    </Link>
                  </DropdownMenuItem>
                  <ChangePasswordDialog
                    userId={data.userId}
                    userName={fullName}
                    userEmail={data.user?.email || "unknown@company.com"}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Key className="mr-2 size-4" />
                        Change Password
                      </DropdownMenuItem>
                    }
                  />
                  <AssignManagerDialog
                    employeeId={id || ""}
                    employeeName={fullName}
                    currentManager={data.reportingManager}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <UserCog className="mr-2 size-4" />
                        {data.reportingManager ? "Change Manager" : "Assign Manager"}
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Info label="Email" value={data.user?.email} icon={<Mail className="size-4" />} />
            <Info label="Phone" value={data.phone} icon={<Phone className="size-4" />} />
            <Info label="Department" value={data.department?.name} />
            <Info label="Designation" value={data.designation?.title || data.designation?.name} />
            <Info label="Employment type" value={formatEmploymentType(data.employmentType)} />
            <Info label="Joining date" value={data.joiningDate?.slice(0, 10)} />
            <Info label="Manager" value={data.reportingManager ? `${data.reportingManager.firstName} ${data.reportingManager.lastName}` : undefined} />
            <Info label="Nationality" value={data.nationality} />
            <Info label="Work Schedule" value={data.workSchedule?.name || "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit basics</CardTitle>
            <CardDescription>Matches `PATCH /employees/:id` allowed fields.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Employee ID (prefix + editable suffix) */}
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      value={employeeCodePrefix || "—"}
                      disabled
                      readOnly
                      className="w-20 text-center font-mono"
                    />
                    <span className="text-muted-foreground">/</span>
                    <FormField
                      control={form.control}
                      name="employeeCodeSuffix"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Input
                              placeholder={employeeCodeSuffix || "001"}
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </>
                      )}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only the numeric part after the prefix is editable. Example:{" "}
                    <span className="font-mono">
                      {employeeCodePrefix || "EMP"}
                      001
                    </span>
                    .
                  </p>
                </FormItem>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employmentOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {formatEmploymentType(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joining date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || data?.departmentId || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || data?.designationId || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select designation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {designations?.map((des: any) => (
                            <SelectItem key={des.id} value={des.id}>
                              {des.title || des.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reportingManagerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reporting manager</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Manager name"
                          value={data?.reportingManager ? `${data.reportingManager.firstName} ${data.reportingManager.lastName}` : "No manager assigned"}
                          disabled
                          readOnly
                        />
                      </FormControl>
                      <input type="hidden" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={onDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {deleteMutation.isPending ? "Deleting..." : "Delete employee"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

      </div>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>Monthly summary of the employee's attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlySummaryCard year={new Date().getFullYear()} month={new Date().getMonth() + 1} userId={data.userId} />
        </CardContent>
      </Card>
      {subordinates && subordinates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Employees reporting to {fullName || "this manager"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subordinates.map((subordinate) => {
                  const subName = [subordinate.firstName, subordinate.lastName]
                    .filter(Boolean)
                    .join(" ");
                  const subStatus = formatStatus(subordinate.user?.status);
                  return (
                    <TableRow key={subordinate.id}>
                      <TableCell className="font-semibold">
                        <Link
                          href={`/dashboard/admin/employees/${subordinate.id}`}
                          className="hover:underline"
                        >
                          {subName}
                        </Link>
                      </TableCell>
                      <TableCell>{subordinate.user?.email || "—"}</TableCell>
                      <TableCell>{subordinate.designation?.title || subordinate.designation?.name || "—"}</TableCell>
                      <TableCell>{subordinate.department?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={subStatus === "Active" ? "default" : subStatus === "On Leave" ? "secondary" : "outline"}>
                          {subStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <EmployeeLeaveBalanceCard employeeId={id || ""} userId={data.userId} />

    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {value || "—"}
      </div>
    </div>
  );
}

