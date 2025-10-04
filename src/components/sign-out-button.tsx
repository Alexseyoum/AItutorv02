"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const SignOutButton = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setIsPending(true);
    
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Signed out successfully");
        router.push("/");
      } else {
        toast.error("Failed to sign out");
      }
    } catch (error) {
      toast.error("An error occurred during sign out");
      console.error("Sign out error:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isPending}
      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 dark:hover:border-red-700 flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Signing out..." : "Sign Out"}
    </Button>
  );
};