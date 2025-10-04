"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInEmailAction } from "@/actions/sign-in-email.action";
import Link from "next/link";

export const LoginForm = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(evt: React.FormEvent<HTMLFormElement>) {
    evt.preventDefault();

    setIsPending(true);

    const formData = new FormData(evt.currentTarget);

    const { error } = await signInEmailAction(formData);

    if (error) {
      toast.error(error);
      setIsPending(false);
    } else {
      toast.success("Login successful. Good to have you back.");
      router.push("/profile");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
          Email
        </Label>
        <Input 
          type="email" 
          id="email" 
          name="email" 
          className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
          placeholder="Enter your email"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center gap-2">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
            Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Input 
          type="password" 
          id="password" 
          name="password" 
          className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
          placeholder="Enter your password"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200" 
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};