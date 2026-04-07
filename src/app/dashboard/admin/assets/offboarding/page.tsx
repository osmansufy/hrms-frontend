"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, UserMinus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useEmployees } from "@/lib/queries/employees";
import { useAssignments, useReturnAllAssetsByEmployee } from "@/lib/queries/asset";
import { toast } from "sonner";
import { formatDateInDhaka } from "@/lib/utils";

export default function AssetOffboardingPage() {
  const [employeeId, setEmployeeId] = useState<string>("__none__");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: employees } = useEmployees({});
  const { data: assignmentsData } = useAssignments({
    employeeId: employeeId && employeeId !== "__none__" ? employeeId : undefined,
    isActive: true,
    pageSize: 100,
  });

  const returnAll = useReturnAllAssetsByEmployee();
  const employeeList = employees ?? [];
  const assignments = assignmentsData?.data ?? [];
  const selectedEmployee = employeeList.find((e) => e.id === employeeId);

  const handleReturnAll = async () => {
    if (!employeeId || employeeId === "__none__") {
      toast.error("Please select an employee");
      return;
    }
    try {
      const result = await returnAll.mutateAsync(employeeId);
      toast.success(result.message ?? `Returned ${result.returnedCount} asset(s)`);
      setConfirmOpen(false);
      setEmployeeId("__none__");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to return assets");
    }
  };

  return (
    <div className="container space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Inventory
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Asset Offboarding
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Return all assets assigned to an employee (e.g. when they leave)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/assets">
            <Button variant="outline" size="sm">
              Assets
            </Button>
          </Link>
          <Link href="/dashboard/admin/assets/requests">
            <Button variant="outline" size="sm">
              Requests
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserMinus className="size-4" />
            Return all assets by employee
          </CardTitle>
          <CardDescription>
            Select an employee to mark all their currently assigned assets as returned. Use this as part of the exit checklist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-md">
            <label className="text-sm font-medium">Employee</label>
            <Select
              value={employeeId}
              onValueChange={setEmployeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select employee</SelectItem>
                {employeeList.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                    {emp.employeeCode ? ` (${emp.employeeCode})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {employeeId && employeeId !== "__none__" && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Current assignments</h3>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 rounded-md border bg-muted/30">
                    No active asset assignments for this employee.
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset tag</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Assigned at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {a.asset?.assetTag ?? "—"}
                            </TableCell>
                            <TableCell>
                              {a.asset?.assetType?.name ?? "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDateInDhaka(a.assignedAt, "short")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Button
                variant="default"
                onClick={() => setConfirmOpen(true)}
                disabled={assignments.length === 0 || returnAll.isPending}
              >
                <Package className="mr-2 size-4" />
                Return all assets for this employee
                {assignments.length > 0 && ` (${assignments.length})`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return all assets?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all {assignments.length} assigned asset(s) for{" "}
              <strong>{selectedEmployee?.name ?? "this employee"}</strong> as
              returned. Assets will become available for reassignment. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReturnAll();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {returnAll.isPending ? "Returning…" : "Return all assets"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
