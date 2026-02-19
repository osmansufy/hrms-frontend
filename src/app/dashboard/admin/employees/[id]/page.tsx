"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Key, 
  Mail, 
  MoreVertical, 
  Phone, 
  Smartphone,
  Trash2, 
  UserCog,
  User,
  Briefcase,
  MapPin,
  Edit2,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect, useState } from "react";

import { AssignManagerDialog } from "@/components/assign-manager-dialog";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { ChangeWorkScheduleDialog } from "@/components/change-work-schedule-dialog";
import { UserMetaDialog } from "@/components/user-meta-dialog";
import { EmployeeLeaveBalanceCard } from "@/components/employee-leave-balance-card";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDepartments } from "@/lib/queries/departments";
import { useDesignationsList } from "@/lib/queries/designations";
import { useDeleteEmployee, useEmployeeDetail, useManagerSubordinates, useUpdateEmployee } from "@/lib/queries/employees";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import { MonthlySummaryCard } from "../../attendance/components/monthly-summary-card";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY", "CONSULTANT"])
    .optional(),
  joiningDate: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
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
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showUserMetaDialog, setShowUserMetaDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data, isLoading, isError } = useEmployeeDetail(id || "");
  const updateMutation = useUpdateEmployee(id || "");
  const deleteMutation = useDeleteEmployee();
  const { data: subordinates = [] } = useManagerSubordinates(id);
  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignationsList();

  const existingCode = data?.employeeCode || "";
  const codeMatch = existingCode.match(/^([A-Za-z]+)(\d+)$/);
  const employeeCodePrefix = codeMatch?.[1] || "";
  const employeeCodeSuffix = codeMatch?.[2] || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: data?.firstName || "",
      middleName: data?.middleName || "",
      lastName: data?.lastName || "",
      email: data?.user?.email || "",
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
        firstName: data.firstName || "",
        middleName: data.middleName || "",
        lastName: data.lastName || "",
        email: data.user?.email || "",
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

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty && isEditMode) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty, isEditMode]);

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    try {
      let employeeCode: string | undefined;
      const rawSuffix = values.employeeCodeSuffix?.trim();
      if (rawSuffix && employeeCodePrefix) {
        const numeric = rawSuffix.replace(/\D/g, "");
        if (numeric) {
          const width = Math.max(3, numeric.length);
          employeeCode = `${employeeCodePrefix}${numeric.padStart(width, "0")}`;
        }
      }

      const { employeeCodeSuffix, ...restValues } = values;

      await updateMutation.mutateAsync({
        ...restValues,
        firstName: restValues.firstName || undefined,
        middleName: restValues.middleName || undefined,
        lastName: restValues.lastName || undefined,
        email: restValues.email || undefined,
        phone: restValues.phone || undefined,
        departmentId: restValues.departmentId || undefined,
        designationId: restValues.designationId || undefined,
        reportingManagerId: restValues.reportingManagerId || undefined,
        employmentType: restValues.employmentType || undefined,
        joiningDate: restValues.joiningDate || undefined,
        employeeCode: employeeCode || undefined,
      });
      toast.success("Employee updated successfully");
      setIsEditMode(false);
      form.reset(values);
    } catch (error: any) {
      const message = extractErrorMessage(error, "Unable to update employee");
      toast.error(message);
    }
  };

  const onDelete = async () => {
    if (!id) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Employee deleted successfully");
      router.push("/dashboard/admin/employees");
    } catch (error: any) {
      const message = extractErrorMessage(error, "Unable to delete employee");
      toast.error(message);
    }
  };

  const handleCancelEdit = () => {
    if (form.formState.isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirmed) return;
    }
    form.reset();
    setIsEditMode(false);
  };

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    const currentDate = new Date();
    const isCurrentMonth = month === currentDate.getMonth() + 1 && year === currentDate.getFullYear();
    
    if (isCurrentMonth) return;

    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();
  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

  if (isLoading) {
    return (
      <div className="container space-y-6 animate-in fade-in-50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
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
    <div className="container space-y-6 pb-8">
      {/* Header with Profile */}
      <div className="flex flex-col gap-6">
        <Button 
          onClick={() => router.back()} 
          variant="ghost" 
          size="sm" 
          className="w-fit px-2"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Employees
        </Button>

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <ProfilePictureUpload
              employeeId={id || ""}
              currentPicture={data.profilePicture}
              employeeName={fullName}
              employeeInitials={`${data.firstName?.[0] || ""}${data.lastName?.[0] || ""}`}
            />
            <div className="space-y-2">
              <div>
                <h1 className="text-3xl font-bold">{fullName}</h1>
                <p className="text-muted-foreground">
                  {data.designation?.title || data.designation?.name || "Employee"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={status === "Active" ? "default" : status === "On Leave" ? "secondary" : "outline"}>
                  {status}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {data.employeeCode || "No code"}
                </Badge>
                <Badge variant="secondary">
                  {formatEmploymentType(data.employmentType)}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="mr-2 size-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => {
                setIsEditMode(true);
                setActiveTab("personal");
              }}>
                <Edit2 className="mr-2 size-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
              <DropdownMenuItem onClick={() => setShowUserMetaDialog(true)}>
                <Smartphone className="mr-2 size-4" />
                Access settings (mobile sign-in)
              </DropdownMenuItem>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete Employee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal & Employment</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          {subordinates && subordinates.length > 0 && (
            <TabsTrigger value="team">Team</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickStatCard
              label="Department"
              value={data.department?.name || "Not assigned"}
              icon={<Briefcase className="size-4" />}
            />
            <QuickStatCard
              label="Designation"
              value={data.designation?.title || data.designation?.name || "Not assigned"}
              icon={<User className="size-4" />}
            />
            <QuickStatCard
              label="Manager"
              value={data.reportingManager ? `${data.reportingManager.firstName} ${data.reportingManager.lastName}` : "None"}
              icon={<UserCog className="size-4" />}
            />
            <QuickStatCard
              label="Work Schedule"
              value={data.workSchedule?.name || "Default"}
              icon={<Clock className="size-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="size-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Email" value={data.user?.email} icon={<Mail className="size-4" />} />
                <InfoRow label="Phone" value={data.phone} icon={<Phone className="size-4" />} />
                <InfoRow label="Personal Email" value={data.personalEmail} icon={<Mail className="size-4" />} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="size-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Employee Code" value={data.employeeCode} />
                <InfoRow label="Employment Type" value={formatEmploymentType(data.employmentType)} />
                <InfoRow label="Joining Date" value={data.joiningDate?.slice(0, 10)} icon={<Calendar className="size-4" />} />
                <InfoRow label="Status" value={status} />
              </CardContent>
            </Card>
          </div>

          <EmployeeLeaveBalanceCard employeeId={id || ""} userId={data.userId} />
        </TabsContent>

        {/* Personal & Employment Tab */}
        <TabsContent value="personal" className="space-y-6">
          {isEditMode ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Edit Employee Information</CardTitle>
                    <CardDescription>Update employee details and employment information</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="mr-2 size-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={updateMutation.isPending || !form.formState.isDirty}
                    >
                      <Save className="mr-2 size-4" />
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="size-5" />
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                      </div>
                      <Separator />
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                First Name {form.formState.dirtyFields.firstName && <span className="text-xs text-orange-500">(modified)</span>}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="middleName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Middle Name {form.formState.dirtyFields.middleName && <span className="text-xs text-orange-500">(modified)</span>}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Optional" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Last Name {form.formState.dirtyFields.lastName && <span className="text-xs text-orange-500">(modified)</span>}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Email {form.formState.dirtyFields.email && <span className="text-xs text-orange-500">(modified)</span>}
                              </FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john.doe@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Phone {form.formState.dirtyFields.phone && <span className="text-xs text-orange-500">(modified)</span>}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Employment Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-5" />
                        <h3 className="text-lg font-semibold">Employment Details</h3>
                      </div>
                      <Separator />
                      <div className="grid gap-4 md:grid-cols-2">
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
                          <FormDescription>
                            Only the numeric part is editable
                          </FormDescription>
                        </FormItem>

                        <FormField
                          control={form.control}
                          name="employmentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employment Type</FormLabel>
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
                              <FormLabel>Joining Date</FormLabel>
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
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="size-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Employee personal details</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Edit2 className="mr-2 size-4" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Full Name" value={fullName} />
                  <InfoRow label="First Name" value={data.firstName} />
                  <InfoRow label="Middle Name" value={data.middleName} />
                  <InfoRow label="Last Name" value={data.lastName} />
                  <Separator />
                  <InfoRow label="Email" value={data.user?.email} icon={<Mail className="size-4" />} />
                  <InfoRow label="Phone" value={data.phone} icon={<Phone className="size-4" />} />
                  <InfoRow label="Personal Email" value={data.personalEmail} />
                  <InfoRow label="Alternate Phone" value={data.alternatePhone} />
                  <Separator />
                  <InfoRow label="Date of Birth" value={data.dateOfBirth?.slice(0, 10)} />
                  <InfoRow label="Gender" value={data.gender} />
                  <InfoRow label="Marital Status" value={data.maritalStatus} />
                  <InfoRow label="Blood Group" value={data.bloodGroup} />
                  <InfoRow label="Nationality" value={data.nationality} icon={<MapPin className="size-4" />} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="size-5" />
                    Employment Information
                  </CardTitle>
                  <CardDescription>Job details and organizational structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow label="Employee Code" value={data.employeeCode} />
                  <InfoRow label="Employment Type" value={formatEmploymentType(data.employmentType)} />
                  <InfoRow label="Joining Date" value={data.joiningDate?.slice(0, 10)} icon={<Calendar className="size-4" />} />
                  <InfoRow label="Confirmation Date" value={data.confirmationDate?.slice(0, 10)} />
                  <Separator />
                  <InfoRow label="Department" value={data.department?.name} />
                  <InfoRow label="Designation" value={data.designation?.title || data.designation?.name} />
                  <InfoRow 
                    label="Reporting Manager" 
                    value={data.reportingManager ? `${data.reportingManager.firstName} ${data.reportingManager.lastName}` : undefined}
                    link={data.reportingManager?.id ? `/dashboard/admin/employees/${data.reportingManager.id}` : undefined}
                  />
                  <Separator />
                  <InfoRow label="Work Schedule" value={data.workSchedule?.name} />
                  <InfoRow label="Probation Period" value={data.probationPeriod ? `${data.probationPeriod} months` : undefined} />
                  <InfoRow label="Notice Period" value={data.noticePeriod ? `${data.noticePeriod} days` : undefined} />
                  <InfoRow label="Status" value={status} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Attendance Summary</CardTitle>
                  <CardDescription>View attendance summary for any month</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="size-4" />
                    <span className="sr-only">Previous month</span>
                  </Button>
                  <div className="flex items-center gap-2 min-w-[160px] justify-center">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {monthName} {year}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                    disabled={isCurrentMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="size-4" />
                    <span className="sr-only">Next month</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlySummaryCard year={year} month={month} userId={data.userId} />
            </CardContent>
          </Card>

          <EmployeeLeaveBalanceCard employeeId={id || ""} userId={data.userId} />
        </TabsContent>

        {/* Team Tab */}
        {subordinates && subordinates.length > 0 && (
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {subordinates.length} {subordinates.length === 1 ? 'employee' : 'employees'} reporting to {fullName}
                </CardDescription>
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
          </TabsContent>
        )}
      </Tabs>

      {/* User meta (access settings) dialog */}
      <UserMetaDialog
        userId={data.userId}
        userName={fullName}
        open={showUserMetaDialog}
        onOpenChange={setShowUserMetaDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Delete Employee
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This action cannot be undone. This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Employee profile and personal information</li>
                <li>All attendance records</li>
                <li>Leave history and balances</li>
                <li>All associated data</li>
              </ul>
              <div className="pt-4">
                <p className="font-semibold mb-2">
                  Type <span className="font-mono text-destructive">{fullName}</span> to confirm:
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type employee name"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={deleteConfirmText !== fullName || deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper Components
function QuickStatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  icon,
  link,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
  link?: string;
}) {
  const content = (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{value || "—"}</span>
      </div>
    </div>
  );

  if (link && value) {
    return (
      <Link href={link} className="hover:bg-accent rounded-md px-2 -mx-2 transition-colors">
        {content}
      </Link>
    );
  }

  return <div className="px-2 -mx-2">{content}</div>;
}
