"use client";

import { useMemo, useState } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Loader2, Clock, Search, X, CalendarDays, MapPin,
    AlertTriangle, LogIn, LogOut, RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAttendanceRecords } from "@/lib/queries/attendance";
import { toStartOfDayISO, toEndOfDayISO, formatTimeInTimezone, toLocalDateStr } from "@/lib/utils";
import Link from "next/link";
import { useDepartments } from "@/lib/queries/departments";
import { useQueryClient } from "@tanstack/react-query";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function formatTime(v?: string | null) { return formatTimeInTimezone(v || ""); }

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

type FilterStatus = "all" | "present" | "signedOut" | "late" | "onleave" | "onbreak" | "absent";

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
    { value: "all",       label: "All" },
    { value: "present",   label: "Present" },
    { value: "signedOut", label: "Signed Out" },
    { value: "late",      label: "Late" },
    { value: "onbreak",   label: "On Break" },
    { value: "onleave",   label: "On Leave" },
    { value: "absent",    label: "Absent" },
];

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

export function TodayAttendanceCard() {
    const queryClient  = useQueryClient();
    const today        = toLocalDateStr();
    const [search,     setSearch]     = useState("");
    const [status,     setStatus]     = useState<FilterStatus>("all");
    const [deptId,     setDeptId]     = useState("all");

    const queryParams = useMemo(() => ({
        startDate: toStartOfDayISO(today),
        endDate:   toEndOfDayISO(today),
        limit:     "200",
    }), [today]);

    const { data, isLoading, isFetching } = useAttendanceRecords(queryParams);
    const { data: departments } = useDepartments();
    const records = data?.data ?? [];

    // Derived counts
    const counts = useMemo(() => ({
        present:   records.filter(r => r.signIn && !r.signOut && !r.isOnBreak).length,
        signedOut: records.filter(r => r.signIn && r.signOut).length,
        late:      records.filter(r => r.isLate).length,
        onBreak:   records.filter(r => r.isOnBreak).length,
        onLeave:   records.filter(r => r.isOnLeave).length,
        absent:    records.filter(r => !r.signIn && !r.isOnLeave && !r.isWeekend).length,
    }), [records]);

    // Departments with ≥3 employees on break
    const breakAlerts = useMemo(() => {
        const map = new Map<string, { count: number; names: string[] }>();
        records.filter(r => r.isOnBreak).forEach(r => {
            const dId = r.user?.employee?.departmentId;
            if (!dId) return;
            const cur = map.get(dId) ?? { count: 0, names: [] };
            cur.count++;
            cur.names.push(r.user?.name ?? "?");
            map.set(dId, cur);
        });
        return Array.from(map.entries())
            .filter(([, v]) => v.count >= 3)
            .map(([deptId, v]) => ({
                deptId,
                deptName: departments?.find(d => d.id === deptId)?.name ?? deptId,
                ...v,
            }));
    }, [records, departments]);

    // Filtered records
    const filtered = useMemo(() => {
        let rows = records;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                r.user?.name?.toLowerCase().includes(q) ||
                r.user?.employee?.employeeCode?.toLowerCase().includes(q)
            );
        }
        if (deptId !== "all") {
            rows = rows.filter(r => r.user?.employee?.departmentId === deptId);
        }
        if (status !== "all") {
            rows = rows.filter(r => {
                switch (status) {
                    case "present":   return r.signIn && !r.signOut;
                    case "signedOut": return r.signIn && !!r.signOut;
                    case "late":      return r.isLate;
                    case "onbreak":   return r.isOnBreak;
                    case "onleave":   return r.isOnLeave;
                    case "absent":    return !r.signIn && !r.isOnLeave && !r.isWeekend;
                    default:          return true;
                }
            });
        }
        return rows;
    }, [records, search, deptId, status]);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["attendance", "admin", "records"] });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Today&apos;s Attendance</CardTitle>
                        <CardDescription className="mt-0.5">
                            Live view · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="size-3.5" />
                            {formatTimeInTimezone(new Date())}
                        </span>
                        <Button
                            variant="outline" size="sm"
                            onClick={handleRefresh}
                            disabled={isFetching}
                            className="gap-2"
                        >
                            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* ── Break alerts ── */}
                {breakAlerts.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                        <AlertTriangle className="size-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 dark:text-amber-400">
                            High Break Concentration
                        </AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-500 space-y-1 mt-1">
                            {breakAlerts.map(a => (
                                <div key={a.deptId} className="text-sm">
                                    <strong>{a.deptName}</strong> — {a.count} employees on break simultaneously
                                </div>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Status summary pills ── */}
                {!isLoading && records.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {[
                            { label: "Present",    count: counts.present,   dot: "bg-emerald-500" },
                            { label: "Signed Out", count: counts.signedOut, dot: "bg-slate-400" },
                            { label: "Late",       count: counts.late,      dot: "bg-amber-500" },
                            { label: "On Break",   count: counts.onBreak,   dot: "bg-orange-500" },
                            { label: "On Leave",   count: counts.onLeave,   dot: "bg-blue-500" },
                            { label: "Absent",     count: counts.absent,    dot: "bg-red-500" },
                        ].map(({ label, count, dot }) => (
                            <span key={label} className="flex items-center gap-1.5 rounded-full border bg-muted/30 px-2.5 py-1">
                                <span className={`size-2 rounded-full ${dot}`} />
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-semibold text-foreground">{count}</span>
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="space-y-3">
                    {/* Search + department */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search name or employee code…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-9"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <Select value={deptId} onValueChange={setDeptId}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments?.map(d => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status pill strip */}
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {STATUS_FILTERS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatus(opt.value)}
                                className={[
                                    "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    status === opt.value
                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                                ].join(" ")}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Result count */}
                    {(search || status !== "all" || deptId !== "all") && (
                        <p className="text-xs text-muted-foreground">
                            Showing <strong>{filtered.length}</strong> of {records.length} records
                        </p>
                    )}
                </div>

                {/* ── Table ── */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="mr-2 size-5 animate-spin" /> Loading…
                    </div>
                ) : records.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                        No attendance records for today yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="font-semibold">Employee</TableHead>
                                    <TableHead className="font-semibold">
                                        <span className="flex items-center gap-1.5"><LogIn className="size-3.5" />In</span>
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        <span className="flex items-center gap-1.5"><LogOut className="size-3.5" />Out</span>
                                    </TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold hidden lg:table-cell">Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                                            No records match your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((record, idx) => {
                                        const rowBg = idx % 2 !== 0 ? "bg-muted/20" : "";
                                        const deptName = departments?.find(d => d.id === record.user?.employee?.departmentId)?.name;

                                        return (
                                            <TableRow key={record.id} className={`${rowBg} hover:bg-muted/40 transition-colors`}>
                                                {/* Employee */}
                                                <TableCell>
                                                    <Link href={`/dashboard/admin/employees/${record.user?.employee?.id}`}>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-8 shrink-0">
                                                                <AvatarFallback className="text-xs">
                                                                    {getInitials(record.user?.name ?? "?")}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium leading-tight hover:underline">
                                                                    {record.user?.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {record.user?.employee?.employeeCode}
                                                                </span>
                                                                {deptName && (
                                                                    <span className="text-xs text-muted-foreground">{deptName}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </TableCell>

                                                {/* Sign in */}
                                                <TableCell>
                                                    <span className={`tabular-nums font-medium ${record.isLate ? "text-amber-600 dark:text-amber-400" : ""}`}>
                                                        {record.signIn ? formatTime(record.signIn) : <span className="text-muted-foreground">—</span>}
                                                    </span>
                                                </TableCell>

                                                {/* Sign out */}
                                                <TableCell>
                                                    <span className="tabular-nums text-muted-foreground">
                                                        {record.signOut ? formatTime(record.signOut) : "—"}
                                                    </span>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {/* Primary status */}
                                                        {!record.signIn ? (
                                                            record.isWeekend ? (
                                                                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-500 dark:bg-slate-900/40 text-xs">
                                                                    Weekend
                                                                </Badge>
                                                            ) : record.isOnLeave ? (
                                                                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-xs">
                                                                    <CalendarDays className="mr-1 size-3" />
                                                                    {record.leave?.leaveType.name ?? "On Leave"}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="border-red-300 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-xs">
                                                                    Absent
                                                                </Badge>
                                                            )
                                                        ) : record.signOut ? (
                                                            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 text-xs">
                                                                Signed Out
                                                            </Badge>
                                                        ) : record.isOnBreak ? (
                                                            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 text-xs">
                                                                <Clock className="mr-1 size-3" />
                                                                On Break
                                                                {record.activeBreak?.durationMinutes
                                                                    ? ` · ${record.activeBreak.durationMinutes}m`
                                                                    : ""}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs">
                                                                Present
                                                            </Badge>
                                                        )}

                                                        {/* Late badge (secondary) */}
                                                        {record.isLate && (
                                                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-xs">
                                                                Late
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Location */}
                                                <TableCell className="hidden lg:table-cell max-w-[180px]">
                                                    {(() => {
                                                        const addr = record.signInAddress || record.signOutAddress || record.signInLocation || record.signOutLocation;
                                                        if (addr) return (
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                                                                <span className="text-xs text-muted-foreground truncate" title={addr}>{addr}</span>
                                                            </div>
                                                        );
                                                        return <span className="text-xs text-muted-foreground">—</span>;
                                                    })()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
