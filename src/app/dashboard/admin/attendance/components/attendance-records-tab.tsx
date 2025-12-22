"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Edit, ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { useAttendanceRecords, useUpdateAttendanceRecord } from "@/lib/queries/attendance";
import { useDepartments } from "@/lib/queries/departments";
import { useEmployees } from "@/lib/queries/employees";
import { toStartOfDayISO, toEndOfDayISO } from "@/lib/utils";
import { useDateRangePresets, DATE_RANGE_PRESETS } from "@/hooks/useDateRangePresets";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ExtendedAttendanceRecord } from "@/lib/api/attendance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AttendanceRecordsTab() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState<string>("all");
    const [employeeId, setEmployeeId] = useState<string>("all");
    const [isLate, setIsLate] = useState<boolean | undefined>(undefined);

    // Use date range presets hook
    const { preset, dateRange, setPreset, setCustomRange } = useDateRangePresets("today");

    const { data: departments } = useDepartments();
    const { data: employees } = useEmployees();

    // Convert date range to ISO DateTime with user's timezone
    const queryParams = useMemo(() => ({
        page,
        limit: 10,
        search,
        departmentId: departmentId === "all" ? undefined : departmentId,
        userId: employeeId === "all" ? undefined : employeeId,
        startDate: toStartOfDayISO(dateRange.startDate),
        endDate: toEndOfDayISO(dateRange.endDate),
        isLate,
    }), [page, search, departmentId, employeeId, dateRange.startDate, dateRange.endDate, isLate]);

    const { data: recordsData, isLoading } = useAttendanceRecords(queryParams);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleDepartmentChange = (value: string) => {
        setDepartmentId(value);
        setPage(1);
    };

    const handleEmployeeChange = (value: string) => {
        setEmployeeId(value);
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Date Range Quick Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4" />
                        Date Range
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                        {DATE_RANGE_PRESETS.map((option) => (
                            <Button
                                key={option.value}
                                variant={preset === option.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPreset(option.value)}
                                className="w-full"
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>

                    {preset === "custom" && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                                <Input
                                    type="date"
                                    value={dateRange.startDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setCustomRange({ startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    value={dateRange.endDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setCustomRange({ endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4 shadow-sm">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, code..."
                            value={search}
                            onChange={handleSearch}
                            className="pl-8"
                        />
                    </div>
                </div>

                <Select value={departmentId} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={employeeId} onValueChange={handleEmployeeChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Employee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees?.map((emp) => (
                            <SelectItem key={emp.userId} value={emp.userId || ""}>
                                {emp.name} ({emp.employeeCode})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={isLate === undefined ? "all" : isLate ? "late" : "ontime"}
                    onValueChange={(val) => setIsLate(val === "all" ? undefined : val === "late")}
                >
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="ontime">On Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Sign In</TableHead>
                            <TableHead>Sign Out</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : recordsData?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            recordsData?.data.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={record.user.employee?.profilePicture || undefined} />
                                                <AvatarFallback>{record.user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{record.user.name}</span>
                                                <span className="text-xs text-muted-foreground">{record.user.employee?.employeeCode}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{record.user.employee?.department?.name || "—"}</TableCell>
                                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{formatTime(record.signIn)}</TableCell>
                                    <TableCell>{formatTime(record.signOut)}</TableCell>
                                    <TableCell>
                                        {!record.signIn ? (
                                            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Absent</Badge>
                                        ) : record.isLate ? (
                                            <Badge variant="destructive">Late</Badge>
                                        ) : (
                                            <Badge variant="secondary">On Time</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {record.signIn && <EditRecordDialog record={record} />}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                    disabled={page === 1 || isLoading}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <div className="text-sm font-medium">Page {page}</div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => old + 1)}
                    disabled={isLoading || !recordsData || recordsData.data.length < 10} // Simple check, ideally use totalPages
                >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function formatTime(isoString?: string | null) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function EditRecordDialog({ record }: { record: ExtendedAttendanceRecord }) {
    const [open, setOpen] = useState(false);
    const [signIn, setSignIn] = useState(record.signIn ? new Date(record.signIn).toTimeString().slice(0, 5) : "");
    const [signOut, setSignOut] = useState(record.signOut ? new Date(record.signOut).toTimeString().slice(0, 5) : "");
    const [isLate, setIsLate] = useState(record.isLate);

    const updateMutation = useUpdateAttendanceRecord();

    const handleSave = async () => {
        try {
            // Construct ISO strings
            const datePart = record.date ? record.date.split("T")[0] : new Date().toISOString().split("T")[0];

            // If signIn is empty/null, we might need to handle it or error out. 
            // Assuming this dialog is only used for existing records with sign-in, or we allow setting it.
            if (!signIn) return;

            const baseDate = record.signIn ? new Date(record.signIn) : new Date(datePart);
            const signInIso = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                parseInt(signIn.split(":")[0]), parseInt(signIn.split(":")[1])).toISOString();

            let signOutIso = null;
            if (signOut) {
                const signOutDate = record.signOut ? new Date(record.signOut) : baseDate;
                signOutIso = new Date(signOutDate.getFullYear(), signOutDate.getMonth(), signOutDate.getDate(),
                    parseInt(signOut.split(":")[0]), parseInt(signOut.split(":")[1])).toISOString();
            }

            await updateMutation.mutateAsync({
                id: record.id,
                payload: {
                    signIn: signInIso,
                    signOut: signOutIso,
                    isLate
                }
            });
            toast.success("Record updated");
            setOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Failed to update record");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Attendance</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Sign In</Label>
                        <Input type="time" value={signIn} onChange={(e) => setSignIn(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Sign Out</Label>
                        <Input type="time" value={signOut} onChange={(e) => setSignOut(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <div className="text-right">Is Late</div>
                        <Checkbox checked={isLate} onCheckedChange={(c) => setIsLate(!!c)} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
