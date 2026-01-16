"use client";

import { AttendanceBarChart } from "./attendance-bar-chart";
import { AttendancePieChart } from "./attendance-pie-chart";

interface AttendanceChartsProps {
  attendanceBarData: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
  }>;
}

export function AttendanceCharts({ attendanceBarData }: AttendanceChartsProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Attendance Overview</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <AttendanceBarChart data={attendanceBarData} />
        </div>
        <div>
          <AttendancePieChart />
        </div>
      </div>
    </div>
  );
}
