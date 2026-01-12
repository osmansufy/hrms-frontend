"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCreateDesignation,
  useDesignationsList,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/lib/queries/designations";
import type { Designation } from "@/lib/api/designations";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  code: z.string().min(1, "Code is required"),
  level: z.number().min(1, "Level must be at least 1").max(20, "Level must not exceed 20").int("Level must be a whole number"),
});

type FormValues = z.infer<typeof schema>;

export default function DesignationsPage() {
  const { data, isLoading } = useDesignationsList();
  const createMutation = useCreateDesignation();
  const deleteMutation = useDeleteDesignation();

  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [deletingDesignation, setDeletingDesignation] = useState<Designation | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", code: "", level: 1 },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", code: "", level: 1 },
  });

  const updateMutation = useUpdateDesignation(editingDesignation?.id ?? "");

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Designation created");
      form.reset();
    } catch (error: any) {
      const errorMessage = typeof error?.response?.data?.message === 'string'
        ? error.response.data.message
        : error?.response?.data?.error || error?.message || "Unable to create designation";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (designation: Designation) => {
    setEditingDesignation(designation);
    editForm.reset({
      title: designation.title || designation.name || "",
      code: designation.code || "",
      level: designation.level || 1,
    });
  };

  const handleUpdate = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Designation updated");
      setEditingDesignation(null);
      editForm.reset();
    } catch (error: any) {
      const errorMessage = typeof error?.response?.data?.message === 'string'
        ? error.response.data.message
        : error?.response?.data?.error || error?.message || "Unable to update designation";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingDesignation) return;
    try {
      await deleteMutation.mutateAsync(deletingDesignation.id);
      toast.success("Designation deleted");
      setDeletingDesignation(null);
    } catch (error: any) {
      const errorMessage = typeof error?.response?.data?.message === 'string'
        ? error.response.data.message
        : error?.response?.data?.error || error?.message || "Unable to delete designation";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin · Organization</p>
          <h1 className="text-2xl font-semibold">Designations</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Designation list</CardTitle>
              <CardDescription>Fetched from `/designations`.</CardDescription>
            </div>
            {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="w-25">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((des) => (
                  <TableRow key={des.id}>
                    <TableCell className="font-semibold">{des.title || des.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{des.code}</TableCell>
                    <TableCell className="text-sm">{des.level || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(des)}
                          title="Edit designation"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingDesignation(des)}
                          title="Delete designation"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      No designations yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create designation</CardTitle>
            <CardDescription>Add a designation with title and code.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level (1-20)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          min={1}
                          max={20}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Hierarchy rank for career progression, salary bands, and reporting structure.
                        Examples: 1-3 (Junior), 4-7 (Mid), 8-12 (Senior), 13-16 (Manager), 17-20 (Executive)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 size-4" />
                      Create
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDesignation} onOpenChange={(open) => !open && setEditingDesignation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Designation</DialogTitle>
            <DialogDescription>Update the designation details below.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="SE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level (1-20)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        min={1}
                        max={20}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Hierarchy rank for career progression, salary bands, and reporting structure.
                      Examples: 1-3 (Junior), 4-7 (Mid), 8-12 (Senior), 13-16 (Manager), 17-20 (Executive)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDesignation(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDesignation} onOpenChange={(open) => !open && setDeletingDesignation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the designation &quot;{deletingDesignation?.title || deletingDesignation?.name}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

