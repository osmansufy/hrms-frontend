"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, Loader2, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changePassword, type ChangePasswordPayload } from "@/lib/api/auth";
import { toast } from "sonner";
import { useSession } from "@/components/auth/session-provider";

export default function PasswordChangePage() {
    const router = useRouter();
    const { signOut } = useSession();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationError, setValidationError] = useState("");

    const changePasswordMutation = useMutation({
        mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
        onSuccess: async (data) => {
            toast.success(data.message || "Password changed successfully");
            // Sign out user and redirect to login
            await signOut();
            router.push("/login?message=password-changed");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || "Failed to change password";
            toast.error(message);
        },
    });

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return "Password must be at least 8 characters long";
        }
        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter";
        }
        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter";
        }
        if (!/[\d\W]/.test(password)) {
            return "Password must contain at least one number or special character";
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError("");

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            setValidationError("All fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setValidationError("New passwords do not match");
            return;
        }

        if (currentPassword === newPassword) {
            setValidationError("New password must be different from current password");
            return;
        }

        const passwordValidation = validatePassword(newPassword);
        if (passwordValidation) {
            setValidationError(passwordValidation);
            return;
        }

        changePasswordMutation.mutate({
            currentPassword,
            newPassword,
        });
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="container space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">Account Security</p>
                <h1 className="text-2xl font-semibold">Change Password</h1>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Update Your Password
                    </CardTitle>
                    <CardDescription>
                        Ensure your account is using a strong password to stay secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {validationError && (
                            <Alert variant="destructive">
                                <AlertDescription>{validationError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Current Password */}
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    required
                                    disabled={changePasswordMutation.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter your new password"
                                    required
                                    disabled={changePasswordMutation.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Must be at least 8 characters with uppercase, lowercase, and number/special character
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your new password"
                                    required
                                    disabled={changePasswordMutation.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Alert>
                            <Lock className="h-4 w-4" />
                            <AlertDescription>
                                After changing your password, you will be logged out and need to sign in again with your new password.
                            </AlertDescription>
                        </Alert>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={changePasswordMutation.isPending}
                                className="flex-1"
                            >
                                {changePasswordMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    "Change Password"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={changePasswordMutation.isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Password Requirements */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-base">Password Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>Minimum 8 characters long</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>At least one uppercase letter (A-Z)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>At least one lowercase letter (a-z)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>At least one number (0-9) or special character (!@#$%^&*)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>Must be different from your current password</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
