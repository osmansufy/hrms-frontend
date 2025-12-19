"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarCheck,
    FileEdit,
    Settings,
    ShieldCheck,
    LayoutDashboard,
    Wallet,
    FileText,
    Tag,
} from "lucide-react";
import {
    LeaveApprovalsTab,
    AmendmentApprovalsTab,
    LeavePoliciesTab,
    AccrualRulesTab,
    LeaveDashboardTab,
    LeaveBalancesTab,
    AuditTrailTab,
    LeaveTypesTab,
} from "./components";

export default function AdminLeavePage() {
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

            <Tabs defaultValue="dashboard" className="space-y-4">
                <TabsList className="grid w-full grid-cols-8">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="size-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="types" className="flex items-center gap-2">
                        <Tag className="size-4" />
                        Leave Types
                    </TabsTrigger>
                    <TabsTrigger value="balances" className="flex items-center gap-2">
                        <Wallet className="size-4" />
                        Balances
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <FileText className="size-4" />
                        Audit
                    </TabsTrigger>
                    <TabsTrigger value="approvals" className="flex items-center gap-2">
                        <ShieldCheck className="size-4" />
                        Approvals
                    </TabsTrigger>
                    <TabsTrigger value="amendments" className="flex items-center gap-2">
                        <FileEdit className="size-4" />
                        Amendments
                    </TabsTrigger>
                    <TabsTrigger value="policies" className="flex items-center gap-2">
                        <Settings className="size-4" />
                        Policies
                    </TabsTrigger>
                    <TabsTrigger value="accruals" className="flex items-center gap-2">
                        <CalendarCheck className="size-4" />
                        Accrual Rules
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <LeaveDashboardTab />
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
            </Tabs>
        </div>
    );
}
