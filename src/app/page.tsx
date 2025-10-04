import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import TutoringClient from "@/components/tutoring-client";

export default async function Home() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList
  });

  if (!session) {
    redirect('/auth/login');
  }

  return <TutoringClient user={session.user} />;
}
