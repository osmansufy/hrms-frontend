"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

export interface EmployeeOption {
    value: string;
    label: string;
    code?: string;
    department?: string;
}

interface EmployeeComboboxProps {
    options: EmployeeOption[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    /** When provided, an "all" option is prepended with this label */
    allLabel?: string;
    className?: string;
    disabled?: boolean;
}

export function EmployeeCombobox({
    options,
    value,
    onValueChange,
    placeholder = "Select employee",
    allLabel,
    className,
    disabled,
}: EmployeeComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Close on outside click
    React.useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Focus input when opened
    React.useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return options;
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(q) ||
                opt.code?.toLowerCase().includes(q) ||
                opt.department?.toLowerCase().includes(q)
        );
    }, [options, search]);

    const selected = value === "all" ? null : options.find((o) => o.value === value);

    const triggerLabel = selected
        ? `${selected.label}${selected.code ? ` (${selected.code})` : ""}`
        : allLabel && value === "all"
          ? allLabel
          : placeholder;

    const isAllSelected = allLabel !== undefined && value === "all";

    function handleSelect(val: string) {
        onValueChange(val);
        setOpen(false);
        setSearch("");
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className={cn(
                    "w-full justify-between font-normal text-left",
                    !selected && !isAllSelected && "text-muted-foreground"
                )}
            >
                <span className="truncate">{triggerLabel}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-md border bg-popover shadow-md">
                    {/* Search */}
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            placeholder="Search…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setOpen(false);
                                    setSearch("");
                                }
                            }}
                            className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Options */}
                    <ul
                        role="listbox"
                        className="max-h-60 overflow-y-auto py-1 text-sm"
                    >
                        {allLabel && !search && (
                            <li
                                role="option"
                                aria-selected={value === "all"}
                                onClick={() => handleSelect("all")}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                                    value === "all" && "bg-accent/50 font-medium"
                                )}
                            >
                                <Check
                                    className={cn(
                                        "h-4 w-4 shrink-0",
                                        value === "all" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {allLabel}
                            </li>
                        )}

                        {filtered.length === 0 ? (
                            <li className="px-3 py-6 text-center text-muted-foreground">
                                No employees found
                            </li>
                        ) : (
                            filtered.map((opt) => (
                                <li
                                    key={opt.value}
                                    role="option"
                                    aria-selected={opt.value === value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                                        opt.value === value && "bg-accent/50"
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            "h-4 w-4 shrink-0",
                                            opt.value === value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="flex-1 truncate">
                                        <span className="font-medium">{opt.label}</span>
                                        {opt.code && (
                                            <span className="ml-1.5 text-xs text-muted-foreground">
                                                {opt.code}
                                            </span>
                                        )}
                                        {opt.department && (
                                            <span className="ml-1.5 text-xs text-muted-foreground">
                                                · {opt.department}
                                            </span>
                                        )}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
