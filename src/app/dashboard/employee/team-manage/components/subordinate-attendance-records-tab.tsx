"use client";

import { useReducer, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubordinateAttendance } from "@/lib/queries/attendance";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CalendarDays, 
  CalendarRange, 
  Filter, 
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { toStartOfDayISO, toEndOfDayISO, formatDateInDhaka } from "@/lib/utils";

interface SubordinateAttendanceRecordsTabProps {
  userId: string;
}

type DateFilterPreset = "weekly" | "monthly" | "yearly" | "custom";

interface FilterState {
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
  isLate: boolean | undefined;
  activePreset: DateFilterPreset;
}

type FilterAction =
  | { type: "SET_DATE_RANGE"; payload: { startDate: string; endDate: string; preset: DateFilterPreset } }
  | { type: "SET_START_DATE"; payload: string }
  | { type: "SET_END_DATE"; payload: string }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_LIMIT"; payload: number }
  | { type: "SET_IS_LATE"; payload: boolean | undefined }
  | { type: "RESET" };

const getInitialState = (): FilterState => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: firstDay.toISOString().split("T")[0],
    endDate: lastDay.toISOString().split("T")[0],
    page: 1,
    limit: 20,
    isLate: undefined,
    activePreset: "monthly",
  };
};

const filterReducer = (state: FilterState, action: FilterAction): FilterState => {
  switch (action.type) {
    case "SET_DATE_RANGE":
      return {
        ...state,
        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
        activePreset: action.payload.preset,
        page: 1,
      };
    case "SET_START_DATE":
      return {
        ...state,
        startDate: action.payload,
        activePreset: "custom",
        page: 1,
      };
    case "SET_END_DATE":
      return {
        ...state,
        endDate: action.payload,
        activePreset: "custom",
        page: 1,
      };
    case "SET_PAGE":
      return {
        ...state,
        page: action.payload,
      };
    case "SET_LIMIT":
      return {
        ...state,
        limit: action.payload,
        page: 1, // Reset to first page when changing limit
      };
    case "SET_IS_LATE":
      return {
        ...state,
        isLate: action.payload,
        page: 1,
      };
    case "RESET":
      return getInitialState();
    default:
      return state;
  }
};

export function SubordinateAttendanceRecordsTab({
  userId,
}: SubordinateAttendanceRecordsTabProps) {
  const timezone = "Asia/Dhaka"; // Default timezone, can be made configurable
  const [state, dispatch] = useReducer(filterReducer, getInitialState());
  const [viewMode, setViewMode] = useState<"records" | "monthly">("monthly");
  
  // Month/Year selector state for monthly view
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const queryParams = useMemo(
    () => ({
      page: state.page.toString(),
      limit: state.limit.toString(),
      startDate: toStartOfDayISO(state.startDate),
      endDate: toEndOfDayISO(state.endDate),
      isLate: state.isLate,
      sortBy: "date" as const,
      sortOrder: "desc" as const,
    }),
    [state.page, state.limit, state.startDate, state.endDate, state.isLate]
  );

  const { data, isLoading, error } = useSubordinateAttendance(
    userId,
    queryParams
  );

  // Separate query for monthly view
  const monthlyStartDate = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0];
  const monthlyEndDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split("T")[0];
  
  const { data: monthlyData, isLoading: monthlyLoading } = useSubordinateAttendance(
    userId,
    {
      page: "1",
      limit: "1000",
      startDate: toStartOfDayISO(monthlyStartDate),
      endDate: toEndOfDayISO(monthlyEndDate),
      sortBy: "date",
      sortOrder: "desc",
    }
  );

  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    if (!monthlyData?.data) return null;

    const records = monthlyData.data;
    const stats = {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      weekendDays: 0,
      leaveDays: 0,
      totalWorkedHours: 0,
      averageWorkedHours: 0,
      attendanceRate: 0,
      onTimeDays: 0,
    };

    records.forEach((record) => {
      stats.totalDays++;

      if (record.isWeekend) {
        stats.weekendDays++;
      } else if (record.isOnLeave) {
        stats.leaveDays++;
      } else if (record.signIn) {
        stats.presentDays++;
        if (record.isLate) {
          stats.lateDays++;
        } else {
          stats.onTimeDays++;
        }
        if (record.workedMinutes) {
          stats.totalWorkedHours += record.workedMinutes / 60;
        }
      } else {
        stats.absentDays++;
      }
    });

    if (stats.presentDays > 0) {
      stats.averageWorkedHours = stats.totalWorkedHours / stats.presentDays;
    }

    const workingDays = stats.totalDays - stats.weekendDays;
    if (workingDays > 0) {
      stats.attendanceRate = ((stats.presentDays + stats.leaveDays) / workingDays) * 100;
    }

    return stats;
  }, [monthlyData]);

  const formatWorkedHours = (workedMinutes?: number) => {
    if (!workedMinutes) return "—";
    const hours = Math.floor(workedMinutes / 60);
    const minutes = workedMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleWeekFilter = (type: "current" | "last") => {
    const now = new Date();
    let newStartDate: string;
    let newEndDate: string;

    if (type === "current") {
      // Current week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      newStartDate = monday.toISOString().split("T")[0];
      newEndDate = now.toISOString().split("T")[0];
    } else {
      // Last week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      newStartDate = lastMonday.toISOString().split("T")[0];
      newEndDate = lastSunday.toISOString().split("T")[0];
    }

    dispatch({
      type: "SET_DATE_RANGE",
      payload: { startDate: newStartDate, endDate: newEndDate, preset: "weekly" },
    });
  };

  const handleMonthFilter = (month: number, year: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    dispatch({
      type: "SET_DATE_RANGE",
      payload: {
        startDate: monthStart.toISOString().split("T")[0],
        endDate: monthEnd.toISOString().split("T")[0],
        preset: "monthly",
      },
    });
  };

  const handleYearFilter = (year: number) => {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    dispatch({
      type: "SET_DATE_RANGE",
      payload: {
        startDate: yearStart.toISOString().split("T")[0],
        endDate: yearEnd.toISOString().split("T")[0],
        preset: "yearly",
      },
    });
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Failed to load attendance records
          </p>
        </CardContent>
      </Card>
    );
  }

  const records = data?.data || [];
  const totalPages = data?.totalPages || 0;

  // Month names for selector
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (current year and 2 previous years)
  const yearOptions = [selectedYear, selectedYear - 1, selectedYear - 2];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Overview
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Switcher */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "records" | "monthly")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monthly Summary
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Detailed Records
            </TabsTrigger>
          </TabsList>

          {/* Monthly Summary View */}
          <TabsContent value="monthly" className="space-y-6 mt-6">
            {/* Month/Year Selector */}
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                >
                  <SelectTrigger className="w-[140px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                >
                  <SelectTrigger className="w-[100px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMonth(currentDate.getMonth());
                  setSelectedYear(currentDate.getFullYear());
                }}
              >
                Today
              </Button>
            </div>

            {monthlyLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : monthlyStats ? (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Attendance Rate */}
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <Badge 
                          variant={monthlyStats.attendanceRate >= 90 ? "default" : monthlyStats.attendanceRate >= 75 ? "secondary" : "destructive"}
                        >
                          {monthlyStats.attendanceRate >= 90 ? "Excellent" : monthlyStats.attendanceRate >= 75 ? "Good" : "Needs Attention"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                        <p className="text-3xl font-bold">{monthlyStats.attendanceRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {monthlyStats.totalDays - monthlyStats.weekendDays} working days
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Present Days */}
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {monthlyStats.onTimeDays} on time
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Present Days</p>
                        <p className="text-3xl font-bold text-green-600">{monthlyStats.presentDays}</p>
                        <p className="text-xs text-muted-foreground">
                          {monthlyStats.lateDays > 0 && `${monthlyStats.lateDays} late arrival${monthlyStats.lateDays > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Absent Days */}
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <XCircle className="h-5 w-5 text-destructive" />
                        </div>
                        {monthlyStats.absentDays > 0 && (
                          <Badge variant="destructive">
                            Alert
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Absent Days</p>
                        <p className="text-3xl font-bold text-destructive">{monthlyStats.absentDays}</p>
                        <p className="text-xs text-muted-foreground">
                          {monthlyStats.leaveDays} approved leave{monthlyStats.leaveDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Hours */}
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          Avg
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Avg Work Hours</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {monthlyStats.averageWorkedHours.toFixed(1)}h
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {monthlyStats.totalWorkedHours.toFixed(0)}h total
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Breakdown */}
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="text-base">Breakdown by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Visual Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Day Distribution</span>
                          <span className="text-muted-foreground">{monthlyStats.totalDays} total days</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 transition-all"
                            style={{ width: `${(monthlyStats.presentDays / monthlyStats.totalDays) * 100}%` }}
                            title={`Present: ${monthlyStats.presentDays} days`}
                          />
                          <div
                            className="bg-blue-500 transition-all"
                            style={{ width: `${(monthlyStats.leaveDays / monthlyStats.totalDays) * 100}%` }}
                            title={`Leave: ${monthlyStats.leaveDays} days`}
                          />
                          <div
                            className="bg-destructive transition-all"
                            style={{ width: `${(monthlyStats.absentDays / monthlyStats.totalDays) * 100}%` }}
                            title={`Absent: ${monthlyStats.absentDays} days`}
                          />
                          <div
                            className="bg-muted-foreground/30 transition-all"
                            style={{ width: `${(monthlyStats.weekendDays / monthlyStats.totalDays) * 100}%` }}
                            title={`Weekend: ${monthlyStats.weekendDays} days`}
                          />
                        </div>
                      </div>

                      {/* Legend with values */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Present</p>
                            <p className="text-sm font-semibold">{monthlyStats.presentDays} days</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Leave</p>
                            <p className="text-sm font-semibold">{monthlyStats.leaveDays} days</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                          <div className="w-3 h-3 rounded-full bg-destructive" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Absent</p>
                            <p className="text-sm font-semibold">{monthlyStats.absentDays} days</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Weekend</p>
                            <p className="text-sm font-semibold">{monthlyStats.weekendDays} days</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Stats */}
                      <div className="pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Late Arrivals</p>
                          <p className="text-2xl font-bold text-yellow-600">{monthlyStats.lateDays}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">On-Time Days</p>
                          <p className="text-2xl font-bold text-green-600">{monthlyStats.onTimeDays}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Working Days</p>
                          <p className="text-2xl font-bold">{monthlyStats.totalDays - monthlyStats.weekendDays}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attendance data available for the selected month</p>
              </div>
            )}
          </TabsContent>

          {/* Detailed Records View */}
          <TabsContent value="records" className="space-y-6 mt-6">
        {/* Filters Section */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Filters</h3>
          </div>

          {/* Quick Presets */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>QUICK SELECT</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekFilter("current")}
                className="h-9 text-xs bg-background"
              >
                Current Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekFilter("last")}
                className="h-9 text-xs bg-background"
              >
                Last Week
              </Button>
              <Select
                onValueChange={(value) => {
                  const [month, year] = value.split("-").map(Number);
                  handleMonthFilter(month, year);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => {
                    const currentYear = new Date().getFullYear();
                    const monthName = new Date(currentYear, i, 1).toLocaleString("en-US", {
                      month: "long",
                    });
                    return (
                      <SelectItem key={i} value={`${i}-${currentYear}`}>
                        {monthName} {currentYear}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => handleYearFilter(Number(value))}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range & Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <CalendarRange className="h-3.5 w-3.5" />
              <span>CUSTOM RANGE</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">From Date</label>
                <Input
                  type="date"
                  value={state.startDate}
                  onChange={(e) => dispatch({ type: "SET_START_DATE", payload: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">To Date</label>
                <Input
                  type="date"
                  value={state.endDate}
                  onChange={(e) => dispatch({ type: "SET_END_DATE", payload: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={state.isLate === undefined ? "all" : state.isLate ? "late" : "ontime"}
                  onChange={(e) => {
                    const value = e.target.value;
                    dispatch({
                      type: "SET_IS_LATE",
                      payload: value === "all" ? undefined : value === "late" ? true : false,
                    });
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="late">Late</option>
                  <option value="ontime">On Time</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={handleReset} 
                  className="w-full h-9 text-xs"
                  size="sm"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Reset All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records found for the selected date range
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[120px]">Sign In</TableHead>
                    <TableHead className="min-w-[120px]">Sign Out</TableHead>
                    <TableHead className="min-w-[100px]">Hours</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px]">Leave</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const date = typeof record.date === 'string' ? new Date(record.date) : record.date;
                    const dayOfWeek = date.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                    const isWeekend = record.isWeekend || false;
                    const isOnLeave = record.isOnLeave || false;

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatDateInDhaka(record.date, "short")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {dayOfWeek}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.signIn ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(record.signIn).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </span>
                              {record.signInLocation && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {record.signInLocation}
                                </span>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {record.signOut ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(record.signOut).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </span>
                              {record.signOutLocation && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {record.signOutLocation}
                                </span>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {formatWorkedHours(record.workedMinutes)}
                        </TableCell>
                        <TableCell>
                          {isWeekend ? (
                            <Badge variant="outline">Weekend</Badge>
                          ) : record.isLate ? (
                            <Badge variant="destructive">Late</Badge>
                          ) : record.signIn ? (
                            <Badge variant="default">On Time</Badge>
                          ) : (
                            <Badge variant="secondary">Absent</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {isOnLeave && record.leave ? (
                            <Badge variant="secondary">
                              {record.leave.leaveType.name}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-sm text-muted-foreground">
                  Showing {records.length > 0 ? (state.page - 1) * state.limit + 1 : 0} to{" "}
                  {Math.min(state.page * state.limit, data?.total || 0)} of {data?.total || 0} records
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">Per page:</label>
                  <Select
                    value={state.limit.toString()}
                    onValueChange={(value) => dispatch({ type: "SET_LIMIT", payload: Number(value) })}
                  >
                    <SelectTrigger className="h-9 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: "SET_PAGE", payload: Math.max(1, state.page - 1) })}
                    disabled={state.page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-sm text-muted-foreground">
                      Page {state.page} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: "SET_PAGE", payload: Math.min(totalPages, state.page + 1) })}
                    disabled={state.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
