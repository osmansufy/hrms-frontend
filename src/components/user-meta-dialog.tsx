"use client";

import { useState, useEffect } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUserMeta, useUpdateUserMeta } from "@/lib/queries/user-meta";
import { Switch } from "@/components/ui/switch";

interface UserMetaDialogProps {
  userId: string;
  userName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserMetaDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: UserMetaDialogProps) {
  const { data: meta, isLoading } = useUserMeta(open ? userId : undefined);
  const updateMutation = useUpdateUserMeta(userId);
  const [allowMobileSignIn, setAllowMobileSignIn] = useState(true);

  useEffect(() => {
    if (meta) {
      setAllowMobileSignIn(meta.allowMobileSignIn);
    }
  }, [meta]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({ allowMobileSignIn });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Access settings
          </DialogTitle>
          <DialogDescription>
            {userName
              ? `Per-user access overrides for ${userName}. When system allows mobile attendance, this controls whether this user can sign in from mobile devices.`
              : "Per-user access overrides. When system allows mobile attendance, this controls whether this user can sign in from mobile devices."}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="allow-mobile" className="text-base">
                  Allow mobile sign-in
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow this user to mark attendance from mobile devices (when system setting allows mobile attendance).
                </p>
              </div>
              <Switch
                id="allow-mobile"
                checked={allowMobileSignIn}
                onCheckedChange={setAllowMobileSignIn}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
