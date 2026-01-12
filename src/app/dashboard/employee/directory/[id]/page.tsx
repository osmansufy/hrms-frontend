"use client";

import { ArrowLeft, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEmployee } from "@/lib/queries/employees";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, isLoading } = useEmployee(id || "");

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <p className="text-lg font-semibold">Employee not found</p>
        <Button asChild>
          <Link href="/directory">Back to directory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="px-2">
          <Link href="/directory">
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Employee</p>
          <h1 className="text-2xl font-semibold">{data.name}</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle>Profile</CardTitle>
            <CardDescription>Summary of employee information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Title" value={data.title} />
              <Info label="Department" value={data.department} />
              <Info label="Email" value={data.email} />
              <Info label="Manager" value={data.manager || "—"} />
              <Info label="Start date" value={data.startDate} />
              <Info label="Phone" value={data.phone || "—"} icon={<Phone className="size-4" />} />
            </div>
            <Badge
              variant={
                data.status === "Active"
                  ? "default"
                  : data.status === "On Leave"
                    ? "secondary"
                    : "outline"
              }
            >
              {data.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Summary</CardTitle>
            <CardDescription>Read-only employee snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Contact HR to request changes to your profile.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
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
