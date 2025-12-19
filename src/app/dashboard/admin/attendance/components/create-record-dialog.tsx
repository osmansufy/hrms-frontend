"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEmployees } from "@/lib/queries/employees";
import { useCreateAttendanceRecord } from "@/lib/queries/attendance";

const formSchema = z.object({
    userId: z.string().min(1, "User is required"),
    date: z.string().min(1, "Date is required").refine((date) => {
        return new Date(date) <= new Date();
    }, "Date cannot be in the future"),
    signIn: z.string().min(1, "Sign in time is required"),
    signOut: z.string().optional(),
    signInLocation: z.string().optional(),
    isLate: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateRecordDialog() {
    const [open, setOpen] = useState(false);
    const { data: employees } = useEmployees();
    const createMutation = useCreateAttendanceRecord();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: "",
            date: new Date().toISOString().split("T")[0],
            signIn: "09:00",
            signOut: "",
            signInLocation: "Office",
            isLate: false,
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Combine date and time for ISO strings
            const signInDateTime = new Date(`${values.date}T${values.signIn}`);
            let signOutDateTime = null;

            if (values.signOut) {
                signOutDateTime = new Date(`${values.date}T${values.signOut}`).toISOString();
            }

            await createMutation.mutateAsync({
                userId: values.userId,
                date: values.date,
                signIn: signInDateTime.toISOString(),
                signOut: signOutDateTime,
                signInLocation: values.signInLocation,
                isLate: values.isLate,
            });

            toast.success("Attendance record created");
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create record");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Record
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Attendance Record</DialogTitle>
                    <DialogDescription>
                        Manually create an attendance entry for an employee.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {employees?.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.userId || employee.id}>
                                                    {employee.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="signIn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sign In</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="signOut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sign Out</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="signInLocation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Office" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isLate"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Mark as Late</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={createMutation.isPending} className="w-full">
                            {createMutation.isPending && "Creating..."}
                            {!createMutation.isPending && "Create Record"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
