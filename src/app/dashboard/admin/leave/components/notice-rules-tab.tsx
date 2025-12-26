import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash } from "lucide-react";

// Placeholder for API hooks
// Replace with real hooks for CRUD
const useNoticeRules = () => {
    const [data, setData] = useState([
        { id: 1, minLength: 1, maxLength: 3, noticeDays: 2 },
        { id: 2, minLength: 4, maxLength: null, noticeDays: 5 },
    ]);
    return { data, isLoading: false, refetch: () => { } };
};

export function NoticeRulesTab() {
    const { data: rules, isLoading } = useNoticeRules();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [form, setForm] = useState({ minLength: "", maxLength: "", noticeDays: "" });

    const handleOpen = (rule: any) => {
        setEditingRule(rule);
        setForm({
            minLength: rule?.minLength?.toString() || "",
            maxLength: rule?.maxLength?.toString() || "",
            noticeDays: rule?.noticeDays?.toString() || "",
        });
        setIsDialogOpen(true);
    };

    const handleClose = () => {
        setEditingRule(null);
        setForm({ minLength: "", maxLength: "", noticeDays: "" });
        setIsDialogOpen(false);
    };

    // Replace with real create/update/delete logic
    const handleSave = () => { handleClose(); };
    const handleDelete = (id: string | number) => { };

    return (
        <div className="space-y-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Card>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Leave Notice Rules</h2>
                            <Button onClick={() => handleOpen(null)}><Plus className="mr-2 size-4" />Add Rule</Button>
                        </div>
                        <div className="p-4">
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/4">Min Length</TableHead>
                                            <TableHead className="w-1/4">Max Length</TableHead>
                                            <TableHead className="w-1/4">Notice Days</TableHead>
                                            <TableHead className="w-1/4 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rules.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">No notice rules defined.</TableCell>
                                            </TableRow>
                                        ) : (
                                            rules.map((rule) => (
                                                <TableRow key={rule.id}>
                                                    <TableCell>{rule.minLength ?? "-"}</TableCell>
                                                    <TableCell>{rule.maxLength ?? "-"}</TableCell>
                                                    <TableCell>{rule.noticeDays}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleOpen(rule)}><Edit className="size-4" /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}><Trash className="size-4" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </Card>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRule ? "Edit Notice Rule" : "Add Notice Rule"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <Input
                                type="number"
                                placeholder="Min Length"
                                value={form.minLength}
                                onChange={e => setForm(f => ({ ...f, minLength: e.target.value }))}
                            />
                            <Input
                                type="number"
                                placeholder="Max Length (blank for no max)"
                                value={form.maxLength}
                                onChange={e => setForm(f => ({ ...f, maxLength: e.target.value }))}
                            />
                            <Input
                                type="number"
                                placeholder="Notice Days"
                                value={form.noticeDays}
                                onChange={e => setForm(f => ({ ...f, noticeDays: e.target.value }))}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSave}>{editingRule ? "Update" : "Add"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
