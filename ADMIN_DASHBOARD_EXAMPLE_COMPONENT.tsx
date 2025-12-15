/**
 * Admin Leave Balance Dashboard - Example Component
 * 
 * This file demonstrates how to use the admin dashboard API functions
 * in a React component with proper error handling and loading states.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    useAdminLeaveBalances,
    useAdminBalanceSummary,
    useAdminBalanceAlerts,
    useAdminAdjustmentHistory,
    useBulkInitializeBalances,
    useBulkAdjustBalances,
    useExportBalances,
    downloadCSV,
} from "@/lib/queries/admin-leave-balances";
import type {
    AdminLeaveBalancesParams,
    BulkAdjustItem,
    BulkInitializeItem,
} from "@/lib/api/leave";

export default function AdminLeaveBalanceDashboard() {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<AdminLeaveBalancesParams>({
        pageSize: 20,
    });
    const [selectedYear] = useState(new Date().getFullYear());

    // Fetch data
    const { data: balances, isLoading: balancesLoading } = useAdminLeaveBalances({
        page,
        ...filters,
    });

    const { data: summary, isLoading: summaryLoading } =
        useAdminBalanceSummary(selectedYear);

    const { data: alerts, isLoading: alertsLoading } =
        useAdminBalanceAlerts(selectedYear);

    const { data: adjustmentHistory } = useAdminAdjustmentHistory({
        page: 1,
        pageSize: 10,
    });

    // Mutations
    const initializeMutation = useBulkInitializeBalances();
    const adjustMutation = useBulkAdjustBalances();
    const exportMutation = useExportBalances();

    // Handlers
    const handleBulkInitialize = async () => {
        const items: BulkInitializeItem[] = [
            {
                userId: "user_123",
                leaveTypeId: "lt_annual",
                initialBalance: 20,
            },
            {
                userId: "user_456",
                leaveTypeId: "lt_annual",
                initialBalance: 15,
            },
        ];

        try {
            const result = await initializeMutation.mutateAsync({
                items,
                reason: "Annual leave allocation for 2025",
            });

            toast.success(
                `Successfully initialized ${result.summary.succeeded} balances`
            );

            if (result.summary.failed > 0) {
                toast.error(`${result.summary.failed} initializations failed`);
                console.error("Failed items:", result.failed);
            }
        } catch (error) {
            toast.error("Failed to initialize balances");
            console.error(error);
        }
    };

    const handleBulkAdjust = async () => {
        const items: BulkAdjustItem[] = [
            {
                userId: "user_123",
                leaveTypeId: "lt_annual",
                adjustment: 5,
                reason: "Carry forward from previous year",
            },
            {
                userId: "user_456",
                leaveTypeId: "lt_annual",
                adjustment: -2,
                reason: "Correction for overpayment",
            },
        ];

        try {
            const result = await adjustMutation.mutateAsync({ items });

            toast.success(`Successfully adjusted ${result.summary.succeeded} balances`);

            if (result.summary.failed > 0) {
                toast.error(`${result.summary.failed} adjustments failed`);
                console.error("Failed items:", result.failed);
            }

            // Log successful adjustments
            result.successful.forEach((item) => {
                console.log(
                    `${item.userName}: ${item.balanceBefore} → ${item.balanceAfter} (${item.adjustment > 0 ? "+" : ""}${item.adjustment})`
                );
            });
        } catch (error) {
            toast.error("Failed to adjust balances");
            console.error(error);
        }
    };

    const handleExport = async () => {
        try {
            toast.info("Preparing export...");

            const blob = await exportMutation.mutateAsync({
                year: selectedYear,
                ...filters,
            });

            downloadCSV(blob, `leave_balances_${selectedYear}.csv`);
            toast.success("Export downloaded successfully");
        } catch (error) {
            toast.error("Failed to export balances");
            console.error(error);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleFilterChange = (newFilters: Partial<AdminLeaveBalancesParams>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
        setPage(1); // Reset to first page when filters change
    };

    // Loading state
    if (balancesLoading || summaryLoading || alertsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Leave Balance Dashboard</h1>
                <button
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {exportMutation.isPending ? "Exporting..." : "Export CSV"}
                </button>
            </div>

            {/* Summary Section */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
                        <p className="text-3xl font-bold">{summary.overview.totalEmployees}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Days Allocated</h3>
                        <p className="text-3xl font-bold">
                            {summary.overview.totalDaysAllocated}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Days Used</h3>
                        <p className="text-3xl font-bold">{summary.overview.totalDaysUsed}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500">Utilization Rate</h3>
                        <p className="text-3xl font-bold">
                            {summary.overview.overallUtilizationRate.toFixed(1)}%
                        </p>
                    </div>
                </div>
            )}

            {/* Alerts Section */}
            {alerts && alerts.summary.totalAlerts > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">
                        Alerts ({alerts.summary.totalAlerts})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {alerts.summary.critical > 0 && (
                            <div className="bg-red-50 p-4 rounded border border-red-200">
                                <h3 className="font-medium text-red-800 mb-2">
                                    Critical ({alerts.summary.critical})
                                </h3>
                                <ul className="text-sm text-red-700 space-y-1">
                                    {alerts.alerts.negativeBalances.slice(0, 3).map((alert) => (
                                        <li key={alert.employee.userId}>
                                            {alert.employee.name}: {alert.balance} days
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {alerts.summary.warnings > 0 && (
                            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                                <h3 className="font-medium text-yellow-800 mb-2">
                                    Warnings ({alerts.summary.warnings})
                                </h3>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    {alerts.alerts.highUsage.slice(0, 3).map((alert) => (
                                        <li key={alert.employee.userId}>
                                            {alert.employee.name}: {alert.usagePercent}% used
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {alerts.summary.info > 0 && (
                            <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                <h3 className="font-medium text-blue-800 mb-2">
                                    Info ({alerts.summary.info})
                                </h3>
                                <p className="text-sm text-blue-700">
                                    {alerts.summary.info} unusual adjustments detected
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filters.search || ""}
                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                        className="px-3 py-2 border rounded"
                    />
                    <select
                        value={filters.status || ""}
                        onChange={(e) =>
                            handleFilterChange({
                                status: e.target.value as "low" | "normal" | "negative" | undefined,
                            })
                        }
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">All Statuses</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                        <option value="negative">Negative</option>
                    </select>
                    <button
                        onClick={() => setFilters({ pageSize: 20 })}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Balances Table */}
            {balances && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Leave Type
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Available
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Used
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {balances.data.map((balance) => (
                                    <tr key={balance.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {balance.employee.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {balance.employee.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {balance.employee.department.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {balance.leaveType.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {balance.balances.available}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                            {balance.balances.used}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${balance.status === "NEGATIVE"
                                                        ? "bg-red-100 text-red-800"
                                                        : balance.status === "LOW"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {balance.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
                        <div className="text-sm text-gray-700">
                            Showing {(page - 1) * (filters.pageSize || 20) + 1} to{" "}
                            {Math.min(
                                page * (filters.pageSize || 20),
                                balances.pagination.totalCount
                            )}{" "}
                            of {balances.pagination.totalCount} results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= balances.pagination.totalPages}
                                className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Adjustments */}
            {adjustmentHistory && adjustmentHistory.data.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Recent Adjustments</h2>
                    <div className="space-y-3">
                        {adjustmentHistory.data.slice(0, 5).map((adjustment) => (
                            <div
                                key={adjustment.id}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded"
                            >
                                <div>
                                    <p className="font-medium">{adjustment.employee.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {adjustment.leaveType.name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">
                                        {adjustment.balances.before} → {adjustment.balances.after}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        by {adjustment.admin.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons (Example) */}
            <div className="flex gap-4">
                <button
                    onClick={handleBulkInitialize}
                    disabled={initializeMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {initializeMutation.isPending
                        ? "Initializing..."
                        : "Bulk Initialize (Example)"}
                </button>
                <button
                    onClick={handleBulkAdjust}
                    disabled={adjustMutation.isPending}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                    {adjustMutation.isPending ? "Adjusting..." : "Bulk Adjust (Example)"}
                </button>
            </div>
        </div>
    );
}
