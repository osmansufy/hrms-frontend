"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSystemSettings } from "@/lib/queries/system-settings";

type TimezoneContextValue = {
    timezone: string;
    isLoading: boolean;
};

const TimezoneContext = createContext<TimezoneContextValue | undefined>(
    undefined
);

export function TimezoneProvider({ children }: { children: ReactNode }) {
    const { data: settings, isLoading } = useSystemSettings();

    // Fallback to Asia/Dhaka if settings not loaded yet
    const timezone = settings?.timezone || "Asia/Dhaka";

    return (
        <TimezoneContext.Provider value={{ timezone, isLoading }}>
            {children}
        </TimezoneContext.Provider>
    );
}

export function useTimezone() {
    const context = useContext(TimezoneContext);
    if (context === undefined) {
        throw new Error("useTimezone must be used within a TimezoneProvider");
    }
    return context;
}
