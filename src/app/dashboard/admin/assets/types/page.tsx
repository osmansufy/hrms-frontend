"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
} from "@/lib/queries/asset";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "sonner";
import { AssetTypeFormDialog } from "./components/asset-type-form-dialog";
import type { AssetType } from "@/lib/api/asset";
import Link from "next/link";

export default function AdminAssetTypesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);

  const { data: types, isLoading } = useAssetTypes(false);
  const list = types ?? [];

  return (
    <div className="container space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inventory
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Asset Types
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage asset categories (e.g. Laptop, Monitor)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/admin/assets">
            <Button variant="outline" size="sm">
              Assets
            </Button>
          </Link>
          <Link href="/dashboard/admin/assets/requests">
            <Button variant="outline" size="sm">
              Requests
            </Button>
          </Link>
          <Button size="sm" onClick={() => { setEditingType(null); setFormOpen(true); }}>
            <Plus className="mr-2 size-4" />
            Add type
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4" />
            Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={4} rows={6} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No asset types. Add one to categorize assets.
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm">{t.code}</TableCell>
                        <TableCell>{t.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {t.description ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.isActive ? "default" : "secondary"}>
                            {t.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingType(t); setFormOpen(true); }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssetTypeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingType(null);
        }}
        editing={editingType}
      />
    </div>
  );
}
