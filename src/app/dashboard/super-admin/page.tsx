"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Shield, Mail, Lock, User, Building, Briefcase, Code, Loader2, RefreshCw } from "lucide-react";
import { useUsers, useCreateUser, useToggleUserStatus, useDeleteUser, useUpdateUserRole } from "@/lib/queries/users";
import { useDepartments } from "@/lib/queries/departments";
import { useDesignations } from "@/lib/queries/employees";

export default function SuperAdminDashboard() {
  const { data: users, isLoading } = useUsers();
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const createUserMutation = useCreateUser();
  const toggleStatusMutation = useToggleUserStatus();
  const deleteUserMutation = useDeleteUser();
  const updateRoleMutation = useUpdateUserRole();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ isOpen: boolean; userId: string; currentRole: string }>({
    isOpen: false,
    userId: "",
    currentRole: "",
  });
  const [newRole, setNewRole] = useState<"ADMIN" | "HR_MANAGER">("ADMIN");
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "ADMIN" as "ADMIN" | "HR_MANAGER",
    firstName: "",
    lastName: "",
    employeeCode: "",
    departmentId: "",
    designationId: "",
  });

  const handleRoleChange = async () => {
    await updateRoleMutation.mutateAsync({
      id: roleChangeDialog.userId,
      role: newRole,
    });
    setRoleChangeDialog({ isOpen: false, userId: "", currentRole: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      return;
    }

    await createUserMutation.mutateAsync(form);
    setIsDialogOpen(false);
    setForm({
      email: "",
      password: "",
      role: "ADMIN",
      firstName: "",
      lastName: "",
      employeeCode: "",
      departmentId: "",
      designationId: "",
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      SUPER_ADMIN: "default",
      ADMIN: "secondary",
      HR_MANAGER: "outline",
      EMPLOYEE: "outline",
    };

    return (
      <Badge variant={variants[role] || "outline"}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  const stats = {
    total: users?.length || 0,
    admins: users?.filter(u => u.role === "ADMIN").length || 0,
    hrManagers: users?.filter(u => u.role === "HR_MANAGER").length || 0,
    active: users?.filter(u => u.isActive).length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage administrative users and system access</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HR Managers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hrManagers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage administrative and HR user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No users found</TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.employee?.firstName} {user.employee?.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.employee?.department?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.role !== "SUPER_ADMIN" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRoleChangeDialog({
                                    isOpen: true,
                                    userId: user.id,
                                    currentRole: user.role,
                                  });
                                  setNewRole(user.role === "ADMIN" ? "HR_MANAGER" : "ADMIN");
                                }}
                                disabled={updateRoleMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Change Role
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleStatusMutation.mutate({
                                    id: user.id,
                                    isActive: user.isActive,
                                  })
                                }
                                disabled={toggleStatusMutation.isPending}
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this user?")) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new Admin or HR Manager user account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    <User className="inline mr-2 h-4 w-4" />
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline mr-2 h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="inline mr-2 h-4 w-4" />
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">
                  <Shield className="inline mr-2 h-4 w-4" />
                  Role *
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(value: "ADMIN" | "HR_MANAGER") =>
                    setForm({ ...form, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCode">
                  <Code className="inline mr-2 h-4 w-4" />
                  Employee Code
                </Label>
                <Input
                  id="employeeCode"
                  value={form.employeeCode}
                  onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">
                    <Building className="inline mr-2 h-4 w-4" />
                    Department
                  </Label>
                  <Select
                    value={form.departmentId}
                    onValueChange={(value) => setForm({ ...form, departmentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">
                    <Briefcase className="inline mr-2 h-4 w-4" />
                    Designation
                  </Label>
                  <Select
                    value={form.designationId}
                    onValueChange={(value) => setForm({ ...form, designationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {designations?.map((desig) => (
                        <SelectItem key={desig.id} value={desig.id}>
                          {desig.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleChangeDialog.isOpen} onOpenChange={(open) => setRoleChangeDialog({ ...roleChangeDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for this user. This will change their permissions immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role">
                <Shield className="inline mr-2 h-4 w-4" />
                New Role
              </Label>
              <Select
                value={newRole}
                onValueChange={(value: "ADMIN" | "HR_MANAGER") => setNewRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Current role: <Badge variant="secondary">{roleChangeDialog.currentRole?.replace("_", " ")}</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleChangeDialog({ isOpen: false, userId: "", currentRole: "" })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
