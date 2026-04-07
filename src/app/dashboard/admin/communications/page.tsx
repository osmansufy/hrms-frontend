"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";

type EmployeeOption = { id: string; label: string };

export default function AdminCommunicationsPage() {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [allActive, setAllActive] = useState(false);
    const [preview, setPreview] = useState(false);
    const [departmentId, setDepartmentId] = useState("");
    const [designationId, setDesignationId] = useState("");
    const [search, setSearch] = useState("");
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadEmployees() {
            setLoading(true);
            setError(null);
            try {
                const res = await apiClient.get("/employees/admin", {
                    params: {
                        departmentId: departmentId || undefined,
                        designationId: designationId || undefined,
                        search: search || undefined,
                    },
                });
                const list: EmployeeOption[] = (res.data?.data ?? res.data ?? []).map(
                    (e: any) => ({ id: e.id ?? e.userId ?? e.user?.id, label: `${e.firstName ?? e.user?.name ?? ""} ${e.lastName ?? ""}`.trim() })
                );
                setEmployees(list);
            } catch (e: any) {
                setError(e?.message || "Failed to fetch employees");
            } finally {
                setLoading(false);
            }
        }
        loadEmployees();
    }, [departmentId, designationId, search]);

    const canSend = useMemo(() => {
        if (!subject.trim() || !message.trim()) return false;
        if (!allActive && selectedIds.length === 0) return false;
        return true;
    }, [subject, message, allActive, selectedIds]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError(null);
        setResult(null);
        try {
            const body: any = {
                subject,
                message,
                preview,
            };
            if (allActive) {
                body.allActive = true;
            } else {
                body.employeeIds = selectedIds;
            }
            if (departmentId) body.departmentId = departmentId;
            if (designationId) body.designationId = designationId;
            if (search) body.search = search;

            const res = await apiClient.post("/mail/bulk", body);
            setResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || "Failed to send emails");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="container space-y-6">
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Notifications
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Communications</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Send bulk emails to employees across the organization
                </p>
            </div>

            <Alert variant="default" className="max-w-3xl border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600">
                <AlertTriangle className="size-4" />
                <AlertTitle>Rate Limit Notice — Resend Free Plan</AlertTitle>
                <AlertDescription>
                    You can only send 2 emails per second. Sending to all active employees may trigger rate limits.
                    Consider selecting specific employees or using preview mode first.
                </AlertDescription>
            </Alert>

            <Card className="max-w-3xl">
                <CardHeader>
                    <CardTitle>Compose Email</CardTitle>
                    <CardDescription>
                        Use {"{{firstName}}"} or {"{{name}}"} in your message for personalization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="email-subject">Subject</Label>
                            <Input
                                id="email-subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Holiday Schedule"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email-message">Message</Label>
                            <Textarea
                                id="email-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={"Use {{firstName}} or {{name}} in your message.\nExample: Our office will be closed on Dec 31.\nHappy New Year!"}
                                rows={7}
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="all-active"
                                    checked={allActive}
                                    onCheckedChange={(v) => setAllActive(v === true)}
                                />
                                <Label htmlFor="all-active" className="font-normal">All active employees</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="preview-mode"
                                    checked={preview}
                                    onCheckedChange={(v) => setPreview(v === true)}
                                />
                                <Label htmlFor="preview-mode" className="font-normal">Preview only</Label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="dept-filter">Department ID</Label>
                                <Input
                                    id="dept-filter"
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="desig-filter">Designation ID</Label>
                                <Input
                                    id="desig-filter"
                                    value={designationId}
                                    onChange={(e) => setDesignationId(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="search-filter">Search</Label>
                                <Input
                                    id="search-filter"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or email"
                                />
                            </div>
                        </div>

                        {!allActive && (
                            <div className="space-y-1.5">
                                <Label>Select employees</Label>
                                <div className="rounded-md border bg-background">
                                    <select
                                        multiple
                                        className="w-full rounded-md bg-transparent px-3 py-2 text-sm h-56 focus:outline-none"
                                        value={selectedIds}
                                        onChange={(e) =>
                                            setSelectedIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                                        }
                                    >
                                        {loading ? (
                                            <option>Loading…</option>
                                        ) : (
                                            employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.label}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Hold Ctrl/Cmd to select multiple employees
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={!canSend || sending} className="gap-2">
                                {sending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Send className="size-4" />
                                )}
                                {sending ? "Sending…" : preview ? "Preview" : "Send"}
                            </Button>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <Card className="max-w-3xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{JSON.stringify(result, null, 2)}</pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
