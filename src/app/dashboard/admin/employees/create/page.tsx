// @ts-nocheck
"use client";
import { useWorkSchedules } from "@/lib/queries/work-schedules";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/utils/error-handler";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateEmployee, useDepartments, useDesignations, useManagers } from "@/lib/queries/employees";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z.string().min(3),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY", "CONSULTANT"]),
  joiningDate: z.string().min(1),
  personalEmail: z.string().email().optional().or(z.literal("")),
  middleName: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  confirmationDate: z.string().optional(),
  probationPeriod: z.coerce.number().min(0).optional(),
  noticePeriod: z.coerce.number().min(0).optional(),
  nationality: z.string().optional(),
  profilePicture: z.string().url().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateEmployeePage() {
  const router = useRouter();
  const mutation = useCreateEmployee();
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { data: designations, isLoading: loadingDesignations } = useDesignations();
  const [managerSearch, setManagerSearch] = useState("");
  const { data: managers, isFetching: loadingManagers } = useManagers(managerSearch);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "MALE",
      employmentType: "FULL_TIME",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      personalEmail: values.personalEmail || undefined,
      departmentId: values.departmentId || undefined,
      designationId: values.designationId || undefined,
      reportingManagerId: values.reportingManagerId || undefined,
      confirmationDate: values.confirmationDate || undefined,
      profilePicture: values.profilePicture || undefined,
      notes: values.notes || undefined,
    };

    try {
      const created = await mutation.mutateAsync(payload);
      toast.success("Employee created. Now assign leave balances.");
      router.push(`/dashboard/admin/employees/${created.id}/assign-leave`);
    } catch (error: any) {
      const message = extractErrorMessage(error, "Unable to create employee");
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="px-2">
          <Link href="/dashboard/admin/employees">
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Admin · Employees</p>
          <h1 className="text-2xl font-semibold">Create employee</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New employee</CardTitle>
          <CardDescription>
            Matches backend `POST /employees` schema: user account + employee profile in one request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="workScheduleId"
                  render={({ field }) => {
                    const { data: workSchedules, isLoading: loadingSchedules } = useWorkSchedules();
                    return (
                      <FormItem>
                        <FormLabel>Work Schedule</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingSchedules ? "Loading..." : "Select work schedule"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingSchedules && (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            )}
                            {workSchedules?.map((ws) => (
                              <SelectItem key={ws.id} value={ws.id}>
                                {ws.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
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
                      <FormLabel>Last name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                      <FormLabel>Middle name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
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
                      <FormLabel>Employment type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERN">Intern</SelectItem>
                          <SelectItem value="TEMPORARY">Temporary</SelectItem>
                          <SelectItem value="CONSULTANT">Consultant</SelectItem>
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
                      <FormLabel>Joining date *</FormLabel>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select department"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingDepartments && (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name} {dept.code ? `(${dept.code})` : ""}
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingDesignations ? "Loading..." : "Select designation"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingDesignations && (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                          )}
                          {designations?.map((des) => (
                            <SelectItem key={des.id} value={des.id}>
                              {des.title || des.name || des.code || des.id}
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
                      <FormLabel>Reporting manager (Team Lead/Dept Head)</FormLabel>
                      <div className="flex flex-col gap-2">
                        <Input
                          placeholder="Search manager by name/code/email"
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                        />
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingManagers ? "Searching..." : "Select manager"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingManagers && (
                              <SelectItem value="loading" disabled>
                                <Loader2 className="mr-2 inline size-4 animate-spin" />
                                Searching...
                              </SelectItem>
                            )}
                            {managers?.map((mgr) => (
                              <SelectItem key={mgr.id} value={mgr.id}>
                                {mgr.name} {mgr.employeeCode ? `(${mgr.employeeCode})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="personalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal email</FormLabel>
                      <FormControl>
                        <Input placeholder="Personal contact (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input placeholder="Country code or name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="probationPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probation period (months)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="e.g., 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noticePeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notice period (days)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="e.g., 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profilePicture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile picture URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/photo.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Additional notes about employee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create employee"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

