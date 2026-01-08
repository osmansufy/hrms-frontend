"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSession } from "@/components/auth/session-provider";
import { Button } from "@/components/ui/button";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEmployees, updatePersonalInfo, type ApiEmployee } from "@/lib/api/employees";
import { extractErrorMessage } from "@/lib/utils/error-handler";

const schema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().max(50).optional().or(z.literal("")),
  lastName: z.string().min(1, "Last name is required").max(50),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  maritalStatus: z.enum(["SINGLE", "MARRIED"]).optional(),
  bloodGroup: z.string().max(10).optional().or(z.literal("")),
  nationality: z.string().max(100).optional().or(z.literal("")),
  personalEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(3, "Phone number is required").max(20),
  alternatePhone: z.string().max(20).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function EditPersonalInfoPage() {
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: employee?.firstName || "",
      middleName: employee?.middleName || "",
      lastName: employee?.lastName || "",
      dateOfBirth: employee?.dateOfBirth
        ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: (employee?.gender as "MALE" | "FEMALE" | "OTHER") || "MALE",
      maritalStatus: (employee?.maritalStatus as "SINGLE" | "MARRIED" | undefined) || undefined,
      bloodGroup: employee?.bloodGroup || "",
      nationality: employee?.nationality || "",
      personalEmail: employee?.personalEmail || "",
      phone: employee?.phone || "",
      alternatePhone: employee?.alternatePhone || "",
    },
  });

  // Update form when employee data loads
  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName || "",
        middleName: employee.middleName || "",
        lastName: employee.lastName || "",
        dateOfBirth: employee.dateOfBirth
          ? new Date(employee.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: (employee.gender as "MALE" | "FEMALE" | "OTHER") || "MALE",
        maritalStatus: (employee.maritalStatus as "SINGLE" | "MARRIED" | undefined) || undefined,
        bloodGroup: employee.bloodGroup || "",
        nationality: employee.nationality || "",
        personalEmail: employee.personalEmail || "",
        phone: employee.phone || "",
        alternatePhone: employee.alternatePhone || "",
      });
    }
  }, [employee, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!employee?.id) {
        throw new Error("Employee not found");
      }
      return updatePersonalInfo(employee.id, {
        firstName: values.firstName,
        middleName: values.middleName || undefined,
        lastName: values.lastName,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        bloodGroup: values.bloodGroup || undefined,
        nationality: values.nationality || undefined,
        personalEmail: values.personalEmail || undefined,
        phone: values.phone,
        alternatePhone: values.alternatePhone || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Personal information updated successfully");
      queryClient.invalidateQueries({ queryKey: ["employees", "profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push("/dashboard/employee/profile");
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, "Unable to update personal information");
      toast.error(message);
    },
  });

  const onSubmit = async (values: FormValues) => {
    mutation.mutate(values);
  };

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <p className="text-lg font-semibold">Employee profile not found</p>
        <Button asChild>
          <Link href="/dashboard/employee/profile">Back to Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="px-2">
          <Link href="/dashboard/employee/profile">
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Employee · Profile</p>
          <h1 className="text-2xl font-semibold">Edit Personal Information</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
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
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Michael" {...field} value={field.value || ""} />
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
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                      <FormLabel>Date of Birth *</FormLabel>
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
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="MARRIED">Married</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <FormControl>
                        <Input placeholder="O+" {...field} value={field.value || ""} />
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
                        <Input placeholder="US" {...field} value={field.value || ""} />
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
                  name="alternatePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567891" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.personal@example.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/employee/profile")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
