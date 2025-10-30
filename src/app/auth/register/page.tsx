import { RegisterForm } from "@/components/register-form";
import { SignInOauthButton } from "@/components/sign-in-oauth-button";
import { Rocket } from "lucide-react";
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
              <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Join TutorByAI and start your learning journey
            </p>
          </div>

          <div className="space-y-6">
            <RegisterForm />

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link 
                href="/auth/login" 
                className="font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-all duration-150 ease-out"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                Or sign up with
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <SignInOauthButton provider="google" signUp />
            <SignInOauthButton provider="github" signUp />
          </div>
        </div>
      </main>
    </div>
  );
}