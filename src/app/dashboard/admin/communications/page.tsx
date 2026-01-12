"use client";

import { useEffect, useMemo, useState } from "react";
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
        <div className="container p-6 space-y-6">
            <h1 className="text-xl font-semibold">Admin Communications</h1>

            {/* Rate Limit Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-3xl">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Rate Limit Notice - Resend Free Plan</h3>
                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                            You can only send 2 emails per second. Sending to all active employees may trigger rate limits.
                            Consider selecting specific employees or using preview mode first.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium dark:text-gray-200">Subject</span>
                        <input
                            className="mt-1 w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Holiday Schedule"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium dark:text-gray-200">Message</span>
                        <textarea
                            className="mt-1 w-full border dark:border-gray-600 rounded px-3 py-2 h-40 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                        className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        placeholder="Department ID (optional)"
                    />
                    <input
                        className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        value={designationId}
                        onChange={(e) => setDesignationId(e.target.value)}
                        placeholder="Designation ID (optional)"
                    />
                    <input
                        className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email (optional)"
                    />
                </div>

                {!allActive && (
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">Select employees</label>
                        <select
                            multiple
                            className="w-full border dark:border-gray-600 rounded px-3 py-2 h-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                        className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {sending ? "Sending…" : preview ? "Preview" : "Send"}
                    </button>
                    {error && <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>}
                </div>
            </form>

            {result && (
                <div className="border dark:border-gray-600 rounded p-4 bg-gray-50 dark:bg-gray-800">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
                Tips: Use {'{{firstName}}'} or {'{{name}}'} in your message for personalization.
            </p>
        </div>
    );
}
