"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      variant="destructive"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </Button>
  );
};