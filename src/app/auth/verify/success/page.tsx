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
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">✅ Email Verified!</h1>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
            <p className="text-green-800 dark:text-green-300 mb-4">
              Great! Your email has been successfully verified.
            </p>
            <p className="text-green-700 dark:text-green-400">
              You can now log in and start your personalized AI tutoring experience.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <ReturnButton href="/auth/login" label="Login Now" />
            <ReturnButton href="/" label="Back to Home" />
          </div>
        </div>
      </div>
    </div>
  );
}