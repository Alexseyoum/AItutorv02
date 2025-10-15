"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInEmailAction } from "@/actions/sign-in-email.action";
import Link from "next/link";
import { LogIn, Eye, EyeOff } from "lucide-react";

export const LoginForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success("Welcome back! Let's continue learning! 🎉");
      router.push("/");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-semibold text-base">
          📧 Email Address
        </Label>
        <Input 
          type="email" 
          id="email" 
          name="email" 
          placeholder="Enter your email address"
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-semibold text-base">
            🔐 Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium gradient-text-primary hover:opacity-80 transition-all duration-150 ease-out"
          >
            Forgot password?
          </Link>
        </div>

        <div className="relative">
          <Input 
            type={showPassword ? "text" : "password"} 
            id="password" 
            name="password" 
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-150 ease-out"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <Button 
        type="submit" 
        variant="gradient"
        size="lg"
        className="w-full animate-scale-in delay-100" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Signing you in...
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            Let's Go! &#x1F680;
          </>
        )}
      </Button>
    </form>
  );
};