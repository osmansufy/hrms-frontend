"use client";

import Link from "next/link";
import { Package, Laptop, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyAssets } from "@/lib/queries/asset";
import { useMyUserMeta } from "@/lib/queries/user-meta";
import { formatDateInDhaka } from "@/lib/utils";

export default function EmployeeAssetsPage() {
  const { data, isLoading } = useMyAssets();
  const { data: userMeta } = useMyUserMeta();
  const allowAssetRequest = userMeta != null && userMeta.allowAssetRequest !== false;
  const assignments = data?.data ?? [];

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">My Assets</h1>
          <p className="text-sm text-muted-foreground">
            {allowAssetRequest
              ? "View assets assigned to you and request new ones"
              : "View assets assigned to you"}
          </p>
        </div>
        {allowAssetRequest && (
          <Link href="/dashboard/employee/assets/requests">
            <Button size="sm">
              <Package className="mr-2 size-4" />
              My Requests
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Laptop className="size-4" />
              Assigned assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-16 rounded bg-muted animate-pulse" />
                <div className="h-16 rounded bg-muted animate-pulse" />
              </div>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                {allowAssetRequest
                  ? "You have no assets assigned. Request one from the requests page."
                  : "You have no assets assigned."}
              </p>
            ) : (
              <ul className="space-y-3">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {a.asset?.assetTag ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {a.asset?.assetType?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Assigned {formatDateInDhaka(a.assignedAt, "long")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {allowAssetRequest && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="size-4" />
                Request an asset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Need a laptop, monitor, or other equipment? Submit a request and
                HR will review it.
              </p>
              <Link href="/dashboard/employee/assets/requests">
                <Button variant="outline" className="w-full sm:w-auto">
                  Go to My Requests
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
