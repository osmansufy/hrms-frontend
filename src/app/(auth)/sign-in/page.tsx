"use client";

import { useSearchParams } from "next/navigation";

import { SignInView } from "./sign-in-view";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  return <SignInView callbackUrl={callbackUrl} roleParam="member" />;
}
