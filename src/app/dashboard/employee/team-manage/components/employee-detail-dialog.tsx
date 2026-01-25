"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCardTab } from "./job-card-tab";
import { SubordinateLeaveRecordsTab } from "./subordinate-leave-records-tab";
import { SubordinateAttendanceRecordsTab } from "./subordinate-attendance-records-tab";

interface EmployeeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subordinateUserId: string;
  subordinateEmployeeId: string;
  subordinateName: string;
}

export function EmployeeDetailDialog({
  open,
  onOpenChange,
  subordinateUserId,
  subordinateEmployeeId,
  subordinateName,
}: EmployeeDetailDialogProps) {
  const [activeTab, setActiveTab] = useState("job-card");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>{subordinateName}</DialogTitle>
          <DialogDescription>
            View employee details, leave records, and attendance history
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="job-card" className="text-xs sm:text-sm">
              Job Card
            </TabsTrigger>
            <TabsTrigger value="leaves" className="text-xs sm:text-sm">
              Leave Records
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs sm:text-sm">
              Attendance Records
            </TabsTrigger>
          </TabsList>
          <TabsContent value="job-card" className="mt-4">
            <JobCardTab
              employeeId={subordinateEmployeeId}
              userId={subordinateUserId}
            />
          </TabsContent>
          <TabsContent value="leaves" className="mt-4">
            <SubordinateLeaveRecordsTab userId={subordinateUserId} />
          </TabsContent>
          <TabsContent value="attendance" className="mt-4">
            <SubordinateAttendanceRecordsTab userId={subordinateUserId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
