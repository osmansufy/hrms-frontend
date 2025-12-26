import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export interface LeavePieChartProps {
    data: { name: string; value: number; color: string }[];
}

export function LeavePieChart({ data }: LeavePieChartProps) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}
