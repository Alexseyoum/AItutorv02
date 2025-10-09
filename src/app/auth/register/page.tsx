import { RegisterForm } from "@/components/register-form";
import { SignInOauthButton } from "@/components/sign-in-oauth-button";
import { Brain, Sparkles, Star, Rocket } from "lucide-react";
import Link from "next/link";
import { Navigation } from "@/components/ui/navigation";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 relative overflow-hidden">
      {/* Fun Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-r from-green-300 to-blue-400 rounded-full opacity-10 animate-float"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-10 animate-float delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-10 animate-float delay-2000"></div>
      </div>

      {/* Navigation */}
      <Navigation showBackButton={true} backLabel="Home" />

      {/* Main Content */}
      <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-20">
        <div className="bg-white/90 dark:bg-gray-800/90 glass-strong rounded-3xl p-8 border border-white/30 shadow-2xl animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-4 animate-pulse-glow">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-h1 text-gray-900 dark:text-white mb-2">
              Join the Adventure! 🎆
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-readable">
              Create your account and start your amazing learning journey with AI!
            </p>
            
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Star className="w-4 h-4" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span>Super Fun</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <RegisterForm />

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link 
                href="/auth/login" 
                className="font-semibold gradient-text-primary hover:opacity-80 transition-all duration-150 ease-out"
              >
                Welcome back! 👋
              </Link>
            </p>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                Or join with
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <SignInOauthButton provider="google" signUp />
            <SignInOauthButton provider="github" signUp />
          </div>
          
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Safe for kids & teens - Parent approved! 👨‍👩‍👧‍👦</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
