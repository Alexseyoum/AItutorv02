import { ResetPasswordForm } from "@/components/reset-password-form";
import { ReturnButton } from "@/components/return-button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ token: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const token = (await searchParams).token;

  if (!token) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-lg" />
      </div>
      
      <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
        <div className="space-y-4">
          <ReturnButton href="/auth/login" label="Login" />

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>

          <p className="text-gray-600 dark:text-gray-300">
            Please enter your new password. Make sure it is at least 6 characters.
          </p>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}