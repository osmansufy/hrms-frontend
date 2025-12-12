"use client";

import { useSession } from "@/components/auth/session-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="text-2xl font-semibold">Your profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Mock data sourced from the local session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileRow label="Name" value={session?.user.name || "N/A"} />
          <ProfileRow label="Email" value={session?.user.email || "N/A"} />
          <ProfileRow label="Role" value={session?.user.roles.join(", ") || "N/A"} />
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold">Authenticated (mock)</p>
            </div>
            <Badge variant="secondary">Local session</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
      <Separator className="mt-2" />
    </div>
  );
}
