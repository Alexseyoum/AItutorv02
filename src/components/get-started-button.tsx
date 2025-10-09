"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const GetStartedButton = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Button size="xl" variant="fun" className="opacity-50 min-w-[200px]" asChild>
        <span>
          <Sparkles className="w-5 h-5" />
          Get Started
        </span>
      </Button>
    );
  }

  const href = session ? "/" : "/auth/login";
  const text = session ? "Continue Learning" : "Start Learning";

  return (
    <div className="flex flex-col items-center gap-4">
      <Button size="xl" variant="fun" className="min-w-[200px] animate-bounce-in" asChild>
        <Link href={href}>
          <Sparkles className="w-5 h-5" />
          {text}
        </Link>
      </Button>

      {session && (
        <p className="flex items-center gap-2 animate-fade-in delay-200 text-center">
          <span
            data-role={session.user.role}
            className="size-3 rounded-full animate-pulse data-[role=USER]:bg-gradient-to-r data-[role=USER]:from-blue-500 data-[role=USER]:to-purple-600 data-[role=ADMIN]:bg-gradient-to-r data-[role=ADMIN]:from-red-500 data-[role=ADMIN]:to-pink-600"
          />
          <span className="text-gray-600 dark:text-gray-300">
            Welcome back, <span className="font-semibold gradient-text-primary">{session.user.name}</span>! 🚀
          </span>
        </p>
      )}
    </div>
  );
};