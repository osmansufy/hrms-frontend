import { useSession } from '@/components/auth/session-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getManagerAttendanceRecords } from '@/lib/api/attendance';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import React from 'react'

export const AttendanceTab = () => {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data, isLoading } = useQuery({
    queryKey: ['subordinates-attendance-history', userId],
    queryFn: () => getManagerAttendanceRecords(userId || '', {
      page: '1',
      limit: '10',
      sortBy: 'date',
      sortOrder: 'desc',
    }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
        <CardDescription>View your team's attendance history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};