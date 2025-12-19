"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { SignInView } from "./sign-in-view";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  return <SignInView callbackUrl={callbackUrl} roleParam="member" />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
