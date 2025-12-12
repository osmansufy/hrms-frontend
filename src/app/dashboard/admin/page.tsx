"use client";

import { ArrowUpRight, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { employees } from "@/lib/data/employees";

const departmentCounts = Object.values(
  employees.reduce<Record<string, number>>((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {}),
).length;

const chartData = Object.entries(
  employees.reduce<Record<string, { active: number; onLeave: number }>>(
    (acc, emp) => {
      acc[emp.department] = acc[emp.department] || { active: 0, onLeave: 0 };
      if (emp.status === "On Leave") {
        acc[emp.department].onLeave += 1;
      } else if (emp.status === "Active") {
        acc[emp.department].active += 1;
      }
      return acc;
    },
    {},
  ),
).map(([department, { active, onLeave }]) => ({ department, active, onLeave }));

export function DashboardOverview() {
  const headcount = employees.length;
  const active = employees.filter((e) => e.status === "Active").length;
  const onLeave = employees.filter((e) => e.status === "On Leave").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold">People overview</h1>
        </div>
        <Badge variant="secondary" className="text-xs">
          Mock data — ready for backend wiring
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Headcount" value={headcount} helper="Total employees" />
        <MetricCard label="Active" value={active} helper="Currently active" accent />
        <MetricCard label="On leave" value={onLeave} helper="Leave this month" />
        <MetricCard
          label="Teams"
          value={departmentCounts}
          helper="Departments represented"
          icon={<Users className="size-5 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Workforce by department</CardTitle>
              <CardDescription>Active vs on-leave by department</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onLeave" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest people moves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {employees.slice(0, 5).map((emp) => (
              <div key={emp.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.title} · {emp.department}
                  </p>
                </div>
                <Badge variant={emp.status === "Active" ? "default" : "secondary"}>
                  {emp.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardOverview />;
}

function MetricCard({
  label,
  value,
  helper,
  accent,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon || (accent ? <ArrowUpRight className="size-4 text-primary" /> : null)}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
