"use client";

import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHasPermission } from "@/modules/shared/hooks/use-permissions";

export default function ApprovalsPage() {
  const canApprove = useHasPermission("leave.approve");

  if (!canApprove) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insufficient permissions</CardTitle>
          <CardDescription>You cannot approve leave requests.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Leave workflows</p>
          <h1 className="text-2xl font-semibold">Approve requests</h1>
        </div>
        <ShieldCheck className="size-6 text-primary" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No pending requests</CardTitle>
          <CardDescription>When requests arrive, you can approve them here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Approve selected</Button>
        </CardContent>
      </Card>
    </div>
  );
}
