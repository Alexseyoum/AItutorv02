"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

interface SignInOauthButtonProps {
  provider: "google" | "github";
  signUp?: boolean;
}

export const SignInOauthButton = ({
  provider,
  signUp,
}: SignInOauthButtonProps) => {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);

    await signIn.social({
      provider,
      callbackURL: "/",
      errorCallbackURL: "/auth/login/error",
    });

    setIsPending(false);
  }

  const action = signUp ? "Up" : "In";
  const providerName = provider === "google" ? "Google" : "GitHub";
  const emoji = provider === "google" ? "🌟" : "🚀";

  return (
    <Button 
      onClick={handleClick} 
      disabled={isPending}
      variant="outline"
      size="lg"
      className="w-full transition-all duration-300 ease-bounce hover:scale-105"
    >
      {isPending ? (
        <>
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          {emoji} Sign {action} with {providerName}
        </>
      )}
    </Button>
  );
};