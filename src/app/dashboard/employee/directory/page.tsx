"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEmployees } from "@/lib/queries/employees";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useEmployees(search ? { search } : undefined);

  const employees = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">People</p>
          <h1 className="text-2xl font-semibold">Employee directory</h1>
        </div>
        <Button asChild>
          <Link href="/settings">Add employee (stub)</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, department"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Badge variant="secondary">{employees.length} people</Badge>
          </div>
          <CardDescription>
            Backed by mocked data and React Query — ready to swap to OpenAPI client when available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading directory...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-semibold">{emp.name}</TableCell>
                    <TableCell>{emp.title}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          emp.status === "Active"
                            ? "default"
                            : emp.status === "On Leave"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/employee/directory/${emp.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
