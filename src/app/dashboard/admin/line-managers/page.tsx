"use client";

import { useState } from "react";
import { Users, Building2, UserCog, Search } from "lucide-react";
import Link from "next/link";

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
import { Badge } from "@/components/ui/badge";
import { useEmployees } from "@/lib/queries/employees";
import { AssignManagerDialog } from "@/components/assign-manager-dialog";

export default function LineManagerManagementPage() {
    const [search, setSearch] = useState("");
    const { data: employees = [], isLoading } = useEmployees({ search });

    const employeesWithoutManager = employees.filter((emp) => !emp.manager);
    const employeesWithManager = employees.filter((emp) => emp.manager);

    const displayedEmployees = search
        ? employees
        : [...employeesWithoutManager, ...employeesWithManager];

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">Admin · Management</p>
                <h1 className="text-3xl font-bold">Line Manager Assignment</h1>
                <p className="mt-2 text-muted-foreground">
                    Manage reporting relationships across your organization
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Employees
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employees.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all departments
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            With Manager
                        </CardTitle>
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employeesWithManager.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {employees.length > 0
                                ? `${Math.round((employeesWithManager.length / employees.length) * 100)}% of total`
                                : "0% of total"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Without Manager
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {employeesWithoutManager.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Requires assignment
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Manager Assignments</CardTitle>
                    <CardDescription>
                        View and manage reporting relationships for all employees
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-12 text-center text-muted-foreground">
                            Loading employees...
                        </div>
                    ) : displayedEmployees.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            No employees found
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Reporting Manager</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{employee.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {employee.email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {employee.employeeCode || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{employee.department}</TableCell>
                                            <TableCell>{employee.title}</TableCell>
                                            <TableCell>
                                                {employee.manager ? (
                                                    <span className="text-sm">{employee.manager}</span>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Not Assigned
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        employee.status === "Active"
                                                            ? "default"
                                                            : employee.status === "On Leave"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {employee.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <AssignManagerDialog
                                                        employeeId={employee.id}
                                                        employeeName={employee.name}
                                                        currentManager={
                                                            employee.manager
                                                                ? {
                                                                    id: employee.id, // This would need the actual manager ID from the API
                                                                    firstName: employee.manager.split(" ")[0],
                                                                    lastName: employee.manager.split(" ")[1] || "",
                                                                }
                                                                : null
                                                        }
                                                    />
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/dashboard/admin/employees/${employee.id}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
