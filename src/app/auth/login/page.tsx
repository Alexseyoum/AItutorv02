import { LoginForm } from "@/components/login-form";
import { SignInOauthButton } from "@/components/sign-in-oauth-button";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Navigation } from "@/components/ui/navigation";

export default function Page() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <Navigation showBackButton={true} backLabel="Home" />

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 pt-8 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue your learning journey
            </p>
          </div>

          <div className="space-y-6">
            <LoginForm />

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link 
                href="/auth/register" 
                className="font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-all duration-150 ease-out"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <SignInOauthButton provider="google" />
            <SignInOauthButton provider="github" />
          </div>
        </div>
      </main>
    </div>
  );
}