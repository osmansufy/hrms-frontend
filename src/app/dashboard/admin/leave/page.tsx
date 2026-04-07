"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    CalendarCheck,
    FileEdit,
    ShieldCheck,
    Wallet,
    FileText,
    Tag,
    Users,
    BookOpen,
    Bell,
    CalendarDays,
    BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LeaveApprovalsTab,
    AmendmentApprovalsTab,
    LeavePoliciesTab,
    AccrualRulesTab,
    LeaveBalancesTab,
    AuditTrailTab,
    LeaveTypesTab,
    NoticeRulesTab,
    EmployeeLeavesTab,
    LeaveLedgerTab,
} from "./components";

const SECTION_OPERATIONS = [
    { value: "employees", label: "Leave Records", icon: Users },
    { value: "approvals", label: "Approvals", icon: ShieldCheck },
    { value: "amendments", label: "Amendments", icon: FileEdit },
] as const;

const SECTION_CONFIGURATION = [
    { value: "types", label: "Leave Types", icon: Tag },
    { value: "policies", label: "Policies", icon: BookOpen },
    { value: "notice", label: "Notice Rules", icon: Bell },
    { value: "accruals", label: "Accrual Rules", icon: CalendarDays },
] as const;

const SECTION_ANALYTICS = [
    { value: "balances", label: "Balances", icon: Wallet },
    { value: "audit", label: "Audit Trail", icon: FileText },
    { value: "ledger", label: "Ledger", icon: BarChart3 },
] as const;

const ALL_TABS = [...SECTION_OPERATIONS, ...SECTION_CONFIGURATION, ...SECTION_ANALYTICS];

const tabTriggerBase = [
    "relative shrink-0 whitespace-nowrap rounded-none border-0 bg-transparent",
    "px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none",
    "transition-colors hover:text-foreground",
    "data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
    "after:absolute after:bottom-0 after:left-0 after:right-0",
    "after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0",
    "data-[state=active]:after:scale-x-100 after:transition-transform after:duration-200",
].join(" ");

export default function AdminLeavePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams?.get("tab") || "employees";

    const todayLabel = useMemo(
        () =>
            new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            }),
        []
    );

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set("tab", value);
        router.push(`/dashboard/admin/leave?${params.toString()}`);
    };

    return (
        <div className="container space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {todayLabel}
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                        Leave Management
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Approve requests, configure policies, and monitor balances
                    </p>
                </div>
                <CalendarCheck className="hidden size-8 text-primary sm:block" />
            </div>

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <div className="space-y-4">
                    {/* Operations */}
                    <section>
                        <div className="mb-1 flex items-center gap-2">
                            <ShieldCheck className="size-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Operations
                            </span>
                        </div>
                        <div className="border-b">
                            <TabsList className="h-auto w-max justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                                {SECTION_OPERATIONS.map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger key={value} value={value} className={tabTriggerBase}>
                                        <Icon className="mr-1.5 size-3.5" />
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                    </section>

                    {/* Configuration */}
                    <section>
                        <div className="mb-1 flex items-center gap-2">
                            <Tag className="size-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Configuration
                            </span>
                        </div>
                        <div className="border-b">
                            <TabsList className="h-auto w-max justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                                {SECTION_CONFIGURATION.map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger key={value} value={value} className={tabTriggerBase}>
                                        <Icon className="mr-1.5 size-3.5" />
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                    </section>

                    {/* Analytics */}
                    <section>
                        <div className="mb-1 flex items-center gap-2">
                            <BarChart3 className="size-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Analytics
                            </span>
                        </div>
                        <div className="border-b">
                            <TabsList className="h-auto w-max justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                                {SECTION_ANALYTICS.map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger key={value} value={value} className={tabTriggerBase}>
                                        <Icon className="mr-1.5 size-3.5" />
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                    </section>
                </div>

                {/* ── Tab Content ── */}
                <TabsContent value="employees" className="space-y-4">
                    <EmployeeLeavesTab />
                </TabsContent>
                <TabsContent value="approvals" className="space-y-4">
                    <LeaveApprovalsTab />
                </TabsContent>
                <TabsContent value="amendments" className="space-y-4">
                    <AmendmentApprovalsTab />
                </TabsContent>
                <TabsContent value="types" className="space-y-4">
                    <LeaveTypesTab />
                </TabsContent>
                <TabsContent value="policies" className="space-y-4">
                    <LeavePoliciesTab />
                </TabsContent>
                <TabsContent value="notice" className="space-y-4">
                    <NoticeRulesTab />
                </TabsContent>
                <TabsContent value="accruals" className="space-y-4">
                    <AccrualRulesTab />
                </TabsContent>
                <TabsContent value="balances" className="space-y-4">
                    <LeaveBalancesTab />
                </TabsContent>
                <TabsContent value="audit" className="space-y-4">
                    <AuditTrailTab />
                </TabsContent>
                <TabsContent value="ledger" className="space-y-4">
                    <LeaveLedgerTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
