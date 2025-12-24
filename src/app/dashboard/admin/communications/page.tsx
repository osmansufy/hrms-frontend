"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";

type EmployeeOption = { id: string; label: string };

export default function AdminCommunicationsPage() {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [allActive, setAllActive] = useState(true);
    const [preview, setPreview] = useState(false);
    const [departmentId, setDepartmentId] = useState("");
    const [designationId, setDesignationId] = useState("");
    const [search, setSearch] = useState("");
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load employees for selection
        async function loadEmployees() {
            setLoading(true);
            setError(null);
            try {
                const res = await apiClient.get("/employees", {
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
        <div className="p-6 space-y-6">
            <h1 className="text-xl font-semibold">Admin Communications</h1>
            <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium">Subject</span>
                        <input
                            className="mt-1 w-full border rounded px-3 py-2"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Holiday Schedule"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium">Message</span>
                        <textarea
                            className="mt-1 w-full border rounded px-3 py-2 h-40"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={"Use {{firstName}} or {{name}} in your message.\nExample: Our office will be closed on Dec 31.\nHappy New Year!"}
                        />
                    </label>
                </div>

                <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={allActive} onChange={(e) => setAllActive(e.target.checked)} />
                        <span>All active employees</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
                        <span>Preview only</span>
                    </label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <input
                        className="border rounded px-3 py-2"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        placeholder="Department ID (optional)"
                    />
                    <input
                        className="border rounded px-3 py-2"
                        value={designationId}
                        onChange={(e) => setDesignationId(e.target.value)}
                        placeholder="Designation ID (optional)"
                    />
                    <input
                        className="border rounded px-3 py-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email (optional)"
                    />
                </div>

                {!allActive && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Select employees</label>
                        <select
                            multiple
                            className="w-full border rounded px-3 py-2 h-56"
                            value={selectedIds}
                            onChange={(e) =>
                                setSelectedIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                            }
                        >
                            {loading ? (
                                <option>Loading…</option>
                            ) : (
                                employees.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.label}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={!canSend || sending}
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {sending ? "Sending…" : preview ? "Preview" : "Send"}
                    </button>
                    {error && <span className="text-red-600 text-sm">{error}</span>}
                </div>
            </form>

            {result && (
                <div className="border rounded p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}

            <p className="text-xs text-gray-500">
                Tips: Use {'{{firstName}}'} or {'{{name}}'} in your message for personalization.
            </p>
        </div>
    );
}
