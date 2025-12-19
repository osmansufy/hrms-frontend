"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock4, LogOut, MapPin } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSignIn, useSignOut, useTodayAttendance } from "@/lib/queries/attendance";
import { AttendanceStatsCard } from "./components/stats-card";
import { AttendanceHistoryTab } from "./components/history-tab";

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AttendancePage() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [location, setLocation] = useState("");

  const { data, isLoading, error, isFetching } = useTodayAttendance(userId);
  const signInMutation = useSignIn(userId);
  const signOutMutation = useSignOut(userId);

  const status = useMemo(() => {
    if (isLoading) return "Checking status…";
    if (!data) return "Not signed in";
    if (data.signOut) return "Signed out";
    return "Signed in";
  }, [data, isLoading]);

  const handleSignIn = async () => {
    try {
      await signInMutation.mutateAsync({ location: location || undefined });
      toast.success("Signed in");
    } catch (err) {
      console.error(err);
      toast.error("Sign-in failed");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync({ location: location || undefined });
      toast.success("Signed out");
    } catch (err) {
      console.error(err);
      toast.error("Sign-out failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Presence</p>
          <h1 className="text-2xl font-semibold">Attendance</h1>
        </div>
        <Badge variant={data?.isLate ? "destructive" : "secondary"}>
          <Clock4 className="mr-1 size-4" />
          {status}
        </Badge>
      </div>

      <AttendanceStatsCard />

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Today&apos;s log</CardTitle>
              <CardDescription>
                Check in when you start and check out when you finish. Times are recorded server-side.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Unable to load today&apos;s attendance. Try again after signing in.
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">{status}</Badge>
                {data?.isLate && <Badge variant="destructive">Late</Badge>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Sign in" value={formatTime(data?.signIn)} />
                <InfoRow label="Sign out" value={formatTime(data?.signOut)} />
                <InfoRow label="Check-in location" value={data?.signInLocation || "—"} />
                <InfoRow label="Check-out location" value={data?.signOutLocation || "—"} />
              </div>
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="size-4 text-muted-foreground" />
                    Location (optional)
                  </div>
                  <Input
                    placeholder="Remote / Office / Client site"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSignIn}
                    disabled={isLoading || signInMutation.isPending || Boolean(data && !data.signOut)}
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    Sign in
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    disabled={!data || Boolean(data?.signOut) || signOutMutation.isPending}
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </Button>
                </div>
              </div>
              {(isFetching || signInMutation.isPending || signOutMutation.isPending) && (
                <p className="text-xs text-muted-foreground">Updating attendance…</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <AttendanceHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
