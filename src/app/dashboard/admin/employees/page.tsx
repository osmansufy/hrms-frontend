"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, UserCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmployees } from "@/lib/queries/employees";
import { AssignManagerDialog } from "@/components/assign-manager-dialog";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

export default function AdminEmployeesPage() {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");

  const { data, isLoading, isError } = useEmployees({
    search: search || undefined,
    departmentId: departmentId || undefined,
    designationId: designationId || undefined,
  });

  const employees = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">People Operations</p>
          <h1 className="text-2xl font-semibold">Employees</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/employees/create">
            <Plus className="mr-2 size-4" />
            Create employee
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, phone, email"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Input
              placeholder="Filter by departmentId"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            />
            <Input
              placeholder="Filter by designationId"
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
            />
          </div>
          <CardDescription>
            Mirrors backend filters: search (code/name/phone/email), departmentId, designationId.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading employees...
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-10 text-muted-foreground">
              <p className="text-sm font-medium">Unable to load employees.</p>
              <p className="text-xs">Check your connection or token, then retry.</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-10 text-muted-foreground">
              <p className="text-sm font-medium">No employees found</p>
              <p className="text-xs text-center">
                Try adjusting your search or filters, or create a new employee.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {emp.employeeCode || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{emp.name}</span>
                        <span className="text-xs text-muted-foreground">{emp.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.title}</TableCell>
                    <TableCell>
                      {emp.manager ? (
                        <span className="text-sm">{emp.manager}</span>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Not Assigned
                        </Badge>
                      )}
                    </TableCell>
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
                      <div className="flex items-center justify-end gap-2">
                        <ChangePasswordDialog
                          userId={emp.userId}
                          userName={emp.name}
                          userEmail={emp.email}
                        />
                        <AssignManagerDialog
                          employeeId={emp.id}
                          employeeName={emp.name}
                          currentManager={
                            emp.manager
                              ? {
                                id: emp.id,
                                firstName: emp.manager.split(" ")[0] || "",
                                lastName: emp.manager.split(" ")[1] || "",
                              }
                              : null
                          }
                        />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/employees/${emp.id}`}>View</Link>
                        </Button>
                      </div>
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

