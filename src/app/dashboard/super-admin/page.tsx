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
import { Users, UserPlus, Shield, Mail, Lock, User, Building, Briefcase, Code, Loader2, RefreshCw, Filter, X, Database, Download, AlertCircle, Trash2, FileDown, Smartphone } from "lucide-react";
import { UserMetaDialog } from "@/components/user-meta-dialog";
import { useUsers, useCreateUser, useToggleUserStatus, useDeleteUser, useUpdateUserRole } from "@/lib/queries/users";
import { useDepartments } from "@/lib/queries/departments";
import { useDesignations } from "@/lib/queries/employees";
import { useBackupStatus, useTriggerBackup, useListBackups, useDeleteBackup, useDownloadBackup, useRestoreBackup } from "@/lib/queries/backup";

export default function SuperAdminDashboard() {
  const { data: users, isLoading } = useUsers();
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const createUserMutation = useCreateUser();
  const toggleStatusMutation = useToggleUserStatus();
  const deleteUserMutation = useDeleteUser();
  const updateRoleMutation = useUpdateUserRole();
  
  // Backup queries
  const { data: backupStatus, isLoading: isBackupLoading, refetch: refetchBackupStatus } = useBackupStatus();
  const { data: backups, isLoading: isBackupsLoading, refetch: refetchBackups } = useListBackups();
  const triggerBackupMutation = useTriggerBackup();
  const deleteBackupMutation = useDeleteBackup();
  const downloadBackupMutation = useDownloadBackup();
  const restoreBackupMutation = useRestoreBackup();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ isOpen: boolean; userId: string; currentRole: string }>({
    isOpen: false,
    userId: "",
    currentRole: "",
  });
  const [metaDialogUser, setMetaDialogUser] = useState<{ id: string; name: string } | null>(null);
  const [newRole, setNewRole] = useState<"ADMIN" | "HR_MANAGER" | "EMPLOYEE">("ADMIN");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format file size
  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  // Filter users by role
  const filteredUsers = users?.filter((user) => {
    if (roleFilter === "ALL") return true;
    return user.role === roleFilter;
  }) || [];

  return (
    <div className="container space-y-6">
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

      {/* Database Backup Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Backup
              </CardTitle>
              <CardDescription>
                Manage database backups and view backup history. Creating backups may take several minutes for large databases.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetchBackupStatus()}
                disabled={isBackupLoading}
              >
                {isBackupLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                onClick={() => triggerBackupMutation.mutate()}
                disabled={triggerBackupMutation.isPending}
              >
                {triggerBackupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {triggerBackupMutation.isPending && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Creating database backup...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    This process may take several minutes depending on database size. Please do not close this page.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!backupStatus ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Click "Refresh" to view backup status</p>
              <Button variant="outline" onClick={() => refetchBackupStatus()} disabled={isBackupLoading}>
                {isBackupLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Load Backup Status
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={backupStatus.enabled ? "default" : "secondary"}>
                    {backupStatus.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                  <p className="text-2xl font-bold">{backupStatus.backupCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold">{backupStatus.totalSizeMB} MB</p>
                </div>
              </div>

              {backupStatus.latestBackup ? (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Latest Backup
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Filename:</span>
                      <span className="font-mono text-xs">{backupStatus.latestBackup.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(backupStatus.latestBackup.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatSize(backupStatus.latestBackup.size)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No backups found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Retention: {backupStatus.retentionDays} days
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Automated Backups (Production Only)</p>
                  <p className="text-muted-foreground text-xs">
                    • Daily backup at 3:00 AM<br />
                    • Automatic cleanup after {backupStatus.retentionDays} days<br />
                    • Backups stored in Cloudflare R2
                  </p>
                </div>
              </div>

              {/* Backup Files List */}
              <div className="border rounded-lg">
                <div className="p-4 border-b flex items-center justify-between">
                  <h4 className="font-medium">All Backups</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchBackups()}
                    disabled={isBackupsLoading}
                  >
                    {isBackupsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {isBackupsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !backups || backups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No backups found
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="w-[220px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backups.map((backup) => (
                          <TableRow key={backup.filename}>
                            <TableCell className="font-mono text-xs">
                              {backup.filename}
                            </TableCell>
                            <TableCell>
                              {formatDate(backup.date)}
                            </TableCell>
                            <TableCell>
                              {backup.sizeMB} MB
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadBackupMutation.mutate(backup.filename)}
                                  disabled={downloadBackupMutation.isPending}
                                  className="h-8 text-xs"
                                  title="Download backup to your computer"
                                >
                                  {downloadBackupMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <FileDown className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `⚠️ WARNING: This will OVERWRITE your entire database!\n\nAre you sure you want to restore from:\n${backup.filename}?\n\nThis action cannot be undone. Make sure you have a current backup before proceeding.`
                                      ) &&
                                      confirm(
                                        `Final confirmation: You are about to REPLACE ALL DATA in your database.\n\nType "RESTORE" in your mind and click OK to proceed.`
                                      )
                                    ) {
                                      restoreBackupMutation.mutate(backup.filename);
                                    }
                                  }}
                                  disabled={restoreBackupMutation.isPending || triggerBackupMutation.isPending}
                                  className="h-8 text-xs"
                                  title="Restore database from this backup (DANGEROUS)"
                                >
                                  {restoreBackupMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Restore"
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${backup.filename}?`)) {
                                      deleteBackupMutation.mutate(backup.filename);
                                    }
                                  }}
                                  disabled={deleteBackupMutation.isPending}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Delete this backup"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage administrative and HR user accounts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                </SelectContent>
              </Select>
              {roleFilter !== "ALL" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRoleFilter("ALL")}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No users found{roleFilter !== "ALL" ? ` with role ${roleFilter.replace("_", " ")}` : ""}</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
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
                                onClick={() =>
                                  setMetaDialogUser({
                                    id: user.id,
                                    name: [user.employee?.firstName, user.employee?.lastName].filter(Boolean).join(" ") || user.email,
                                  })
                                }
                                title="Access settings (e.g. allow mobile sign-in)"
                              >
                                <Smartphone className="h-4 w-4 mr-1" />
                                Access
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRoleChangeDialog({
                                    isOpen: true,
                                    userId: user.id,
                                    currentRole: user.role,
                                  });
                                  // Set default to first available role that's not the current one
                                  if (user.role === "ADMIN") {
                                    setNewRole("HR_MANAGER");
                                  } else if (user.role === "HR_MANAGER") {
                                    setNewRole("ADMIN");
                                  } else {
                                    setNewRole("ADMIN");
                                  }
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

      {/* User meta (access settings) dialog */}
      {metaDialogUser && (
        <UserMetaDialog
          userId={metaDialogUser.id}
          userName={metaDialogUser.name}
          open={true}
          onOpenChange={(open) => !open && setMetaDialogUser(null)}
        />
      )}

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
                onValueChange={(value: "ADMIN" | "HR_MANAGER" | "EMPLOYEE") => setNewRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
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
