"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  email: z.string().email(),
  notifications: z.object({
    approvals: z.boolean(),
    alerts: z.boolean(),
    digest: z.boolean(),
  }),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "HR Manager",
      role: "People Operations",
      email: "hr@acme.com",
      notifications: {
        approvals: true,
        alerts: true,
        digest: false,
      },
    },
  });

  const onSubmit = (values: FormValues) => {
    console.info("Settings submitted", values);
    toast.success("Settings saved (mock)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Workspace</p>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
        <Badge variant="secondary">Mock only</Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Basic details used across the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Control alerts and approvals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                label="Approval requests"
                description="Time off, attendance, and onboarding approvals."
                control={form.control}
                name="notifications.approvals"
              />
              <Separator />
              <ToggleRow
                label="Alerts"
                description="High-priority alerts for compliance and payroll."
                control={form.control}
                name="notifications.alerts"
              />
              <Separator />
              <ToggleRow
                label="Weekly digest"
                description="Summary of changes and upcoming anniversaries."
                control={form.control}
                name="notifications.digest"
              />
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex items-center justify-end gap-2">
            <Button type="submit">
              <Save className="mr-2 size-4" />
              Save changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  control: Control<FormValues>;
  name: `notifications.${"approvals" | "alerts" | "digest"}`;
};

function ToggleRow({ label, description, control, name }: ToggleRowProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <FormLabel>{label}</FormLabel>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
