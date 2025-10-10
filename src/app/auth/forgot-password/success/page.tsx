import { ReturnButton } from "@/components/return-button";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-lg" />
      </div>
      
      <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
        <div className="space-y-4">
          <ReturnButton href="/auth/login" label="Login" />

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Success</h1>

          <p className="text-gray-600 dark:text-gray-300">
            Success! You have sent a password reset link to your email.
          </p>
        </div>
      </div>
    </div>
  );
}