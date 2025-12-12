"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsers } from "@/lib/queries/users";

export default function UsersPage() {
  const { data, isLoading, isError } = useUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Admin · Users</p>
          <h1 className="text-2xl font-semibold">Users</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>All users</CardTitle>
            <CardDescription>Fetched from `/users`.</CardDescription>
          </div>
          {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Unable to load users. Check token or permissions.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold">
                      <Link href={`/dashboard/admin/users/${user.id}`} className="hover:underline">
                        {user.email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                        {user.status || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(user.roleAssignments || []).map((ra) => ra.role.code).join(", ") ||
                        (user.roles || []).join(", ") ||
                        "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

