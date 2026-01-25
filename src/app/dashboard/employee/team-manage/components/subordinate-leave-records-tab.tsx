"use client";

import { useReducer } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useSubordinateLeaves } from "@/lib/queries/leave";
import { Calendar, Loader2, Eye, CalendarDays, CalendarRange, Filter, X } from "lucide-react";
import { formatDateInDhaka } from "@/lib/utils";
import Link from "next/link";

interface SubordinateLeaveRecordsTabProps {
  userId: string;
}

type DateFilterPreset = "weekly" | "monthly" | "yearly" | "custom";

interface FilterState {
  startDate: string;
  endDate: string;
  status: string;
  page: number;
  activePreset: DateFilterPreset | null;
}

type FilterAction =
  | { type: "SET_DATE_RANGE"; payload: { startDate: string; endDate: string; preset: DateFilterPreset } }
  | { type: "SET_START_DATE"; payload: string }
  | { type: "SET_END_DATE"; payload: string }
  | { type: "SET_STATUS"; payload: string }
  | { type: "SET_PAGE"; payload: number }
  | { type: "RESET" };

const getInitialState = (): FilterState => ({
  startDate: "",
  endDate: "",
  status: "",
  page: 1,
  activePreset: null,
});

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
    case "SET_STATUS":
      return {
        ...state,
        status: action.payload,
        page: 1,
      };
    case "SET_PAGE":
      return {
        ...state,
        page: action.payload,
      };
    case "RESET":
      return getInitialState();
    default:
      return state;
  }
};

export function SubordinateLeaveRecordsTab({
  userId,
}: SubordinateLeaveRecordsTabProps) {
  const [state, dispatch] = useReducer(filterReducer, getInitialState());
  const limit = 20;

  const { data, isLoading, error } = useSubordinateLeaves(userId, {
    startDate: state.startDate || undefined,
    endDate: state.endDate || undefined,
    status: state.status || undefined,
    page: state.page,
    limit,
  });

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "APPROVED") {
      return <Badge variant="default">Approved</Badge>;
    } else if (statusUpper === "PENDING") {
      return <Badge variant="secondary">Pending</Badge>;
    } else if (statusUpper === "REJECTED") {
      return <Badge variant="destructive">Rejected</Badge>;
    } else if (statusUpper === "PROCESSING") {
      return <Badge variant="outline">Processing</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const calculateTotalDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
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
          <CardTitle>Leave Records</CardTitle>
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
          <CardTitle>Leave Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Failed to load leave records
          </p>
        </CardContent>
      </Card>
    );
  }

  const leaves = data?.data || [];
  const totalPages = data?.totalPages || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                <label className="text-xs font-medium text-muted-foreground">Leave Status</label>
                <Select
                  value={state.status}
                  onValueChange={(value) => dispatch({ type: "SET_STATUS", payload: value })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                  </SelectContent>
                </Select>
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
            {leaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leave records found
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Leave Type</TableHead>
                        <TableHead className="min-w-[100px]">Start Date</TableHead>
                        <TableHead className="min-w-[100px]">End Date</TableHead>
                        <TableHead className="min-w-[80px]">Days</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="hidden md:table-cell min-w-[150px]">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => {
                        const totalDays =
                          leave.totalDays ||
                          calculateTotalDays(leave.startDate, leave.endDate);
                        return (
                          <TableRow key={leave.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {leave.leaveType?.name || leave.leaveType?.code || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDateInDhaka(leave.startDate, "short")}
                            </TableCell>
                            <TableCell>
                              {formatDateInDhaka(leave.endDate, "short")}
                            </TableCell>
                            <TableCell>{totalDays} days</TableCell>
                            <TableCell>{getStatusBadge(leave.status)}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                              {leave.reason || "—"}
                            </TableCell>
                            
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Page {state.page} of {totalPages} ({data?.total || 0} total records)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: "SET_PAGE", payload: Math.max(1, state.page - 1) })}
                    disabled={state.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: "SET_PAGE", payload: Math.min(totalPages, state.page + 1) })}
                    disabled={state.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
