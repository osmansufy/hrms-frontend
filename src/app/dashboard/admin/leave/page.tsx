"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarCheck,
    FileEdit,
    Settings,
    ShieldCheck,
    Wallet,
    FileText,
    Tag,
    Users,
    Clock,
    BookOpen,
    Bell,
    BarChart3,
    CalendarDays,
} from "lucide-react";
import {
    LeaveApprovalsTab,
    AmendmentApprovalsTab,
    LeavePoliciesTab,
    AccrualRulesTab,
    LeaveBalancesTab,
    AuditTrailTab,
    LeaveTypesTab,
    NoticeRulesTab,
    WorkScheduleTab,
    EmployeeLeavesTab,
} from "./components";
import { Separator } from "@/components/ui/separator";

export default function AdminLeavePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams?.get("tab") || "employees";

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set("tab", value);
        router.push(`/dashboard/admin/leave?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Leave Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage leave approvals, policies, balances, and analytics
                    </p>
                </div>
                <CalendarCheck className="size-8 text-primary" />
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <div className="space-y-4">
                    {/* Operations Section */}
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <ShieldCheck className="size-4 text-muted-foreground" />
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Operations</h3>
                        </div>
                        <TabsList className="grid w-full grid-cols-3 h-auto">
                            <TabsTrigger value="employees" className="flex items-center gap-2">
                                <Users className="size-4" />
                                Leave Records
                            </TabsTrigger>
                            <TabsTrigger value="approvals" className="flex items-center gap-2">
                                <ShieldCheck className="size-4" />
                                Approvals
                            </TabsTrigger>
                            <TabsTrigger value="amendments" className="flex items-center gap-2">
                                <FileEdit className="size-4" />
                                Amendments
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <Separator />

                    {/* Configuration Section */}
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <Settings className="size-4 text-muted-foreground" />
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Configuration</h3>
                        </div>
                        <TabsList className="grid w-full grid-cols-5 h-auto">
                            <TabsTrigger value="types" className="flex items-center gap-2">
                                <Tag className="size-4" />
                                Leave Types
                            </TabsTrigger>
                            <TabsTrigger value="policies" className="flex items-center gap-2">
                                <BookOpen className="size-4" />
                                Policies
                            </TabsTrigger>
                            <TabsTrigger value="notice" className="flex items-center gap-2">
                                <Bell className="size-4" />
                                Notice Rules
                            </TabsTrigger>
                            <TabsTrigger value="accruals" className="flex items-center gap-2">
                                <CalendarDays className="size-4" />
                                Accrual Rules
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="flex items-center gap-2">
                                <Clock className="size-4" />
                                Work Schedule
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <Separator />

                    {/* Analytics Section */}
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <BarChart3 className="size-4 text-muted-foreground" />
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Analytics</h3>
                        </div>
                        <TabsList className="grid w-full grid-cols-2 h-auto">
                            <TabsTrigger value="balances" className="flex items-center gap-2">
                                <Wallet className="size-4" />
                                Balances
                            </TabsTrigger>
                            <TabsTrigger value="audit" className="flex items-center gap-2">
                                <FileText className="size-4" />
                                Audit Trail
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="employees" className="space-y-4">
                    <EmployeeLeavesTab />
                </TabsContent>

                <TabsContent value="types" className="space-y-4">
                    <LeaveTypesTab />
                </TabsContent>

                <TabsContent value="balances" className="space-y-4">
                    <LeaveBalancesTab />
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <AuditTrailTab />
                </TabsContent>

                <TabsContent value="approvals" className="space-y-4">
                    <LeaveApprovalsTab />
                </TabsContent>

                <TabsContent value="amendments" className="space-y-4">
                    <AmendmentApprovalsTab />
                </TabsContent>

                <TabsContent value="policies" className="space-y-4">
                    <LeavePoliciesTab />
                </TabsContent>

                <TabsContent value="accruals" className="space-y-4">
                    <AccrualRulesTab />
                </TabsContent>
                <TabsContent value="notice" className="space-y-4">
                    <NoticeRulesTab />
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                    <WorkScheduleTab />
                </TabsContent>
            </Tabs>
        </div >
    );
}
