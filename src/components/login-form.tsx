"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInEmailAction } from "@/actions/sign-in-email.action";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

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
      toast.success("Welcome back! You're now signed in.");
      router.push("/");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
          Email Address
        </Label>
        <Input 
          type="email" 
          id="email" 
          name="email" 
          placeholder="Enter your email"
          required
          className="h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
            Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:opacity-80 transition-all duration-150 ease-out"
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
            className="h-12 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
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

      <div className="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Remember me
        </label>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all duration-200" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          <>
            <ArrowRight className="w-5 h-5 mr-2" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
};