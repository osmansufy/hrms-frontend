import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface AttendanceBarChartProps {
    data: { date: string; present: number; late: number; absent: number }[];
}

export function AttendanceBarChart({ data }: AttendanceBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="present" fill="#4ade80" name="Present" />
                <Bar dataKey="late" fill="#fbbf24" name="Late" />
                <Bar dataKey="absent" fill="#f87171" name="Absent" />
            </BarChart>
        </ResponsiveContainer>
    );
}
