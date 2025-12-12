"use client";

import { useParams, useSearchParams } from "next/navigation";

import { SignInView } from "../sign-in-view";

export default function RoleSignInPage() {
  const params = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  return <SignInView roleParam={params.role} callbackUrl={callbackUrl} />;
}
