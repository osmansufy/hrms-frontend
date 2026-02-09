"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ResetPasswordView } from "./reset-password-view";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? null;
  return <ResetPasswordView token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
