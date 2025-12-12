"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/lib/queries/users";
import { useParams } from "next/navigation";

export default function UserDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { data, isLoading, isError } = useUser(id || "");

  if (!id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Invalid user id
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading user...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-3">
        <p className="text-sm font-semibold">User not found</p>
        <Link href="/dashboard/admin/users" className="text-primary hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  const roles =
    data.roleAssignments?.map((r) => r.role.code).join(", ") ||
    data.roles?.join(", ") ||
    "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin/users" className="text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="mr-1 inline size-4" />
          Back
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Admin · Users</p>
          <h1 className="text-2xl font-semibold">{data.email}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User details</CardTitle>
          <CardDescription>From `/users/:id`.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info label="Email" value={data.email} />
          <Info label="Status" value={data.status || "UNKNOWN"} badge />
          <Info label="Roles" value={roles} />
          <Info label="Name" value={data.name || "—"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold">
        {badge ? <Badge>{value}</Badge> : value || "—"}
      </div>
    </div>
  );
}

