import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyMonthlyAttendanceSummary } from "@/lib/queries/attendance";
import { useMyEmployeeProfile, useProfilePictureUrl } from "@/lib/queries/employees";
import { useMemo } from "react";

interface EmployeeSummaryCardProps {
    userId: string;
}

export function EmployeeSummaryCard({ userId }: EmployeeSummaryCardProps) {
    const { data: employee, isLoading: employeeLoading, error: employeeError } = useMyEmployeeProfile();

    const now = useMemo(() => new Date(), []);
    const { data: monthlySummary, isLoading: isLoadingSummary, error: summaryError } =
        useMyMonthlyAttendanceSummary({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        });

    const { data: profilePicture } = useProfilePictureUrl(employee?.id ?? "");



    const present = monthlySummary?.totalPresentDays ?? 0;
    const late = monthlySummary?.totalLateDays ?? 0;
    const absent = monthlySummary?.totalAbsentDays ?? 0;
    const workingDays = monthlySummary?.totalWorkingDays ?? 0;
    const attendancePercent = (monthlySummary?.totalUtilization ?? 0) * 100;

    const displayName = useMemo(() => {
        const parts = [employee?.firstName, employee?.middleName, employee?.lastName]
            .filter((p): p is string => Boolean(p && p.trim()));
        return parts.join(" ") || employee?.user?.name || "Employee";
    }, [employee?.firstName, employee?.middleName, employee?.lastName, employee?.user?.name]);

    const initials = useMemo(() => {
        const text = displayName || "?";
        return text
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part: string) => part[0]?.toUpperCase())
            .join("") || "?";
    }, [displayName]);

    const title = employee?.designation?.title || employee?.designation?.name || "";
    const departmentName = employee?.department?.name || "";
    const email = employee?.user?.email || employee?.personalEmail || "";
    const employeeCode = employee?.employeeCode || "";
    const joiningDate = useMemo(() => {
        if (!employee?.joiningDate) return "";
        try {
            return new Date(employee.joiningDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return String(employee.joiningDate);
        }
    }, [employee?.joiningDate]);
    if (employeeLoading || isLoadingSummary) {
        return <EmployeeSummaryCard.Skeleton />;
    }

    if (employeeError || summaryError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>At a Glance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">Could not load employee information.</p>
                </CardContent>
            </Card>
        );
    }

    if (!employee) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>At a Glance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">No employee data available.</p>
                </CardContent>
            </Card>
        );
    }
    return (
        <Card className="border-none bg-transparent shadow-none p-0">
            <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-500/95 to-sky-500 p-4 sm:p-6">
                <div className="rounded-2xl bg-white text-slate-900 shadow-md dark:bg-slate-950 dark:text-slate-50 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                                My Screen
                            </p>
                            <h2 className="text-lg sm:text-xl font-semibold leading-tight">At a Glance</h2>
                        </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1.75fr)]">
                        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5 flex gap-4 sm:gap-5 items-center shadow-sm">
                            <div className="flex-shrink-0">
                                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-white/80 dark:border-slate-700 shadow">
                                    <AvatarImage src={profilePicture?.url} alt={displayName} />
                                    <AvatarFallback className="text-lg sm:text-xl font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="space-y-1 text-sm sm:text-base">
                                <p className="text-base sm:text-lg font-semibold">{displayName}</p>
                                {title && (
                                    <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
                                )}
                                {departmentName && (
                                    <p className="text-xs sm:text-sm text-muted-foreground">Department: {departmentName}</p>
                                )}
                                {employeeCode && (
                                    <p className="text-xs text-muted-foreground">Employee ID: {employeeCode}</p>
                                )}
                                {joiningDate && (
                                    <p className="text-xs text-muted-foreground">Joining Date: {joiningDate}</p>
                                )}
                                {email && (
                                    <p className="text-xs text-muted-foreground truncate max-w-xs">{email}</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
                            <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-200">
                                This Month
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <SummaryStat label="Present" value={present} accent="text-emerald-500" />
                                <SummaryStat label="Late" value={late} accent="text-amber-500" />
                                <SummaryStat label="Absent" value={absent} accent="text-rose-500" />
                                <SummaryStat label="Working Days" value={workingDays} />
                                <SummaryStat
                                    label="Attendance %"
                                    value={Math.round(attendancePercent)}
                                    suffix="%"
                                />
                            </div>
                            {workingDays > 0 && (
                                <p className="mt-4 text-[11px] sm:text-xs text-muted-foreground">
                                    {Math.round(attendancePercent)}% attendance over {workingDays} working days
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

EmployeeSummaryCard.Skeleton = function Skeleton() {
    return (
        <Card className="border-none bg-transparent shadow-none p-0">
            <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-500/95 to-sky-500 p-4 sm:p-6">
                <div className="rounded-2xl bg-white dark:bg-slate-950 shadow-md p-4 sm:p-6 md:p-8">
                    <div className="mb-6">
                        <div className="h-4 w-20 bg-gray-200/70 dark:bg-slate-800 rounded-full animate-pulse mb-2"></div>
                        <div className="h-6 w-32 bg-gray-200/80 dark:bg-slate-800 rounded-full animate-pulse"></div>
                    </div>
                    <div className="grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,1.75fr)] gap-6">
                        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5 flex gap-4 items-center">
                            <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-4 w-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-3 w-28 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-3 w-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 p-4 sm:p-5">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse mb-4"></div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {[...Array(5)].map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="h-5 w-12 bg-gray-200 dark:bg-slate-800 rounded mx-auto animate-pulse"></div>
                                        <div className="h-3 w-16 bg-gray-200 dark:bg-slate-800 rounded mx-auto animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

interface SummaryStatProps {
    label: string;
    value: number;
    suffix?: string;
    accent?: string;
}

function SummaryStat({ label, value, suffix, accent }: SummaryStatProps) {
    return (
        <div className="rounded-xl border border-slate-100/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 py-3 sm:px-4 sm:py-4 flex flex-col justify-between">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {label}
            </p>
            <p className={`text-lg sm:text-xl font-semibold ${accent ?? ""}`}>
                {value}
                {suffix}
            </p>
        </div>
    );
}